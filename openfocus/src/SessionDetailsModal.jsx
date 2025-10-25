// src/SessionDetailsModal.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

const SessionDetailsModal = ({ session, onClose }) => {
  const navigate = useNavigate();

  if (!session) return null;

  const handleConfirmJoin = () => {
    navigate(`/session/${session.id}`);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>{session.topic}</h2>
        
        <div className="session-details-content">
          <p><strong>Location:</strong> {session.location}</p>
          <p><strong>Starts:</strong> {new Date(session.startTime.seconds * 1000).toLocaleString()}</p>
          
          {/* Only show end time if it exists */}
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