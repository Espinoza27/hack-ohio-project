// src/HomePage.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db } from './firebase'; // <-- Import your Firebase config
import { collection, addDoc, getDocs } from 'firebase/firestore'; // <-- Import Firestore functions

const HomePage = () => {
  const [sessions, setSessions] = useState([]); // Holds the list of sessions
  const [newSessionTopic, setNewSessionTopic] = useState(''); // Holds text from the input box

  // This function runs when the component first loads
  const fetchSessions = async () => {
    const querySnapshot = await getDocs(collection(db, 'sessions'));
    const sessionsList = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setSessions(sessionsList);
  };

  // This hook makes fetchSessions() run once
  useEffect(() => {
    fetchSessions();
  }, []);

  // This function runs when you click the "Create" button
  const handleCreateSession = async (e) => {
    e.preventDefault(); // Prevents the page from reloading
    if (newSessionTopic.trim() === '') return; // Don't create empty sessions

    try {
      // Add a new document to the "sessions" collection in Firestore
      const docRef = await addDoc(collection(db, 'sessions'), {
        topic: newSessionTopic,
        createdAt: new Date()
      });
      
      console.log("Document written with ID: ", docRef.id);
      setNewSessionTopic(''); // Clear the input box
      fetchSessions(); // Refresh the list of sessions
    } catch (e) {
      console.error("Error adding document: ", e);
    }
  };

  return (
    <div>
      <h2>Study Sessions</h2>

      {/* --- Form to Create New Session --- */}
      <form onSubmit={handleCreateSession}>
        <input
          type="text"
          value={newSessionTopic}
          onChange={(e) => setNewSessionTopic(e.target.value)}
          placeholder="New session topic (e.g., 'Chem 1210 Midterm')"
        />
        <button type="submit">Create Session</button>
      </form>

      <hr />

      {/* --- List of Existing Sessions --- */}
      {sessions.map(session => (
        <div key={session.id} style={{ margin: '10px 0' }}>
          <h3>{session.topic}</h3>
          <Link to={`/session/${session.id}`}>
            Join Session
          </Link>
        </div>
      ))}
    </div>
  );
};

export default HomePage;