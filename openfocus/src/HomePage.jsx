// src/HomePage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { db, auth } from './firebase'; 
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore'; 
import { signOut } from 'firebase/auth';
import EditProfileModal from './EditProfileModal';

import CreateSessionModal from './CreateSessionModal';
import SessionDetailsModal from './SessionDetailsModal';
import { Link } from 'react-router-dom'; // <-- Needed for the simple Join button

// Import the local campus map image (assuming you still use this)
import campusMap from './assets/campusMap.png';

const HomePage = () => {
  const [sessions, setSessions] = useState([]);
  const [userJoinedSessions, setUserJoinedSessions] = useState({}); // {sessionId: true/false}
  const [sessionJoinCounts, setSessionJoinCounts] = useState({}); // {sessionId: count}
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null); 
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isMapLoading, setIsMapLoading] = useState(true);
  const canvasRef = useRef(null);
  const [fakeUsers] = useState([
    { x: 100, y: 150, capacity: 30 },
    { x: 300, y: 200, capacity: 60 },
    { x: 500, y: 100, capacity: 40 }
  ]);
  const currentUser = auth.currentUser;

  // Function to fetch all necessary data: sessions, user joins, and total counts
  const fetchSessionData = async () => {
    const now = new Date(); 

    // --- 1. Fetch ALL Sessions ---
    const sessionsSnapshot = await getDocs(collection(db, 'sessions'));
    const allSessions = sessionsSnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(session => !session.endTime || (session.endTime.seconds * 1000) > now.getTime());
      
    const activeSessionIds = allSessions.map(s => s.id);
    
    // --- 2. Fetch Join Counts ---
    const joinsSnapshot = await getDocs(collection(db, 'sessionJoins'));
    const joinCounts = {};
    const userJoins = {}; // For the current user

    joinsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const sessionId = data.sessionId;

      if (activeSessionIds.includes(sessionId)) {
          // Count total joins for the session
          joinCounts[sessionId] = (joinCounts[sessionId] || 0) + 1;
          
          // Check if current user joined this session
          if (currentUser && data.userId === currentUser.uid) {
              userJoins[sessionId] = true;
          }
      }
    });

    setSessions(allSessions.sort((a, b) => (a.startTime?.seconds || 0) - (b.startTime?.seconds || 0)));
    setUserJoinedSessions(userJoins);
    setSessionJoinCounts(joinCounts);
  };

  useEffect(() => {
    fetchSessionData();
    // Re-fetch when the current user changes (e.g., after login/sign up)
    const unsubscribe = auth.onAuthStateChanged(() => fetchSessionData());
    return () => unsubscribe();
  }, [currentUser]);


  // Draw heatmap overlay (remains the same)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const mapImg = new Image();
    mapImg.src = campusMap; 
    
    mapImg.onload = () => {
        fakeUsers.forEach(user => {
            const alpha = Math.min(Math.max(user.capacity / 100, 0), 1);
            const gradient = ctx.createRadialGradient(user.x, user.y, 0, user.x, user.y, 50);
            gradient.addColorStop(0, `rgba(255,0,0,${alpha})`);
            gradient.addColorStop(1, 'rgba(255,0,0,0)');
            ctx.fillStyle = gradient;
            ctx.fillRect(user.x - 50, user.y - 50, 100, 100);
        });

        setIsMapLoading(false);
    };

  }, [fakeUsers]);

  const handleSignOut = () => {
    signOut(auth).catch(error => console.error("Sign out error:", error));
  };

  const handleClick = (e) => {
    const rect = e.target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    console.log(`Clicked coordinates: x=${x}, y=${y}`);
  };

  return (
    <>
      <div className="home-layout">
        {/* --- Column 1: Session List --- */}
        <div className="session-list-container">
          <div className="home-header">
            <h2>Study Sessions</h2>
            <div>
              <button 
                onClick={() => setIsEditModalOpen(true)} 
                className="button-secondary" 
                style={{marginRight: '10px'}}
              >
                Edit Profile
              </button>
              <button onClick={handleSignOut} className="sign-out-button">
                Sign Out
              </button>
            </div>
          </div>

         <button 
            className="create-button-full" 
            style={{ 
              width: '100%', 
              marginBottom: '25px', 
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              padding: '10px',
              fontSize: '16px',
              cursor: 'pointer',
              borderRadius: '5px'
            }}
            onClick={() => setIsCreateModalOpen(true)}
          >
            + Create New Session
          </button>

          {/* --- The main list display logic is here --- */}
          <div className="session-items">
            {sessions.map(session => {
              const hasJoined = userJoinedSessions[session.id];
              const joinCount = sessionJoinCounts[session.id] || 0;

              return (
                <div key={session.id} className="session-item-condensed">
                  <div>
                    <h3>{session.topic}</h3>
                    <p className="session-location">
                      {session.location} | {session.floor}
                      </p>
                      <p className="session-location-details">
                        {session.wing}
                        </p>
                    {session.startTime?.seconds && (
                      <p className="session-time-start">
                        <strong>Starts:</strong> {new Date(session.startTime.seconds * 1000).toLocaleString()}
                      </p>
                    )}
                    <p className="session-time-start" style={{marginTop: '5px', color: '#646cff'}}>
                       {joinCount} joined
                    </p>
                  </div>
                  {/* --- CONDITIONAL BUTTON RENDERING --- */}
                  {hasJoined ? (
                    <Link to={`/session/${session.id}`} className="join-button">
                      Join
                    </Link>
                  ) : (
                    <button 
                      className="join-button" 
                      onClick={() => setSelectedSession(session)}
                    >
                      Details
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* --- Column 2: Interactive Campus Map --- */}
        <div className="map-container" style={{ flex: 1 }}>
          <h3>Campus Map</h3>
          <div className="map-wrapper">
            
            {isMapLoading && (
                <div className="map-loading-overlay">
                    <p>Loading Campus Data...</p>
                </div>
            )}

            <div style={{ position: 'relative', width: 600, height: 400, opacity: isMapLoading ? 0.3 : 1 }}>
              <img
                src={campusMap}
                alt="Campus Map"
                style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}
                onClick={handleClick}
              />
              <canvas
                ref={canvasRef}
                width={600}
                height={400}
                style={{ position: 'absolute', top: 0, left: 0 }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* --- Modals --- */}
      {isCreateModalOpen && (
        <CreateSessionModal 
          onClose={() => setIsCreateModalOpen(false)}
          onSessionCreated={fetchSessionData} // Use the combined fetch function
        />
      )}

      {selectedSession && (
        <SessionDetailsModal
          session={selectedSession}
          onClose={() => setSelectedSession(null)}
        />
      )}
      {isEditModalOpen && (
        <EditProfileModal
          onClose={() => setIsEditModalOpen(false)}
          onProfileUpdated={fetchSessionData}
        />
      )}
    </>
  );
};

export default HomePage;