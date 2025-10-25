// src/HomePage.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db } from './firebase'; 
import { collection, addDoc, getDocs } from 'firebase/firestore'; 

const HomePage = () => {
  const [sessions, setSessions] = useState([]); 
  const [newSessionTopic, setNewSessionTopic] = useState(''); 

  const fetchSessions = async () => {
    const querySnapshot = await getDocs(collection(db, 'sessions'));
    const sessionsList = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })).sort((a, b) => b.createdAt.seconds - a.createdAt.seconds); // Sort by newest first
    setSessions(sessionsList);
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleCreateSession = async (e) => {
    e.preventDefault(); 
    if (newSessionTopic.trim() === '') return; 

    try {
      const docRef = await addDoc(collection(db, 'sessions'), {
        topic: newSessionTopic,
        createdAt: new Date()
      });
      
      console.log("Document written with ID: ", docRef.id);
      setNewSessionTopic(''); 
      fetchSessions(); 
    } catch (e) {
      console.error("Error adding document: ", e);
    }
  };

  return (
    // This is the new 2-column layout container
    <div className="home-layout">
      
      {/* --- Column 1: Session List --- */}
      <div className="session-list-container">
        <h2>Study Sessions</h2>

        <form onSubmit={handleCreateSession} className="session-form">
          <input
            type="text"
            value={newSessionTopic}
            onChange={(e) => setNewSessionTopic(e.target.value)}
            placeholder="New session topic (e.g., 'Chem 1210 Midterm')"
          />
          <button type="submit">Create</button>
        </form>

        <div className="session-items">
          {sessions.map(session => (
            <div key={session.id} className="session-item">
              <h3>{session.topic}</h3>
              <Link to={`/session/${session.id}`} className="join-button">
                Join
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* --- Column 2: Map Placeholder --- */}
      <div className="map-placeholder">
        <h3>Campus Map</h3>
        <p>Your interactive map will go here.</p>
      </div>

    </div>
  );
};

export default HomePage;