// src/HomePage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { db, auth } from './firebase'; 
import { collection, getDocs } from 'firebase/firestore'; 
import { signOut } from 'firebase/auth';

import CreateSessionModal from './CreateSessionModal';
import SessionDetailsModal from './SessionDetailsModal';

// Import the local campus map image
import campusMap from './assets/campusMap.png';

const HomePage = () => {
  const [sessions, setSessions] = useState([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);

  const canvasRef = useRef(null);
  const [fakeUsers] = useState([
    { x: 270, y: 220, capacity: 100 }, // Thompson
    { x: 330, y: 120, capacity: 90 },  // 18 Ave LB
    { x: 500, y: 280, capacity: 90 },  // Union
    { x: 200, y: 110, capacity: 70 },  // Enerson
    { x: 170, y: 200, capacity: 60 },  // RPAC
  ]);

  // Fetch sessions from Firestore
  const fetchSessions = async () => {
    const now = new Date();
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
    fetchSessions();
  }, []);

  // Draw heatmap overlay
  useEffect(() => {
    const canvas = canvasRef.current;
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
            <button onClick={handleSignOut} className="sign-out-button">Sign Out</button>
          </div>

          <button 
            className="create-button-full" 
            style={{ width: '100%', marginBottom: '25px' }}
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
    </>
  );
};

export default HomePage;
