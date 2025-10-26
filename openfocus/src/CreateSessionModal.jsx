// src/CreateSessionModal.jsx
import React, { useState, useMemo, useEffect } from 'react';
import { db, auth } from './firebase';
import { collection, addDoc } from 'firebase/firestore';
// Assuming TimeUtils.js exists and is correct from previous steps
import { generateTimeOptions, timeToHHMM } from './TimeUtils'; 

// Helper function to format dates for saving (YYYY-MM-DD)
const toYYYYMMDD = (date) => date.toISOString().split('T')[0];

// Helper function to find the next valid 15-minute interval time
const findNextIntervalTime = (interval = 15) => {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const nextIntervalMinutes = Math.ceil((currentMinutes + 1) / interval) * interval;
  
  const nextTime = new Date();
  nextTime.setHours(0, 0, 0, 0); 
  nextTime.setMinutes(nextIntervalMinutes);
  
  return {
    value: timeToHHMM(nextTime),
    minutes: nextIntervalMinutes,
    dateObject: nextTime
  };
};

const CreateSessionModal = ({ onClose, onSessionCreated }) => {
  const [topic, setTopic] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('Thompson Library');
  const [floor, setFloor] = useState('');
  const [wing, setWing] = useState('');
  
  const now = useMemo(() => new Date(), []);
  
  // Set default start time to the next 15-minute interval
  const defaultStart = useMemo(() => findNextIntervalTime(15), [now]);
  const [startTime, setStartTime] = useState(defaultStart.value); 
  const [endTime, setEndTime] = useState('');     

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Generate all possible times in 15-minute intervals once
  const allTimeOptions = useMemo(() => generateTimeOptions(15), []);

  // --- NEW LOGIC: Filter start time options (Next 24 hours only) ---
  const startOptions = useMemo(() => {
    const startOfTodayMinutes = defaultStart.minutes;
    // We need 24 hours of options starting from the next interval
    const totalOptions = allTimeOptions.length;
    
    // Create an array that cycles through 24 hours of options starting from defaultStart
    const options = [];
    for (let i = 0; i < totalOptions; i++) {
        // Calculate the index of the option, wrapping around the 24-hour array
        const index = (startOfTodayMinutes / 15 + i) % totalOptions;
        
        // Only include options that are within the next 24 hours from the current time
        // This effectively includes today's remaining times + all of tomorrow's times up to the current minute
        if (i < 96) { // 96 intervals in 24 hours (24 * 60 / 15 = 96)
            options.push(allTimeOptions[index]);
        }
    }
    return options;
  }, [defaultStart, allTimeOptions]);
  // --- END NEW LOGIC ---

  // Filter end time options: only show times up to 8 hours after selected start time
  const filteredEndTimeOptions = useMemo(() => {
    if (!startTime) return [];
    
    const startOption = allTimeOptions.find(opt => opt.value === startTime);
    if (!startOption) return [];

    const startMinutes = startOption.minutes;
    const maxDurationMinutes = 8 * 60; // 8 hours
    const maxEndMinutes = startMinutes + maxDurationMinutes;

    return allTimeOptions.filter(opt => {
        const endMinutes = opt.minutes;
        
        // Check 1: Must be strictly after start time
        if (endMinutes <= startMinutes) {
            // Only include if it rolls into the next day and is within the 8-hour window
            return endMinutes <= (maxEndMinutes % (24 * 60));
        }
        // Check 2: Must be within the 8-hour duration on the same day
        return endMinutes <= maxEndMinutes;
    });
  }, [startTime, allTimeOptions]);


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

    // Determine the day for the session (Today or Tomorrow)
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const currentDate = toYYYYMMDD(new Date()); 
    const startTimeDate = new Date(currentDate);
    startTimeDate.setHours(startHour, startMinute, 0, 0);

    // If the selected time is earlier than the *current* time, assume it's tomorrow
    if (startTimeDate.getTime() < new Date().getTime() - 60000) {
        startTimeDate.setDate(startTimeDate.getDate() + 1);
    }

    // Final Validation: Check if the constructed Start Time is actually in the future
    if (startTimeDate.getTime() < new Date().getTime()) {
      setError("Start time is in the past. Please close and re-open the modal.");
      setLoading(false);
      return;
    }

    let endTimeDate = null;
    const maxAllowedEndTime = new Date(startTimeDate.getTime() + 8 * 60 * 60 * 1000); // 8 hours later

    // --- End Time Logic (Default or Validation) ---
    if (endTime) {
      // If user provided an end time (HH:MM from dropdown)
      const [endHour, endMinute] = endTime.split(':').map(Number);
      
      endTimeDate = new Date(startTimeDate);
      endTimeDate.setHours(endHour, endMinute, 0, 0);

      // If time rolled over (e.g., started at 10 PM, ends at 4 AM), advance the date
      if (endTimeDate.getTime() <= startTimeDate.getTime()) {
          endTimeDate.setDate(endTimeDate.getDate() + 1);
      }
      
      if (endTimeDate.getTime() > maxAllowedEndTime.getTime()) {
        setError('End time cannot be more than 8 hours after the start time.');
        setLoading(false);
        return;
      }
    } else {
      // DEFAULT: 8 hours ahead of the start time
      endTimeDate = maxAllowedEndTime;
    }
    // --- End of End Time Logic ---

    try {
      await addDoc(collection(db, 'sessions'), {
        topic, description, location, floor, wing, hostId: user.uid,
        startTime: startTimeDate, 
        endTime: endTimeDate,
        createdAt: new Date(),
        status: 'active',
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
            <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g., 'Chem 1210 Midterm'" required />
          </div>
          <div className="form-group full-width">
            <label>Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g., 'Going over practice problems...'" required />
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

          {/* Floor */}
          <div className="form-group half-width"> 
            <label>Floor/Room Number</label>
            <input type="text" value={floor} onChange={(e) => setFloor(e.target.value)} placeholder="e.g., 3rd Floor" required />
          </div>

          {/* Wing/Side */}
          <div className="form-group full-width">
            <label>Wing/Side Details</label>
            <input type="text" value={wing} onChange={(e) => setWing(e.target.value)} placeholder="e.g., Left Wing near Starbucks, Room 310" required />
          </div>

          {/* --- TIME DROPDOWNS --- */}
          <div className="form-group half-width">
            <label>Start Time (Next 24 hours)</label>
            <select
              value={startTime}
              onChange={(e) => {setStartTime(e.target.value); setEndTime(''); /* Clear end time */}}
              required
            >
              <option value="" disabled>Select Time</option>
              {startOptions.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <small className="form-help-text">Time is relative to the current day/hour.</small>
          </div>
          
          <div className="form-group half-width">
            <label>End Time (Optional - max 8 hours)</label>
            <select
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              disabled={!startTime}
            >
              <option value="">(Default: 8 hours later)</option>
              {filteredEndTimeOptions.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {!endTime && startTime && <small className="form-help-text">Defaults to 8 hours after start time.</small>}
          </div>
          {/* --- END OF NEW TIME DROPDOWNS --- */}


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