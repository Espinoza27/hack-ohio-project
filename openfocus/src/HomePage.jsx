// src/HomePage.jsx
import React, { useState, useEffect } from 'react';
import { db, auth } from './firebase'; 
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore'; 
import { signOut } from 'firebase/auth';

// Import your new modal components
import CreateSessionModal from './CreateSessionModal';
import SessionDetailsModal from './SessionDetailsModal';

const HomePage = () => {
  const [sessions, setSessions] = useState([]); 
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null); // For the details modal

// Replace your old fetchSessions function with this
const fetchSessions = async () => {
  // Get the current time
  const now = new Date(); 

  // Get all sessions from the database
  const querySnapshot = await getDocs(collection(db, 'sessions'));

  const sessionsList = querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }))
  .filter(session => {
    // This is the new logic:
    // Keep the session if:
    // 1. The endTime field (endTime) is not set (it's null or undefined)
    // OR
    // 2. The endTime is in the future
    return !session.endTime || (session.endTime.seconds * 1000) > now.getTime();
  })
  .sort((a, b) => {
    // Sort by start time, soonest first
    if (!a.startTime) return 1; // Put sessions without start time at the end
    if (!b.startTime) return -1;
    return a.startTime.seconds - b.startTime.seconds;
  }); 

  setSessions(sessionsList);
};

  useEffect(() => {
    fetchSessions();
  }, []);
  
  const handleSignOut = () => {
    signOut(auth).catch((error) => {
      console.error("Sign out error:", error);
    });
  };

  return (
    <> {/* Use a Fragment to hold modals and layout */}
      <div className="home-layout">
        
        {/* --- Column 1: Session List --- */}
        <div className="session-list-container">
          <div className="home-header">
            <h2>Study Sessions</h2>
            <button onClick={handleSignOut} className="sign-out-button">
              Sign Out
            </button>
          </div>

          <button 
            className="create-button-full" 
            style={{width: '100%', marginBottom: '25px'}}
            onClick={() => setIsCreateModalOpen(true)}
          >
            + Create New Session
          </button>

          {/* --- This is the new, condensed session list --- */}
          <div className="session-items">
            {sessions.map(session => (
              <div key={session.id} className="session-item-condensed">
                <div>
                  <h3>{session.topic}</h3>
                  <p className="session-location">{session.location}</p>
                  {session.startTime?.seconds && (
                    <p className="session-time-start">
                      <strong>Starts:</strong> {new Date(session.startTime.seconds * 1000).toLocaleString()}
                    </p>
                  )}
                </div>
                <button 
                  className="join-button" 
                  onClick={() => setSelectedSession(session)}
                >
                  Details
                </button>
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

      {/* --- Modals --- */}
      {/* These live outside the layout and are shown when state is true */}
      
      {isCreateModalOpen && (
        <CreateSessionModal 
          onClose={() => setIsCreateModalOpen(false)}
          onSessionCreated={() => {
            fetchSessions(); // Refresh the list after creation
          }}
        />
      )}

      {selectedSession && (
        <SessionDetailsModal
          session={selectedSession}
          onClose={() => setSelectedSession(null)}
        />
      )}
    </>
  );
}

export default HomePage;
