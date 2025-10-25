// src/SessionPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { rtDB } from './firebase';
import { ref, onValue, push, serverTimestamp } from 'firebase/database';

const SessionPage = () => {
  const { sessionId } = useParams(); // Get session ID from URL
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  // Fetch messages in real-time
  useEffect(() => {
    const messagesRef = ref(rtDB, `chats/${sessionId}`);
    const unsubscribe = onValue(messagesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const messagesList = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));
        setMessages(messagesList);
      } else {
        setMessages([]);
      }
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [sessionId]);

  // Send a new chat message
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim() === '') return;

    const messagesRef = ref(rtDB, `chats/${sessionId}`);
    push(messagesRef, {
      text: newMessage,
      timestamp: serverTimestamp(),
    });

    setNewMessage('');
  };

  return (
    <div className="session-container">
      <h2>Study Session: {sessionId}</h2>

      {/* Chat Messages Display */}
      <div className="chat-box">
        {messages.map((msg) => (
          <div key={msg.id} className="chat-message">
            <p>
              {msg.text}{' '}
              <small>
                {msg.timestamp
                  ? new Date(msg.timestamp).toLocaleTimeString()
                  : '...'}
              </small>
            </p>
          </div>
        ))}
      </div>

      {/* Send Message Form */}
      <form
        onSubmit={handleSendMessage}
        style={{ display: 'flex', gap: '10px', marginTop: '15px' }}
      >
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message..."
          style={{ flex: 1, padding: '8px', borderRadius: '5px' }}
        />
        <button
          type="submit"
          style={{
            padding: '8px 16px',
            borderRadius: '5px',
            border: 'none',
            backgroundColor: '#bb0000',
            color: '#fff',
            cursor: 'pointer',
          }}
        >
          Send
        </button>
      </form>

      {/* Back to Home Button */}
      <button
        onClick={() => navigate('/')}
        style={{
          marginTop: '10px',
          padding: '8px 16px',
          borderRadius: '5px',
          border: 'none',
          backgroundColor: '#007700',
          color: '#fff',
          cursor: 'pointer',
        }}
      >
        ← Back to Home
      </button>
    </div>
  );
};

export default SessionPage;
