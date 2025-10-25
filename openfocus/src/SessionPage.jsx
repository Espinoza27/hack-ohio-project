// src/SessionPage.jsx
//Line 53 for specific session page
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { rtDB } from './firebase'; // <-- Import Realtime Database
import { ref, onValue, push, serverTimestamp } from 'firebase/database'; // <-- Import chat functions

const SessionPage = () => {
  const { sessionId } = useParams(); // Get session ID from URL
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  // Set up a reference to the chat room for this specific session
  const messagesRef = ref(rtDB, `chats/${sessionId}`);

  // This hook sets up the real-time listener
  useEffect(() => {
    // onValue() listens for changes and fires every time data is added/changed
    onValue(messagesRef, (snapshot) => {
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
      onValue(messagesRef, () => {});
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



  
  //Session Page begins here
  //This is the page you get taken to when you click join
  return (
    <div style={{ 
      padding: '20px', 
      maxWidth: '800px', 
      margin: '0 auto', 
      backgroundColor: '#0d1117', 
      minHeight: '100vh',
      color: '#c9d1d9'
    }}>
      {/* Back to Home Button */}
      <button
        onClick={() => navigate('/')}
        style={{
          marginBottom: '20px',
          padding: '8px 16px',
          borderRadius: '6px',
          border: '1px solid #30363d',
          backgroundColor: '#21262d',
          color: '#c9d1d9',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '500',
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          e.target.style.backgroundColor = '#30363d';
          e.target.style.borderColor = '#8b949e';
        }}
        onMouseLeave={(e) => {
          e.target.style.backgroundColor = '#21262d';
          e.target.style.borderColor = '#30363d';
        }}
      >
        ← Return to Home
      </button>

      {/* Session Title */}
      <h2 style={{ 
        marginBottom: '20px', 
        color: '#c9d1d9', 
        fontSize: '24px', 
        fontWeight: '600' 
      }}>
        Study Session: {sessionId}
      </h2>
      
      {/* Chat Messages Display */}
      <div style={{
        border: '1px solid #30363d',
        borderRadius: '6px',
        padding: '16px',
        minHeight: '400px',
        backgroundColor: '#161b22',
        maxHeight: '500px',
        overflowY: 'auto',
        marginBottom: '15px'
      }}>
        {messages.length === 0 && (
          <p style={{ color: '#8b949e', textAlign: 'center', marginTop: '20px' }}>
            No messages yet. Start the conversation!
          </p>
        )}
        {messages.map((msg, index) => (
          <div 
            key={msg.id} 
            style={{ 
              paddingBottom: '15px',
              marginBottom: '15px',
              borderBottom: index < messages.length - 1 ? '1px solid #21262d' : 'none'
            }}
          >
            <p style={{ margin: 0, color: '#c9d1d9', lineHeight: '1.5' }}>
              {msg.text}
            </p>
            <small style={{ color: '#8b949e', fontSize: '12px' }}>
              {new Date(msg.timestamp).toLocaleTimeString()}
            </small>
          </div>
        ))}
      </div>

      {/* New Message Form */}
      <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '10px' }}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message..."
          style={{
            flexGrow: 1,
            padding: '10px 12px',
            borderRadius: '6px',
            border: '1px solid #30363d',
            backgroundColor: '#0d1117',
            color: '#c9d1d9',
            fontSize: '14px',
          }}
        />
        <button 
          type="submit"
          style={{
            padding: '10px 20px',
            borderRadius: '6px',
            border: '1px solid #238636',
            backgroundColor: '#238636',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#2ea043';
            e.target.style.borderColor = '#2ea043';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = '#238636';
            e.target.style.borderColor = '#238636';
          }}
        >
          Send
        </button>
      </form>
    </div>
  );
}

export default SessionPage;