// src/HomePage.jsx
import React, { useEffect, useRef, useState } from 'react';
import { db, auth } from './firebase';
import { collection, getDocs } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import EditProfileModal from './EditProfileModal';
import CreateSessionModal from './CreateSessionModal';
import SessionDetailsModal from './SessionDetailsModal';
import campusMap from './assets/campusMap.png';

export default function HomePage() {
  const canvasRef = useRef(null);

  const [sessions, setSessions] = useState([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Initial hotspots including the two new zones
  const initialHotspots = [
    { x: 500, y: 210, people: 30 },
    { x: 325, y: 120, people: 100 },
    { x: 260, y: 220, people: 200 },
    { x: 380, y: 260, people: 50 },  // new zone 1
    { x: 210, y: 40, people: 80 },   // new zone 2
  ];
  const [hotspots, setHotspots] = useState(initialHotspots);
  const [tick, setTick] = useState(0);

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

  // Simulate people movement (0–800)
  useEffect(() => {
    const interval = setInterval(() => {
      setHotspots(prev =>
        prev.map(h => {
          const change = Math.floor(Math.random() * 201) - 100; // ±100
          let newCount = h.people + change;
          if (newCount < 0) newCount = 0;
          if (newCount > 800) newCount = 800;
          return { ...h, people: newCount };
        })
      );
      setTick(prev => prev + 1);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // Draw hotspots with radius scaling
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    hotspots.forEach(h => {
      let color;
      if (h.people <= 50) color = 'rgba(0,255,0,0.4)'; // green
      else if (h.people <= 400) color = 'rgba(255,255,0,0.4)'; // yellow
      else color = 'rgba(255,0,0,0.4)'; // red

      const minRadius = 20;
      const maxRadius = 100;
      const radius = minRadius + ((h.people / 800) * (maxRadius - minRadius));

      const gradient = ctx.createRadialGradient(h.x, h.y, 0, h.x, h.y, radius);
      gradient.addColorStop(0, color);
      gradient.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(h.x - radius, h.y - radius, radius * 2, radius * 2);
    });
  }, [hotspots]);

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
    <div className="home-layout" style={{ display: 'flex', gap: '20px', padding: '20px' }}>
      {/* Left column: session list */}
      <div className="session-list-container" style={{ flex: 1 }}>
        <div className="home-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Study Sessions</h2>
          <div>
            <button onClick={() => setIsEditModalOpen(true)} className="button-secondary" style={{ marginRight: '10px' }}>
              Edit Profile
            </button>
            <button onClick={handleSignOut} className="sign-out-button">
              Sign Out
            </button>
          </div>
        </div>

        <button
          className="create-button-full"
          style={{ width: '100%', marginBottom: '25px', backgroundColor: '#28a745', color: 'white', padding: '10px', borderRadius: '5px', cursor: 'pointer' }}
          onClick={() => setIsCreateModalOpen(true)}
        >
          + Create New Session
        </button>

        <div className="session-items">
          {sessions.map(session => (
            <div key={session.id} className="session-item-condensed" style={{ marginBottom: '15px' }}>
              <h3>{session.topic}</h3>
              <p className="session-location">{session.location}</p>
              {session.startTime?.seconds && (
                <p>
                  <strong>Starts:</strong> {new Date(session.startTime.seconds * 1000).toLocaleString()}
                </p>
              )}
              <button className="join-button" onClick={() => setSelectedSession(session)}>
                Details
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Right column: campus map with hotspots */}
      <div className="map-container" style={{ flex: 1 }}>
        <h3>Campus Map</h3>

        {/* Legend */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ width: '20px', height: '20px', backgroundColor: 'rgba(0,255,0,0.4)' }} />
            <span>Not busy</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ width: '20px', height: '20px', backgroundColor: 'rgba(255,255,0,0.4)' }} />
            <span>Moderately busy</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ width: '20px', height: '20px', backgroundColor: 'rgba(255,0,0,0.4)' }} />
            <span>Very busy</span>
          </div>
        </div>

        <div style={{ position: 'relative', width: 600, height: 400 }}>
          <img
            src={campusMap}
            alt="Campus Map"
            style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}
            onClick={handleClick}
          />
          <canvas ref={canvasRef} width={600} height={400} style={{ position: 'absolute', top: 0, left: 0 }} />
        </div>

        <div style={{ marginTop: 10 }}>
          {hotspots.map((h, i) => (
            <p key={i}>
              Zone {i + 1}: {h.people} people
            </p>
          ))}
          <p>Simulation ticks: {tick}</p>
        </div>
      </div>

      {/* Modals */}
      {isCreateModalOpen && <CreateSessionModal onClose={() => setIsCreateModalOpen(false)} onSessionCreated={fetchSessions} />}
      {selectedSession && <SessionDetailsModal session={selectedSession} onClose={() => setSelectedSession(null)} />}
      {isEditModalOpen && <EditProfileModal onClose={() => setIsEditModalOpen(false)} onProfileUpdated={() => {}} />}
    </div>
  );
}
