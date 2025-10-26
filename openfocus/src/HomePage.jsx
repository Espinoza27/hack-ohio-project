// src/HomePage.jsx
import React, { useEffect, useRef, useState } from 'react';
import { db, auth } from './firebase';
import { collection, getDocs, writeBatch, Timestamp, query, where } from 'firebase/firestore'; 
import { signOut } from 'firebase/auth';
import { Link } from 'react-router-dom';
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
  const [userJoinedSessions, setUserJoinedSessions] = useState({}); 
  const [sessionJoinCounts, setSessionJoinCounts] = useState({});
  const [tick, setTick] = useState(0); 
  const [classFilter, setClassFilter] = useState("");
  const [customClass, setCustomClass] = useState("");
  const currentUser = auth.currentUser;

  const initialHotspots = [
    { x: 500, y: 210, people: 30 },
    { x: 325, y: 120, people: 100 },
    { x: 260, y: 220, people: 200 },
    { x: 380, y: 260, people: 50 },
    { x: 210, y: 40, people: 80 }
  ];
  const [hotspots, setHotspots] = useState(initialHotspots);

  const classOptions = [
    "",
    "CSE", "MATH", "PHYSICS", "ECE", "ENGLISH", 
    "SPANISH", "BIO", "CHEM", "STAT", "HIST", "ECON"
  ];

  const cleanupExpiredSessions = async () => {
    const now = Timestamp.now();
    const expiredQuery = query(
      collection(db, 'sessions'),
      where('endTime', '<', now)
    );
    const snapshot = await getDocs(expiredQuery);
    if (snapshot.empty) return;
    const batch = writeBatch(db);
    snapshot.docs.forEach(sessionDoc => {
      batch.delete(sessionDoc.ref);
    });
    await batch.commit();
  };

  const fetchSessionData = async () => {
    await cleanupExpiredSessions();

    const now = new Date(); 
    const sessionsSnapshot = await getDocs(collection(db, 'sessions'));
    const allSessions = sessionsSnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(session => !session.endTime || (session.endTime.seconds * 1000) > now.getTime());
    const activeSessionIds = allSessions.map(s => s.id);
    const joinsSnapshot = await getDocs(collection(db, 'sessionJoins'));
    const joinCounts = {};
    const userJoins = {}; 

    joinsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const sessionId = data.sessionId;
      if (activeSessionIds.includes(sessionId)) {
        joinCounts[sessionId] = (joinCounts[sessionId] || 0) + 1;
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
    const unsubscribe = auth.onAuthStateChanged(() => fetchSessionData());
    return () => unsubscribe();
  }, [currentUser]);

  useEffect(() => {
    const interval = setInterval(() => {
      setHotspots(prev =>
        prev.map(h => {
          const change = Math.floor(Math.random() * 201) - 100;
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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    hotspots.forEach(h => {
      let color;
      if (h.people <= 50) color = 'rgba(0,255,0,0.4)';
      else if (h.people <= 400) color = 'rgba(255,255,0,0.4)';
      else color = 'rgba(255,0,0,0.4)';
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

  function matchesFilter(session) {
    if (!classFilter && !customClass) return true;
    const topic = (session.topic || "").toLowerCase();
    if (customClass && topic.includes(customClass.toLowerCase())) return true;
    if (classFilter && topic.includes(classFilter.toLowerCase())) return true;
    return false;
  }

  const filteredSessions = sessions.filter(matchesFilter);

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
      <div className="home-layout" style={{ display: 'flex', gap: '20px', padding: '20px' }}>
        {/* Left column */}
        <div className="session-list-container" style={{ flex: 1 }}>
          <div className="home-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>Study Sessions</h2>
            <div style={{ display: 'flex', gap: '15px' }}>
              <button onClick={() => setIsEditModalOpen(true)} className="button-secondary">Edit Profile</button>
              <button onClick={handleSignOut} className="sign-out-button">Sign Out</button>
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
            {filteredSessions.map(session => {
              const hasJoined = userJoinedSessions[session.id];
              const joinCount = sessionJoinCounts[session.id] || 0;
              return (
                <div key={session.id} className="session-item-condensed">
                  <div>
                    <h3>{session.topic}</h3>
                    <p className="session-location">{session.location}</p>
                    <p className="session-location-details">{session.floor} | {session.wing}</p>
                    {session.startTime?.seconds && (
                      <p className="session-time-start">
                        <strong>Starts:</strong> {new Date(session.startTime.seconds * 1000).toLocaleString()}
                      </p>
                    )}
                    <p className="session-time-start" style={{marginTop: '5px', color: '#646cff'}}>
                       {joinCount} joined
                    </p>
                  </div>
                  {hasJoined ? (
                    <Link to={`/session/${session.id}`} className="join-button">Join</Link>
                  ) : (
                    <button className="join-button" onClick={() => setSelectedSession(session)}>Details</button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right column */}
        <div className="map-container" style={{ flex: 1 }}>
          <h3>Campus Map</h3>

          {/* Legend */}
          <div style={{ display: 'flex', gap: '20px', marginBottom: '15px', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <div style={{ width: 20, height: 20, backgroundColor: 'rgba(0,255,0,0.4)', borderRadius: '50%' }} />
              <span>Not Busy</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <div style={{ width: 20, height: 20, backgroundColor: 'rgba(255,255,0,0.4)', borderRadius: '50%' }} />
              <span>Moderately Busy</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <div style={{ width: 20, height: 20, backgroundColor: 'rgba(255,0,0,0.4)', borderRadius: '50%' }} />
              <span>Very Busy</span>
            </div>
          </div>

          {/* Filter */}
          <div style={{
            display: "flex", alignItems: "center", gap: "10px",
            marginBottom: "15px", background: "#222",
            padding: "14px 20px", borderRadius: "10px",
            boxShadow: "0 1px 6px rgba(0,0,0,0.16)"
          }}>
            <label style={{color:"#fff", fontWeight:600}}>Filter by Class:</label>
            <select
              value={classFilter}
              onChange={e => setClassFilter(e.target.value)}
              style={{ minWidth: 120, padding: "8px", borderRadius: "6px", fontSize: "15px", border: "1px solid #999" }}
            >
              <option value="">All Classes</option>
              {classOptions.slice(1).map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Custom class"
              value={customClass}
              onChange={e => setCustomClass(e.target.value)}
              style={{ minWidth:150, padding: "8px", borderRadius: "6px", fontSize: "15px", border: "1px solid #999" }}
            />
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
              <p key={i}>Zone {i + 1}: {h.people} people</p>
            ))}
            <p>Simulation ticks: {tick}</p>
          </div>
        </div>
      </div>

      {/* Modals */}
      {isCreateModalOpen && <CreateSessionModal onClose={() => setIsCreateModalOpen(false)} onSessionCreated={fetchSessionData} />}
      {selectedSession && <SessionDetailsModal session={selectedSession} onClose={() => setSelectedSession(null)} />}
      {isEditModalOpen && <EditProfileModal onClose={() => setIsEditModalOpen(false)} onProfileUpdated={() => {}} />}
    </>
  );
}