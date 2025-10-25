// src/CreateSessionModal.jsx
import React, { useState } from 'react';
import { db, auth } from './firebase';
import { collection, addDoc } from 'firebase/firestore';

// Helper function to format dates for datetime-local input
const toLocalISOString = (date) => {
  if (!date) return '';
  // Adjust for timezone offset to display correctly in the input
  const tzOffset = date.getTimezoneOffset() * 60000; // Offset in milliseconds
  const localISOTime = new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
  return localISOTime;
};

// Helper function to get min/max for START time input
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
  const [startTime, setStartTime] = useState(''); // Stores the string from input
  const [endTime, setEndTime] = useState('');   // Stores the string from input
  const [error, setError] = useState('');

  const { minStartTime, maxStartTime } = getMinMaxStartTimes();

  // Calculate dynamic min/max for END time based on selected start time
  const getEndTimeConstraints = () => {
    if (!startTime) {
      // If no start time, end time can't be set yet meaningfully relative to it
      return { minEndTime: '', maxEndTime: '' };
    }
    const startDate = new Date(startTime);
    const maxEndDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000); // Add 24 hours

    return {
      minEndTime: toLocalISOString(startDate), // End must be after start
      maxEndTime: toLocalISOString(maxEndDate), // End must be within 24 hours
    };
  };

  const { minEndTime, maxEndTime } = getEndTimeConstraints();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const user = auth.currentUser;
    if (!user) {
      setError('You must be logged in to create a session.');
      return;
    }

    if (!topic || !startTime) {
      setError('Topic and Start Time are required.');
      return;
    }

    // Convert input strings to Date objects for validation and saving
    const startTimeDate = new Date(startTime);
    let endTimeDate = null; // Initialize endTimeDate

    // --- New End Time Logic ---
    if (endTime) {
      // If user provided an end time
      endTimeDate = new Date(endTime);
      const maxAllowedEndTime = new Date(startTimeDate.getTime() + 24 * 60 * 60 * 1000); // 24 hours after start

      if (endTimeDate <= startTimeDate) {
        setError('End time must be after the start time.');
        return;
      }
      if (endTimeDate > maxAllowedEndTime) {
        setError('End time cannot be more than 24 hours after the start time.');
        return;
      }
    } else {
      // If user did NOT provide an end time, set default
      endTimeDate = new Date(startTimeDate);
      endTimeDate.setHours(23, 59, 59, 999); // Set to 11:59:59 PM on the same day as start
    }
    // --- End of New Logic ---


    // Validate start time is within the overall allowed range (now to 1 year)
    const minStart = new Date(); // Re-evaluate 'now' at submission time
    const maxStart = new Date();
    maxStart.setFullYear(minStart.getFullYear() + 1);

    if (startTimeDate < minStart || startTimeDate > maxStart) {
       // Note: The input 'min'/'max' should mostly prevent this, but good to double-check
      setError('Start time must be between now and 1 year from now.');
      return;
    }


    try {
      await addDoc(collection(db, 'sessions'), {
        topic: topic,
        description: description,
        location: location,
        startTime: startTimeDate, // Save the Date object
        endTime: endTimeDate,     // Save the calculated Date object
        createdAt: new Date(),
        status: 'active',
        hostId: user.uid,
      });
      
      onSessionCreated();
      onClose();
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
          {/* Topic, Description, Location fields remain the same */}
          <div className="form-group full-width">
            <label>Topic</label>
            <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g., 'Chem 1210 Midterm'" required />
          </div>
          <div className="form-group full-width">
            <label>Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g., 'Going over practice problems...'" required />
          </div>
          <div className="form-group full-width">
            <label>Location</label>
            <select value={location} onChange={(e) => setLocation(e.target.value)}>
              <option value="Thompson Library">Thompson Library</option>
              <option value="18th Ave Library">18th Ave Library</option>
              {/* Add other locations */}
            </select>
          </div>

          {/* --- Updated Time Inputs --- */}
          <div className="form-group half-width">
            <label>Start Time</label>
            <input
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              min={minStartTime} // Now to 1 year
              max={maxStartTime} // Now to 1 year
              required
            />
          </div>

          <div className="form-group half-width">
            <label>End Time (Optional)</label>
            <input
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              min={minEndTime} // Dynamic: After start time
              max={maxEndTime} // Dynamic: Within 24 hours of start time
              disabled={!startTime} // Disable until start time is chosen
            />
             {!endTime && startTime && <small style={{color:'#aaa', marginTop:'5px'}}>Defaults to 11:59 PM on start date if left blank.</small>}
          </div>
          {/* --- End of Updated Time Inputs --- */}


          {error && <p className="modal-error full-width">{error}</p>}

          <div className="modal-actions full-width">
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