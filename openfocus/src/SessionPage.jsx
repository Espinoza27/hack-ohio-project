// src/SessionPage.jsx
//Line 53 for specific session page
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom'; // <-- Fixed and combined
import { rtDB, db } from './firebase'; // <-- Combined Firebase imports
import { ref, onValue, push, serverTimestamp, remove } from 'firebase/database'; // <-- Combined DB imports
import { doc, deleteDoc } from 'firebase/firestore';

const SessionPage = () => {
  const { sessionId } = useParams(); // Get session ID from URL
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const navigate = useNavigate();

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

  // Add this new function
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

  //Session Page begins here
  //This is the page you get taken to when you click join
  return (
    <div className="session-container">
      <button 
        onClick={handleEndSession} 
        style={{ float: 'right', backgroundColor: '#d9534f', borderColor: '#d43f3a' }}
      >
        End Session
      </button>
      {/* --- END OF BUTTON --- */}
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
    </div>
  );
}

export default SessionPage;