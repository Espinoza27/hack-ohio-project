// src/HomePage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { db, auth } from './firebase'; 
import { collection, getDocs } from 'firebase/firestore'; 
import { signOut } from 'firebase/auth';
import EditProfileModal from './EditProfileModal';
import CreateSessionModal from './CreateSessionModal';
import SessionDetailsModal from './SessionDetailsModal';

// Import the local campus map image
import campusMap from './assets/campusMap.png';

export default function HomePage() {
  const canvasRef = useRef(null);

  const [sessions, setSessions] = useState([]);
  const [userJoinedSessions, setUserJoinedSessions] = useState({}); // {sessionId: true/false}
  const [sessionJoinCounts, setSessionJoinCounts] = useState({}); // {sessionId: count}
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null); // For the details modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const canvasRef = useRef(null);
  const [fakeUsers] = useState([
    { x: 100, y: 150, capacity: 30 },
    { x: 300, y: 200, capacity: 60 },
    { x: 500, y: 100, capacity: 40 }
  ]);

// Replace your old fetchSessions function with this
const fetchSessions = async () => {
  // Get the current time
  const now = new Date(); 

  // Get all sessions from the database
  const querySnapshot = await getDocs(collection(db, 'sessions'));

    const sessionsList = querySnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(session => !session.endTime || (session.endTime.seconds * 1000) > now.getTime())
      .sort((a, b) => {
        if (!a.startTime) return 1;
        if (!b.startTime) return -1;
        return a.startTime.seconds - b.startTime.seconds;
      });

    setSessions(sessionsList);
  };

  useEffect(() => {
    fetchSessionData();
    // Re-fetch when the current user changes (e.g., after login/sign up)
    const unsubscribe = auth.onAuthStateChanged(() => fetchSessionData());
    return () => unsubscribe();
  }, [currentUser]);


  // Draw heatmap overlay
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    fakeUsers.forEach(user => {
      const alpha = Math.min(Math.max(user.capacity / 100, 0), 1);
      const gradient = ctx.createRadialGradient(user.x, user.y, 0, user.x, user.y, 50);
      gradient.addColorStop(0, `rgba(255,0,0,${alpha})`);
      gradient.addColorStop(1, 'rgba(255,0,0,0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(user.x - 50, user.y - 50, 100, 100);
    });
  }, [fakeUsers]);

  const handleSignOut = () => {
    signOut(auth).catch(err => console.error('Sign out error:', err));
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
            <button 
      onClick={() => setIsEditModalOpen(true)} 
      className="button-secondary" // Use this for a nice gray style
      style={{marginRight: '10px'}}
    >
      Edit Profile
    </button>
            <button onClick={handleSignOut} className="sign-out-button">
              Sign Out
            </button>
          </div>

         <button 
  className="create-button-full" 
  style={{ 
    width: '100%', 
    marginBottom: '25px', 
    backgroundColor: '#28a745', // green
    color: 'white',             // text color
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

        {/* --- Column 2: Interactive Campus Map --- */}
        <div className="map-container" style={{ flex: 1 }}>
          <h3>Campus Map</h3>
          <div style={{ position: 'relative', width: 600, height: 400 }}>
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

      {/* --- Modals --- */}
      {isCreateModalOpen && (
        <CreateSessionModal 
          onClose={() => setIsCreateModalOpen(false)}
          onSessionCreated={fetchSessions}
        />
      )}

      {selectedSession && (
        <SessionDetailsModal
          session={selectedSession}
          onClose={() => setSelectedSession(null)}
        />
      )}
      {/* --- ADD THIS --- */}
      {isEditModalOpen && (
        <EditProfileModal
        onClose={() => setIsEditModalOpen(false)}
        onProfileUpdated={() => {
      // You could refresh data here if needed, but for now just close
  }}
  />
  )}
{/* --- END OF ADDITION --- */}
    </>
  );
};

export default HomePage;
