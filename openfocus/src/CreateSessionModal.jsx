// src/CreateSessionModal.jsx
import React, { useState } from 'react';
import { db } from './firebase';
import { collection, addDoc } from 'firebase/firestore';

// Helper function to get the min/max times
const getMinMaxTimes = () => {
  const now = new Date();
  const threeDaysFromNow = new Date();
  threeDaysFromNow.setDate(now.getDate() + 3);
  threeDaysFromNow.setHours(23, 59, 59, 999); // Set to 11:59 PM

  // Format for datetime-local input (YYYY-MM-DDTHH:MM)
  const toLocalISOString = (date) => {
    const tzOffset = date.getTimezoneOffset() * 60000; // Offset in milliseconds
    const localISOTime = new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
    return localISOTime;
  };

  return {
    minTime: toLocalISOString(now),
    maxTime: toLocalISOString(threeDaysFromNow),
  };
};

const CreateSessionModal = ({ onClose, onSessionCreated }) => {
  const [topic, setTopic] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('Thompson Library');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [error, setError] = useState('');

  const { minTime, maxTime } = getMinMaxTimes();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!topic || !startTime) {
      setError('Topic and Start Time are required.');
      return;
    }

    // Double-check time validation (though the input props should handle it)
    const startTimeDate = new Date(startTime);
    const minDate = new Date(minTime);
    const maxDate = new Date(maxTime);

    if (startTimeDate < minDate || startTimeDate > maxDate) {
      setError('Start time must be between now and 3 days from now.');
      return;
    }

    try {
      await addDoc(collection(db, 'sessions'), {
        topic: topic,
        description: description,
        location: location,
        startTime: startTimeDate,
        // Only add endTime if it was actually filled in
        endTime: endTime ? new Date(endTime) : null,
        createdAt: new Date(),
        status: 'active',
      });
      
      onSessionCreated(); // This tells HomePage to refresh its list
      onClose(); // This closes the modal
    } catch (err) {
      console.error("Error creating session: ", err);
      setError('Failed to create session. Please try again.');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Create New Study Session</h2>
        <form onSubmit={handleSubmit} className="session-form-detailed">
          <label>Topic</label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g., 'Chem 1210 Midterm'"
            required
          />

          <label>Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g., 'Going over practice problems...'"
            required
          />

          <label>Location</label>
          <select value={location} onChange={(e) => setLocation(e.target.value)}>
            <option value="Thompson Library">Thompson Library</option>
            <option value="18th Ave Library">18th Ave Library</option>
            <option value="Ohio Union">Ohio Union</option>
            <option value="Baker Hall">Baker Hall</option>
            <option value="Enarson Classroom Bldg">Enarson Classroom Bldg</option>
          </select>

          <label>Start Time</label>
          <input
            type="datetime-local"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            min={minTime} // <-- Time validation
            max={maxTime} // <-- Time validation
            required
          />

          <label>End Time (Optional)</label>
          <input
            type="datetime-local"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            min={startTime || minTime} // End time can't be before start time
          />

          {error && <p className="modal-error">{error}</p>}

          <div className="modal-actions">
            <button type="button" className="button-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="create-button-full">
              Create Session
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateSessionModal;
