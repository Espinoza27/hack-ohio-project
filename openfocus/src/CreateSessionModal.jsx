// src/CreateSessionModal.jsx
import React, { useState } from 'react';
import { db, auth } from './firebase';
import { collection, addDoc } from 'firebase/firestore';

// Helper function to format dates for datetime-local input
const toLocalISOString = (date) => {
  if (!date) return '';
  const tzOffset = date.getTimezoneOffset() * 60000;
  // Ensure we use the full Date object for consistent time string generation
  const localISOTime = new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
  return localISOTime;
};

// Helper function to get min/max for START time input (now to 1 year ahead)
const getMinMaxStartTimes = () => {
  const now = new Date();
  const oneYearFromNow = new Date();
  oneYearFromNow.setFullYear(now.getFullYear() + 1);

  return {
    minStartTime: toLocalISOString(now),
    maxStartTime: toLocalISOString(oneYearFromNow),
  };
};

const CreateSessionModal = ({ onClose, onSessionCreated }) => {
  const [topic, setTopic] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('Thompson Library');
  const [floor, setFloor] = useState('');
  const [wing, setWing] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { minStartTime, maxStartTime } = getMinMaxStartTimes();

  // Calculate dynamic min/max for END time based on selected start time
  const getEndTimeConstraints = () => {
    if (!startTime) return { minEndTime: '', maxEndTime: '' };

    const startDate = new Date(startTime);
    const minEndDate = new Date(startDate); // End must be after start
    const maxEndDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000); // 24 hours max

    return {
      minEndTime: toLocalISOString(minEndDate),
      maxEndTime: toLocalISOString(maxEndDate),
    };
  };

  const { minEndTime, maxEndTime } = getEndTimeConstraints();

  // Removed unnecessary handleStartTimeChange and handleEndTimeChange functions

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const user = auth.currentUser;
    if (!user) {
      setError('You must be logged in to create a session.');
      setLoading(false);
      return;
    }

    if (!topic || !startTime || !floor || !wing) {
      setError('Topic, Start Time, Floor, and Wing/Side are required.');
      setLoading(false);
      return;
    }

    const startTimeDate = new Date(startTime);
    let endTimeDate = null;

    // --- End Time Logic ---
    if (endTime) {
      // If user provided an end time
      endTimeDate = new Date(endTime);
      
      if (endTimeDate <= startTimeDate) {
        setError('End time must be after the start time.');
        setLoading(false);
        return;
      }

      // Check if end time is within the 24-hour limit (though min/max should cover this)
      const maxAllowedEndTime = new Date(startTimeDate.getTime() + 24 * 60 * 60 * 1000);
      if (endTimeDate > maxAllowedEndTime) {
        setError('End time cannot be more than 24 hours after the start time.');
        setLoading(false);
        return;
      }
    } else {
      // Default: 11:59:59 PM same day
      endTimeDate = new Date(startTimeDate);
      endTimeDate.setHours(23, 59, 59, 999);
    }
    // --- End of End Time Logic ---

    try {
      await addDoc(collection(db, 'sessions'), {
        topic,
        description,
        location,
        floor,
        wing,
        startTime: startTimeDate,
        endTime: endTimeDate, // Saves the calculated/chosen end time
        createdAt: new Date(),
        status: 'active',
        hostId: user.uid,
      });

      onSessionCreated();
      onClose();
    } catch (err) {
      console.error("Error creating session: ", err);
      setError('Failed to create session. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Create New Study Session</h2>
        <form onSubmit={handleSubmit} className="session-form-detailed">

          {/* Topic and Description */}
          <div className="form-group full-width">
            <label>Topic</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., 'Chem 1210 Midterm'"
              required
            />
          </div>
          <div className="form-group full-width">
            <label>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., 'Going over practice problems...'"
              required
            />
          </div>

          {/* Location */}
          <div className="form-group half-width">
            <label>Building Location</label>
            <select value={location} onChange={(e) => setLocation(e.target.value)}>
              <option value="Thompson Library">Thompson Library</option>
              <option value="18th Ave Library">18th Ave Library</option>
              <option value="Ohio Union">Ohio Union</option>
              <option value="Baker Hall">Baker Hall</option>
              <option value="Enarson Classroom Bldg">Enarson Classroom Bldg</option>
            </select>
          </div>

          {/* Floor and Wing */}
          <div className="form-group half-width">
            <label>Floor/Room Number</label>
            <input
              type="text"
              value={floor}
              onChange={(e) => setFloor(e.target.value)}
              placeholder="e.g., 3rd Floor"
              required
            />
          </div>
          <div className="form-group full-width">
            <label>Wing/Side Details</label>
            <input
              type="text"
              value={wing}
              onChange={(e) => setWing(e.target.value)}
              placeholder="e.g., Left Wing near Starbucks, Room 310"
              required
            />
          </div>

          {/* Start Time */}
          <div className="form-group half-width">
            <label>Start Time</label>
            <input
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              min={minStartTime}
              max={maxStartTime}
              // Removed step attribute as it's not well-supported and conflicts with custom logic
              required
            />
          </div>

          {/* End Time */}
          <div className="form-group half-width">
            <label>End Time (Optional)</label>
            <input
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              min={minEndTime}
              max={maxEndTime}
              disabled={!startTime}
              // Removed step attribute
            />
            {!endTime && startTime && (
              <small className="form-help-text">
                Defaults to 11:59 PM on the same day if left blank.
              </small>
            )}
          </div>

          {error && <p className="modal-error full-width">{error}</p>}

          <div className="modal-actions full-width">
            <button type="button" className="button-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="create-button-full" disabled={loading}>
              {loading ? 'Creating...' : 'Create Session'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateSessionModal;