import React, { useState, useEffect, useRef } from 'react';

// Define simulated "hotspots" on your map — same coordinate system as your HomePage canvas
const HOTSPOTS = [
  { id: 'thompson', name: 'Thompson Library', x: 100, y: 150, radius: 80 },
  { id: 'eighteenth', name: '18th Ave Library', x: 300, y: 200, radius: 80 },
  { id: 'oval', name: 'The Oval', x: 500, y: 100, radius: 100 },
];

// Helper to generate random users within bounds
function generateUsers(count = 200, width = 600, height = 400) {
  return Array.from({ length: count }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
  }));
}

// Helper for movement simulation
function moveUsers(users, width = 600, height = 400) {
  return users.map((u) => {
    let newX = u.x + (Math.random() - 0.5) * 10;
    let newY = u.y + (Math.random() - 0.5) * 10;
    // keep within map bounds
    newX = Math.max(0, Math.min(width, newX));
    newY = Math.max(0, Math.min(height, newY));
    return { x: newX, y: newY };
  });
}

// Check if user is inside hotspot
function isInHotspot(user, hotspot) {
  const dx = user.x - hotspot.x;
  const dy = user.y - hotspot.y;
  return Math.sqrt(dx * dx + dy * dy) <= hotspot.radius;
}

export default function SimulatedPeopleTracker() {
  const [users, setUsers] = useState(generateUsers());
  const [counts, setCounts] = useState({});
  const [running, setRunning] = useState(false);
  const intervalRef = useRef(null);

  // Update movement every 2 seconds when running
  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setUsers((prev) => moveUsers(prev));
      }, 2000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [running]);

  // Recalculate counts whenever users move
  useEffect(() => {
    const newCounts = {};
    HOTSPOTS.forEach((spot) => {
      newCounts[spot.id] = users.filter((u) => isInHotspot(u, spot)).length;
    });
    setCounts(newCounts);
  }, [users]);

  return (
    <div style={{ padding: 20 }}>
      <h2>Simulated People Tracker</h2>
      <p>Status: {running ? 'Running' : 'Stopped'}</p>
      <p>Total simulated users: {users.length}</p>

      <button
        onClick={() => setRunning(!running)}
        style={{
          margin: '10px 0',
          backgroundColor: running ? '#dc3545' : '#28a745',
          color: 'white',
          border: 'none',
          padding: '8px 14px',
          borderRadius: '6px',
          cursor: 'pointer',
        }}
      >
        {running ? 'Stop Simulation' : 'Start Simulation'}
      </button>

      <div style={{ marginTop: 20 }}>
        <h3>Hotspot Counts</h3>
        <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
          {HOTSPOTS.map((spot) => (
            <li key={spot.id}>
              <strong>{spot.name}:</strong> {counts[spot.id] || 0} people
            </li>
          ))}
        </ul>
      </div>

      <div style={{ marginTop: 20 }}>
        <h3>Map Visualization</h3>
        <svg width="600" height="400" style={{ border: '1px solid #ccc' }}>
          {/* Draw hotspots */}
          {HOTSPOTS.map((spot) => (
            <circle
              key={spot.id}
              cx={spot.x}
              cy={spot.y}
              r={spot.radius}
              fill="rgba(255,0,0,0.15)"
              stroke="red"
              strokeWidth="2"
            />
          ))}

          {/* Draw users */}
          {users.map((u, i) => (
            <circle key={i} cx={u.x} cy={u.y} r={3} fill="blue" />
          ))}
        </svg>
      </div>
    </div>
  );
}
