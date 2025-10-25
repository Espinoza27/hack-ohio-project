// src/SessionPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { rtDB, db, auth } from './firebase'; // Import all firebase services
import { ref, onValue, push, serverTimestamp, remove } from 'firebase/database';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';
import UserProfileModal from './UserProfileModal'; // <-- 1. Import new modal

const defaultPic = 'https://i.pinimg.com/originals/73/83/4b/73834b0cfd3f4cf3f893ececab22a258.jpg';

const SessionPage = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sessionData, setSessionData] = useState(null);
  const [currentUser, setCurrentUser] = useState(auth.currentUser);
  const [viewingProfileId, setViewingProfileId] = useState(null); // <-- 2. Add state for modal

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => setCurrentUser(user));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchSessionData = async () => {
      const docRef = doc(db, 'sessions', sessionId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setSessionData(docSnap.data());
      } else {
        navigate('/');
      }
    };
    fetchSessionData();
  }, [sessionId, navigate]);

  useEffect(() => {
    const messagesRef = ref(rtDB, `chats/${sessionId}`);
    const unsubscribe = onValue(messagesRef, (snapshot) => {
      const data = snapshot.val();
      const messagesList = data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) : [];
      setMessages(messagesList);
    });
    return () => unsubscribe();
  }, [sessionId]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim() === '' || !currentUser) return;

    push(ref(rtDB, `chats/${sessionId}`), {
      text: newMessage,
      timestamp: serverTimestamp(),
      senderId: currentUser.uid,
      senderName: currentUser.displayName || currentUser.email,
      profilePic: currentUser.photoURL || defaultPic,
    });
    setNewMessage('');
  };

  const handleEndSession = async () => {
    if (!window.confirm("Are you sure you want to end this session?")) {
      return;
    }
    try {
      await deleteDoc(doc(db, 'sessions', sessionId));
      await remove(ref(rtDB, `chats/${sessionId}`));
      navigate('/');
    } catch (error) {
      console.error("Error ending session: ", error);
    }
  };

  if (!sessionData) {
    return <div className="session-container"><h2>Loading...</h2></div>;
  }

  return (
    <> {/* Use fragment to allow modal to sit outside container */}
      <div className="session-container">
        {currentUser && sessionData.hostId === currentUser.uid && (
          <button onClick={handleEndSession} className="end-session-button">
            End Session
          </button>
        )}
        
        <h2>{sessionData.topic}</h2>
        
        <div className="chat-box">
          {messages.map(msg => (
            <div key={msg.id} className="chat-message-with-pic">
              <img src={msg.profilePic || defaultPic} alt="profile" className="chat-profile-pic" />
              <div className="chat-message">
                {/* --- 3. Make name clickable --- */}
                <strong 
                  className="chat-sender clickable" 
                  onClick={() => setViewingProfileId(msg.senderId)}
                >
                  {msg.senderName || 'User'}
                </strong>
                <p>
                  {msg.text} 
                  <small>
                    {msg.timestamp && new Date(msg.timestamp).toLocaleTimeString()}
                  </small>
                </p>
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={handleSendMessage} className="chat-form">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
          />
          <button type="submit">Send</button>
        </form>

        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <button onClick={() => navigate('/')} className="button-secondary">
            ← Back to Home
          </button>
        </div>
      </div>
      
      {/* --- 4. Conditionally render the modal --- */}
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