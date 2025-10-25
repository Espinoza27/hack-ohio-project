import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { rtDB, db } from './firebase';
import { ref, onValue, push, serverTimestamp, remove } from 'firebase/database';
import { doc, deleteDoc } from 'firebase/firestore';

const SessionPage = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  // Set up a reference to the chat room for this specific session
  const messagesRef = ref(rtDB, `chats/${sessionId}`);

  // This hook sets up the real-time listener
  useEffect(() => {
    // onValue() listens for changes and returns an unsubscribe function
    const unsubscribe = onValue(messagesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Convert the messages object into an array
        const messagesList = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        setMessages(messagesList);
      } else {
        setMessages([]);
      }
    });

    // Clean up the listener when the component unmounts
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [sessionId]); // Re-run if the sessionId changes

  // This function runs when you submit the chat form
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim() === '') return;

    // Push a new message to the Realtime Database
    push(messagesRef, {
      text: newMessage,
      timestamp: serverTimestamp(),
      // You can add a user's name here later
    });

    setNewMessage(''); // Clear the input box
  };

  // End session: delete Firestore session doc and Realtime chat history
  const handleEndSession = async () => {
    if (!window.confirm("Are you sure you want to end this session? This will delete all messages and the session itself.")) {
      return;
    }
    try {
      // 1. Delete the Firestore document for the session
      const sessionDocRef = doc(db, 'sessions', sessionId);
      await deleteDoc(sessionDocRef);

      // 2. Delete the chat history from Realtime Database
      const chatRef = ref(rtDB, `chats/${sessionId}`);
      await remove(chatRef);

      // 3. Navigate back to the home page
      navigate('/');
    } catch (error) {
      console.error("Error ending session: ", error);
      alert("Failed to end session. Please try again.");
    }
  };

  // Session Page begins here
  return (
    <div className="session-container">
      <button
        onClick={handleEndSession}
        style={{ float: 'right', backgroundColor: '#d9534f', borderColor: '#d43f3a' }}
      >
        End Session
      </button>

      <h2>Study Session: {sessionId}</h2>

      {/* --- Chat Messages Display --- */}
      <div className="chat-box">
        {messages.map(msg => (
          <div key={msg.id} className="chat-message">
            <p>
              {msg.text}
              <small>
                {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString() : ''}
              </small>
            </p>
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
        <button type="submit">Send</button>
      </form>

      {/* --- Back to Home Button --- */}
      <div style={{ marginTop: '20px', textAlign: 'center' }}>
        <button
          onClick={() => navigate('/')}
          style={{
            padding: '8px 16px',
            fontSize: '14px',
            backgroundColor: '#f0f0f0',
            border: '1px solid #ccc',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          ← Back to Home
        </button>
      </div>

    </div>
  );
}

export default SessionPage;