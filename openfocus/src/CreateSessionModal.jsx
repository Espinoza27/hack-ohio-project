// src/CreateSessionModal.jsx
import React, { useState, useMemo } from 'react';
import { db, auth } from './firebase';
import { collection, addDoc } from 'firebase/firestore';
import { generateTimeOptions } from './TimeUtils'; // <-- Removed timeToHHMM as it's not needed here

// Helper function to format dates for the input type="date" (YYYY-MM-DD)
const toYYYYMMDD = (date) => date.toISOString().split('T')[0];

// Helper function to get min/max days for START date
const getMinMaxDays = () => {
  const now = new Date();
  const oneYearFromNow = new Date();
  oneYearFromNow.setFullYear(now.getFullYear() + 1);

  return {
    minDate: toYYYYMMDD(now),
    maxDate: toYYYYMMDD(oneYearFromNow),
  };
};

const CreateSessionModal = ({ onClose, onSessionCreated }) => {
  const [topic, setTopic] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('Thompson Library');
  const [floor, setFloor] = useState('');
  const [wing, setWing] = useState('');
  
  const now = useMemo(() => new Date(), []);
  const [startDate, setStartDate] = useState(toYYYYMMDD(now)); 
  const [startTime, setStartTime] = useState(''); 
  const [endTime, setEndTime] = useState('');     

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { minDate, maxDate } = getMinMaxDays();
  
  // Generate all possible times in 15-minute intervals once
  const allTimeOptions = useMemo(() => generateTimeOptions(15), []);

  // --- Filter start time options based on current date ---
  const startOptions = useMemo(() => {
    const todayYYYYMMDD = toYYYYMMDD(now);
    
    if (startDate === todayYYYYMMDD) {
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const nextIntervalMinutes = Math.ceil((currentMinutes + 1) / 15) * 15;
      
      return allTimeOptions.filter(opt => opt.minutes >= nextIntervalMinutes);
    }
    
    return allTimeOptions;
  }, [startDate, allTimeOptions, now]);

  // --- FIX: Filter end time options for 8-hour rollover ---
  const filteredEndTimeOptions = useMemo(() => {
    if (!startTime) return [];
    
    const startOption = allTimeOptions.find(opt => opt.value === startTime);
    if (!startOption) return [];

    const startMinutes = startOption.minutes;
    const maxDurationMinutes = 8 * 60; // 8 hours
    const maxEndMinutes = startMinutes + maxDurationMinutes;

    return allTimeOptions.filter(opt => {
        const endMinutes = opt.minutes;
        
        // Check 1: Must be later than start time
        if (endMinutes <= startMinutes) {
            // Only include if it's in the next day's 8-hour window
            return endMinutes <= (maxEndMinutes % (24 * 60));
        }

        // Check 2: Must be within the 8-hour duration on the same day
        return endMinutes <= maxEndMinutes;
    });
  }, [startTime, allTimeOptions]);
  // --- END FIX ---


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

    if (!topic || !startDate || !startTime || !floor || !wing) {
      setError('Topic, Date, Start Time, Floor, and Wing/Side are required.');
      setLoading(false);
      return;
    }

    // 1. Construct Start Time Date Object and Validate against Current Time
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const startTimeDate = new Date(startDate);
    startTimeDate.setHours(startHour, startMinute, 0, 0);

    if (startTimeDate < new Date()) {
      setError("Start time must be in the future (adjust date or time).");
      setLoading(false);
      return;
    }

    let endTimeDate = null;

    // 2. End Time Logic (Default or Validation)
    if (endTime) {
      // If user provided an end time (HH:MM from dropdown)
      const [endHour, endMinute] = endTime.split(':').map(Number);
      
      endTimeDate = new Date(startDate);
      endTimeDate.setHours(endHour, endMinute, 0, 0);

      const maxAllowedEndTime = new Date(startTimeDate.getTime() + 8 * 60 * 60 * 1000); 

      // If the time rolled over, we must advance the date by one day
      if (endTimeDate.getTime() <= startTimeDate.getTime()) {
          endTimeDate.setDate(endTimeDate.getDate() + 1);
      }
      
      if (endTimeDate.getTime() <= startTimeDate.getTime()) {
        setError('End time must be after the start time.');
        setLoading(false);
        return;
      }
      if (endTimeDate.getTime() > maxAllowedEndTime.getTime()) {
        setError('End time cannot be more than 8 hours after the start time.');
        setLoading(false);
        return;
      }
    } else {
      // Default: 11:59:59 PM same day
      endTimeDate = new Date(startDate);
      endTimeDate.setHours(23, 59, 59, 999);
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

          {/* --- DATE/TIME DROPDOWNS --- */}
          <div className="form-group half-width">
            <label>Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              min={minDate}
              max={maxDate}
              required
            />
          </div>
          
          <div className="form-group half-width">
            <label>Start Time (15 min intervals)</label>
            <select
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
            >
              <option value="" disabled>Select Time</option>
              {startOptions.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-group half-width">
            <label>End Time (Optional - max 8 hours)</label>
            <select
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              disabled={!startTime}
            >
              <option value="">(Default: 11:59 PM)</option>
              {filteredEndTimeOptions.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {!endTime && startTime && <small className="form-help-text">Defaults to 11:59 PM on start date.</small>}
          </div>
          {/* --- END OF DATE/TIME DROPDOWNS --- */}


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