import React, { useState } from 'react';
import { db, auth } from './firebase';
import { collection, addDoc } from 'firebase/firestore';

// Utility to get today's local date string for <input type="date">
const getTodayDateString = () => {
  const now = new Date();
  return now.toISOString().split('T')[0];
};

// Get next 15-min interval for default time
const getNextSlot = () => {
  const now = new Date();
  let hour = now.getHours();
  let minute = now.getMinutes();
  minute = Math.ceil(minute / 15) * 15;
  if (minute === 60) {
    minute = 0;
    hour += 1;
  }
  const ampm = hour >= 12 ? 'PM' : 'AM';
  let displayHour = hour % 12;
  if (displayHour === 0) displayHour = 12;
  return { hour: displayHour, minute: minute === 0 ? '00' : minute.toString().padStart(2, '0'), ampm };
};

const hours = Array.from({ length: 12 }, (_, i) => i + 1);  // 1-12
const minutes = ['00', '15', '30', '45'];
const meridians = ['AM', 'PM'];
const durations = [
  { label: "30 minutes", minutes: 30 },
  { label: "1 hour", minutes: 60 },
  { label: "1.5 hours", minutes: 90 },
  { label: "2 hours", minutes: 120 },
  { label: "2.5 hours", minutes: 150 },
  { label: "3 hours", minutes: 180 },
  { label: "Until close (11:15 PM)", minutes: null }
];

function buildDate(dateString, hour, minute, ampm) {
  let h = parseInt(hour, 10);
  if (ampm === 'PM' && h < 12) h += 12;
  if (ampm === 'AM' && h === 12) h = 0;
  const date = new Date(`${dateString}T00:00:00`);
  date.setHours(h, Number(minute), 0, 0);
  return date;
}

const CLOSING_HOUR = 23;
const CLOSING_MINUTE = 15;

const CreateSessionModal = ({ onClose, onSessionCreated }) => {
  const [topic, setTopic] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('Thompson Library');
  const [floor, setFloor] = useState('');
  const [wing, setWing] = useState('');
  const [date, setDate] = useState(getTodayDateString());
  const nowTime = getNextSlot();
  const [startHour, setStartHour] = useState(nowTime.hour);
  const [startMinute, setStartMinute] = useState(nowTime.minute);
  const [startAmpm, setStartAmpm] = useState(nowTime.ampm);
  const [duration, setDuration] = useState(durations[1].minutes); // Default: 1 hour
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const user = auth.currentUser;
    if (!user) {
      setError('You must be logged in to create a session.');
      setLoading(false);
      return;
    }
    if (!topic || !floor || !wing) {
      setError('Topic, Floor, and Wing/Side are required.');
      setLoading(false);
      return;
    }

    // Compose start/end time
    const startTimeDate = buildDate(date, startHour, startMinute, startAmpm);
    let endTimeDate;
    if (duration && duration !== 'null') {
      endTimeDate = new Date(startTimeDate.getTime() + Number(duration) * 60000);
      // Clamp to library close (11:15 PM)
      const close = new Date(startTimeDate);
      close.setHours(CLOSING_HOUR, CLOSING_MINUTE, 0, 0);
      if (endTimeDate > close) endTimeDate = close;
    } else {
      endTimeDate = new Date(startTimeDate);
      endTimeDate.setHours(CLOSING_HOUR, CLOSING_MINUTE, 0, 0);
    }

    if (endTimeDate < startTimeDate) {
      setError('End time cannot be before start time.');
      setLoading(false);
      return;
    }

    try {
      await addDoc(collection(db, 'sessions'), {
        topic,
        description,
        location,
        floor,
        wing,
        startTime: startTimeDate,
        endTime: endTimeDate,
        createdAt: new Date(),
        status: 'active',
        hostId: user.uid
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
          <div className="form-group full-width">
            <label>Topic</label>
            <input type="text" value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g., 'Chem 1210 Midterm'" required />
          </div>
          <div className="form-group full-width">
            <label>Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g., 'Going over practice problems...'" required />
          </div>
          <div className="form-group half-width">
            <label>Building Location</label>
            <select value={location} onChange={e => setLocation(e.target.value)}>
              <option value="Thompson Library">Thompson Library</option>
              <option value="18th Ave Library">18th Ave Library</option>
              <option value="Ohio Union">Ohio Union</option>
              <option value="Baker Hall">Baker Hall</option>
              <option value="Enarson Classroom Bldg">Enarson Classroom Bldg</option>
            </select>
          </div>
          <div className="form-group half-width">
            <label>Floor/Room Number</label>
            <input type="text" value={floor} onChange={e => setFloor(e.target.value)} placeholder="e.g., 3rd Floor" required />
          </div>
          <div className="form-group full-width">
            <label>Wing/Side Details</label>
            <input type="text" value={wing} onChange={e => setWing(e.target.value)} placeholder="e.g., Left Wing near Starbucks, Room 310" required />
          </div>
          {/* Start Date & Time */}
          <div className="form-group full-width">
            <label>Start Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} min={getTodayDateString()} required />
          </div>
          <div className="form-group half-width">
            <label>Start Time</label>
            <div style={{ display: "flex", gap: 5 }}>
              <select value={startHour} onChange={e => setStartHour(e.target.value)}>
                {hours.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
              <span>:</span>
              <select value={startMinute} onChange={e => setStartMinute(e.target.value)}>
                {minutes.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <select value={startAmpm} onChange={e => setStartAmpm(e.target.value)}>
                {meridians.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>
          {/* End Time (by duration) */}
          <div className="form-group half-width">
            <label>Duration / End Time</label>
            <select value={duration} onChange={e => setDuration(e.target.value)}>
              {durations.map(d => (
                <option value={d.minutes} key={d.label}>{d.label}</option>
              ))}
            </select>
          </div>
          {error && <p className="modal-error full-width">{error}</p>}
          <div className="modal-actions full-width">
            <button type="button" className="button-secondary" onClick={onClose} disabled={loading}>Cancel</button>
            <button type="submit" className="create-button-full" disabled={loading}>{loading ? 'Creating...' : 'Create Session'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateSessionModal;
