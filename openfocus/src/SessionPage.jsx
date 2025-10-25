// src/SessionPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { rtDB, db, auth } from './firebase'; // <-- 1. Import auth and db
import { ref, onValue, push, serverTimestamp, remove } from 'firebase/database';
import { doc, getDoc, deleteDoc } from 'firebase/firestore'; // <-- 2. Import firestore functions

const SessionPage = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sessionData, setSessionData] = useState(null); // <-- 3. State for session info
  const [currentUser, setCurrentUser] = useState(auth.currentUser); // 4. Get current user

  // Listener for auth changes (if user signs out on this page)
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // 5. Fetch session data (like hostId and topic) on load
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

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim() === '' || !currentUser) return;

    push(ref(rtDB, `chats/${sessionId}`), {
      text: newMessage,
      timestamp: serverTimestamp(),
      senderName: currentUser.displayName || currentUser.email, // <-- Bonus: Add sender's name
      senderId: currentUser.uid,
    });
    setNewMessage('');
  };

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

  if (!sessionData) {
    return <div className="session-container"><h2>Loading...</h2></div>; // Loading state
  }

  return (
    <div className="session-container">
      {/* --- 6. CONDITIONAL "END SESSION" BUTTON --- */}
      {currentUser && sessionData.hostId === currentUser.uid && (
        <button 
          onClick={handleEndSession} 
          className="end-session-button" // Use a class instead of inline style
        >
          End Session
        </button>
      )}
      
      <h2>{sessionData.topic}</h2> {/* <-- 7. Show the real topic */}
      
      <div className="chat-box">
        {messages.map(msg => (
          <div key={msg.id} className="chat-message">
            {/* <-- Bonus: Show sender name --> */}
            <strong className="chat-sender">{msg.senderName || 'User'}</strong>
            <p>
              {msg.text} 
              <small>
                {msg.timestamp && new Date(msg.timestamp).toLocaleTimeString()}
              </small>
            </p>
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
        <button 
          onClick={() => navigate('/')} 
          className="button-secondary"
        >
          ← Back to Home
        </button>
      </div>
    </div>
  );
}

export default SessionPage;