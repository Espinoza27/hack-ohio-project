import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { rtDB } from './firebase'; // <-- Import Realtime Database
import { ref, onValue, push, serverTimestamp } from 'firebase/database'; // <-- Import chat functions
import { userProfile } from "./Profile.js"; // Adjust path if needed

const defaultPic = 'https://i.pinimg.com/originals/73/83/4b/73834b0cfd3f4cf3f893ececab22a258.jpg';


const SessionPage = () => {
  const { sessionId } = useParams(); // Get session ID from URL
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sessionName, setSessionName] = useState('');

  // Fetch messages in real-time
  useEffect(() => {
    const messagesRef = ref(rtDB, `chats/${sessionId}`);

    // onValue() listens for changes and returns an unsubscribe function
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

    // Clean up the listener when the component unmounts
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [sessionId]);

  // This function runs when you submit the chat form
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim() === '') return;

    // Only send text + timestamp here (remove undefined userProfile/defaultPic)
    const messagesRef = ref(rtDB, `chats/${sessionId}`);
    push(messagesRef, {
      text: newMessage,
      timestamp: serverTimestamp(),
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
    </div>
  );
};


export default SessionPage;