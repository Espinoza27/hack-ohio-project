// src/SessionDetailsModal.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from './firebase'; // Import Firestore and Auth
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const SessionDetailsModal = ({ session, onClose }) => {
  const navigate = useNavigate();

  if (!session) return null;

  const handleConfirmJoin = async () => {
    const user = auth.currentUser;

    if (user) {
      // 1. Record the join action in a new Firestore collection
      try {
        await addDoc(collection(db, 'sessionJoins'), {
          sessionId: session.id,
          userId: user.uid,
          joinedAt: serverTimestamp(),
          // We don't track leave time yet, just the join
        });
        
        // Console log for debugging
        console.log(`User ${user.uid} joined session ${session.id}.`);
      } catch (error) {
        console.error("Error recording join:", error);
        // Do not block navigation even if recording fails
      }
    }
    
    // 2. Navigate to the chat page
    navigate(`/session/${session.id}`);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>{session.topic}</h2>
        
        <div className="session-details-content">
          <p>
            <strong>Location:</strong> {session.location}, {session.floor}
            <br/>
            <span style={{marginLeft: '70px', fontSize: '0.9em', color: '#bbb'}}>{session.wing}</span>
            </p>
          <p><strong>Starts:</strong> {session.startTime?.seconds && new Date(session.startTime.seconds * 1000).toLocaleString()}</p>
          
          {session.endTime?.seconds && (
            <p><strong>Ends:</strong> {new Date(session.endTime.seconds * 1000).toLocaleString()}</p>
          )}

          <p><strong>Description:</strong></p>
          <p className="session-description-modal">{session.description || "No description provided."}</p>
        </div>

        <div className="modal-actions">
          <button type="button" className="button-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="join-button" onClick={handleConfirmJoin}>
            Confirm & Join
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionDetailsModal;