// src/SessionPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom'; // Added useNavigate
import { rtDB, db, auth } from './firebase'; // Import all firebase services
import { ref, onValue, push, serverTimestamp, remove } from 'firebase/database'; // Realtime DB functions
import { doc, getDoc, deleteDoc } from 'firebase/firestore'; // Firestore functions
import UserProfileModal from './UserProfileModal'; // Import profile modal

// Default picture if a user doesn't have one
const defaultPic = 'https://i.pinimg.com/originals/73/83/4b/73834b0cfd3f4cf3f893ececab22a258.jpg';


const SessionPage = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sessionData, setSessionData] = useState(null); // To store session topic, host, etc.
  const [currentUser, setCurrentUser] = useState(auth.currentUser);
  const [viewingProfileId, setViewingProfileId] = useState(null); // State for profile modal

  // Listen for any auth changes
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Fetch session data (like hostId and topic) on load
  useEffect(() => {
    const fetchSessionData = async () => {
      const docRef = doc(db, 'sessions', sessionId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setSessionData(docSnap.data());
      } else {
        console.log("No such session!");
        navigate('/'); // Session doesn't exist, go home
      }
    };
    fetchSessionData();
  }, [sessionId, navigate]);

  // Fetch chat messages in real-time
  useEffect(() => {
    const messagesRef = ref(rtDB, `chats/${sessionId}`);
    const unsubscribe = onValue(messagesRef, (snapshot) => {
      const data = snapshot.val();
      const messagesList = data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) : [];
      setMessages(messagesList);
    });
    return () => unsubscribe();
  }, [sessionId]);

  // Send a new chat message
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim() === '' || !currentUser) return; // Check for user

    push(ref(rtDB, `chats/${sessionId}`), {
      text: newMessage,
      timestamp: serverTimestamp(),
      senderId: currentUser.uid,
      senderName: currentUser.displayName || currentUser.email,
      profilePic: currentUser.photoURL || defaultPic,
    });
    setNewMessage(''); // Clear the input box
  };

  // Delete the session and its chat (only visible to host)
  const handleEndSession = async () => {
    if (!window.confirm("Are you sure you want to end this session? This will delete all messages and the session itself.")) {
      return;
    }
    try {
      await deleteDoc(doc(db, 'sessions', sessionId));
      await remove(ref(rtDB, `chats/${sessionId}`));
      navigate('/');
    } catch (error) {
      console.error("Error ending session: ", error);
      alert("Failed to end session. Please try again.");
    }
  };

  // Show loading while session data fetches
  if (!sessionData) {
    return <div className="session-container"><h2>Loading...</h2></div>;
  }

  // Session Page begins here
  return (
    <> {/* Use fragment to allow modal to sit outside container */}
      <div className="session-container">
        {/* Show "End Session" button ONLY if current user is the host */}
        {currentUser && sessionData.hostId === currentUser.uid && (
          <button
            onClick={handleEndSession}
            className="end-session-button"
          >
            End Session
          </button>
        )}

        <h2>{sessionData.topic}</h2> {/* Display the actual topic */}

        {/* --- Chat Messages Display --- */}
        <div className="chat-box">
          {messages.map(msg => (
            <div key={msg.id} className="chat-message-with-pic"> {/* Use container for pic+msg */}
              <img src={msg.profilePic || defaultPic} alt="profile" className="chat-profile-pic" />
              <div className="chat-message">
                <strong
                  className="chat-sender clickable" // Make name clickable
                  onClick={() => setViewingProfileId(msg.senderId)} // Open profile modal
                >
                  {msg.senderName || 'User'}
                </strong>
                <p>
                  {msg.text}
                  <small>
                    {/* Check if timestamp exists before formatting */}
                    {msg.timestamp && new Date(msg.timestamp).toLocaleTimeString()}
                  </small>
                </p>
              </div> {/* Close chat-message div */}
            </div>
          ))}
        </div>

        {/* --- New Message Form --- */}
        <form onSubmit={handleSendMessage} className="chat-form">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
          />
          {/* Corrected button label */}
          <button type="submit">Send</button>
        </form>

        {/* --- Back to Home Button --- */}
        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <button
            onClick={() => navigate('/')}
            className="button-secondary" // Use style from App.css
          >
            ← Back to Home
          </button>
        </div>

      </div>

      {/* --- Conditionally render the User Profile Modal --- */}
      {viewingProfileId && (
        <UserProfileModal
          userId={viewingProfileId}
          onClose={() => setViewingProfileId(null)}
        />
      )}
    </>
  );
}
export default SessionPage;