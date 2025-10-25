import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { rtDB } from './firebase'; // <-- Import Realtime Database
import { ref, onValue, push, serverTimestamp } from 'firebase/database'; // <-- Import chat functions

const SessionPage = () => {
  const { sessionId } = useParams(); // Get session ID from URL
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sessionName, setSessionName] = useState('');

  const messagesRef = ref(rtDB, `chats/${sessionId}`);

  // Fetch messages in real-time
  useEffect(() => {
    // onValue() listens for changes and fires every time data is added/changed
    onValue(messagesRef, (snapshot) => {
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

    // Clean up the listener when the component unmounts
    return () => {
      onValue(messagesRef, () => {});
    };
  }, [sessionId]); // Re-run if the sessionId changes

  // This function runs when you submit the chat form
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim() === '') return;

    push(messagesRef, {
      text: newMessage,
      timestamp: serverTimestamp(),
      userName: userProfile.name,
      userPic: userProfile.picture || defaultPic,
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
            </div>
          </div>
        ))}
      </div>

      {/* Send Message */}
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
          style={{ padding: '8px 16px', borderRadius: '5px', border: 'none', backgroundColor: '#bb0000', color: '#fff', cursor: 'pointer' }}
        >
          Send
        </button>
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
};

export default SessionPage;
