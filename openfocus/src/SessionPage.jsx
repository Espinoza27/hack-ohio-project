// src/SessionPage.jsx
//Line 53 for specific session page
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { rtDB } from './firebase'; // <-- Import Realtime Database
import { ref, onValue, push, serverTimestamp } from 'firebase/database'; // <-- Import chat functions

const SessionPage = () => {
  const { sessionId } = useParams(); // Get session ID from URL
  const navigate = useNavigate(); // Hook for navigation
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
    <div className="session-container">
      <h2>Study Session: {sessionId}</h2>
      
      {/* --- Chat Messages Display --- */}
      <div className="chat-box">
        {messages.map(msg => (
          <div key={msg.id} className="chat-message">
            <p>
              {msg.text} 
              <small>
                {new Date(msg.timestamp).toLocaleTimeString()}
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