// src/SessionPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { rtDB } from './firebase'; // Realtime Database
import { ref, onValue, push, serverTimestamp } from 'firebase/database';
import { userProfile } from './Profile.js'; // Make sure Profile.js exports userProfile


const defaultPic = 'https://i.pinimg.com/originals/73/83/4b/73834b0cfd3f4cf3f893ececab22a258.jpg';


const SessionPage = () => {
  const { sessionId } = useParams(); // Session ID from URL
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sessionName, setSessionName] = useState('');


  // Reference to the chat room
  const messagesRef = ref(rtDB, `chats/${sessionId}`);


  // Fetch messages in real-time
  useEffect(() => {
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


    // Cleanup listener
    return () => unsubscribe();
  }, [sessionId]);


  // Fetch session name (or use sessionId as placeholder)
  useEffect(() => {
    // Replace with Firestore fetch if needed
    setSessionName(sessionId);
  }, [sessionId]);


  // Send a new message
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim() === '') return;


    push(messagesRef, {
      text: newMessage,
      timestamp: serverTimestamp(),
      userName: userProfile.name,
      userPic: userProfile.picture || defaultPic,
    });


    setNewMessage('');
  };


  return (
    <div className="session-container" style={{ padding: '20px', maxWidth: '700px', margin: '0 auto' }}>
      {/* --- Home Return Button --- */}
      <button
        onClick={() => navigate('/')}
        style={{
          marginBottom: '20px',
          padding: '8px 16px',
          borderRadius: '5px',
          border: 'none',
          backgroundColor: '#bb0000',
          color: '#fff',
          cursor: 'pointer',
        }}
      >
        Return to Home
      </button>


      {/* --- Session Title --- */}
      <h2 className="session-title" style={{ marginBottom: '20px' }}>
        Study Session: {sessionName || 'Loading...'}
      </h2>


      {/* --- Chat Messages --- */}
      <div
        className="chat-box"
        style={{
          border: '1px solid #bbb',
          borderRadius: '8px',
          padding: '10px',
          minHeight: '400px',
          backgroundColor: '#f7f7f7',
        }}
      >
        {messages.length === 0 && <p className="no-messages">No messages yet. Start the conversation!</p>}
        {messages.map((msg, index) => (
          <div
            key={msg.id}
            style={{ display: 'flex', gap: '10px', marginBottom: '15px', alignItems: 'flex-start' }}
          >
            {/* Profile Picture */}
            <img
              src={msg.userPic || defaultPic}
              alt={msg.userName || 'Unknown'}
              style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
            />
            <div>
              {/* User Name */}
              <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#333' }}>
                {msg.userName || 'Unknown'}
              </div>
              {/* Message Text */}
              <div style={{ fontSize: '16px', color: '#111' }}>{msg.text}</div>
              {/* Timestamp */}
              <small style={{ fontSize: '10px', color: '#555' }}>
                {msg.timestamp
                  ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : ''}
              </small>
            </div>
          </div>
        ))}
      </div>


      {/* --- New Message Form --- */}
      <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message..."
          style={{ flexGrow: 1, padding: '8px 12px', borderRadius: '5px', border: '1px solid #ccc' }}
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
    </div>
  );
};


export default SessionPage;






