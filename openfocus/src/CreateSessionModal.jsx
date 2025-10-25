// src/CreateSessionModal.jsx
import React, { useState, useMemo } from "react";
import { db, auth } from "./firebase";
import { collection, addDoc } from "firebase/firestore";

// Convert Date -> local ISO for input value
const toLocalISOString = (date) => {
  if (!date) return "";
  const tzOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
};

const getMinMaxStartTimes = () => {
  const now = new Date();
  const oneYear = new Date();
  oneYear.setFullYear(now.getFullYear() + 1);
  return { minStartTime: toLocalISOString(now), maxStartTime: toLocalISOString(oneYear) };
};

const DURATION_OPTIONS = [
  { label: "Default (until 11:59 PM)", value: "" },
  { label: "30 minutes", value: "0.5" },
  { label: "1 hour", value: "1" },
  { label: "1 hour 30 minutes", value: "1.5" },
  { label: "2 hours", value: "2" },
  { label: "2 hours 30 minutes", value: "2.5" },
  { label: "3 hours", value: "3" },
  { label: "3 hours 30 minutes", value: "3.5" },
  { label: "4 hours", value: "4" },
  { label: "4 hours 30 minutes", value: "4.5" },
  { label: "5 hours", value: "5" },
  { label: "5 hours 30 minutes", value: "5.5" },
  { label: "6 hours", value: "6" },
];

const CreateSessionModal = ({ onClose, onSessionCreated }) => {
  const { minStartTime, maxStartTime } = getMinMaxStartTimes();

  const [topic, setTopic] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("Thompson Library");
  const [startTime, setStartTime] = useState("");
  const [duration, setDuration] = useState(""); // string like "1.5" or ""
  const [error, setError] = useState("");

  // Live computed preview of end time (or null if startTime missing)
  const endTimePreview = useMemo(() => {
    if (!startTime) return null;
    const startDate = new Date(startTime);
    if (duration) {
      const hours = parseFloat(duration);
      if (Number.isNaN(hours)) return null;
      return new Date(startDate.getTime() + hours * 60 * 60 * 1000);
    }
    // default to 11:59 PM same day
    const defaultEnd = new Date(startDate);
    defaultEnd.setHours(23, 59, 0, 0);
    return defaultEnd;
  }, [startTime, duration]);

  // Helper to format endTimePreview nicely
  const formatPretty = (d) => {
    if (!d) return "";
    return d.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const user = auth.currentUser;
    if (!user) {
      setError("You must be logged in to create a session.");
      return;
    }

    if (!topic.trim() || !startTime) {
      setError("Topic and Start Time are required.");
      return;
    }

    const startDate = new Date(startTime);

    // compute endTime
    let endDate;
    if (duration) {
      const hours = parseFloat(duration);
      if (Number.isNaN(hours) || hours <= 0) {
        setError("Invalid duration selected.");
        return;
      }
      endDate = new Date(startDate.getTime() + hours * 60 * 60 * 1000);
    } else {
      endDate = new Date(startDate);
      endDate.setHours(23, 59, 0, 0);
    }

    // Validate start time in range
    const minStart = new Date();
    const maxStart = new Date();
    maxStart.setFullYear(minStart.getFullYear() + 1);
    if (startDate < minStart || startDate > maxStart) {
      setError("Start time must be between now and 1 year from now.");
      return;
    }

    try {
      await addDoc(collection(db, "sessions"), {
        topic: topic.trim(),
        description: description.trim(),
        location,
        startTime: startDate,
        endTime: endDate,
        createdAt: new Date(),
        status: "active",
        hostId: user.uid,
      });
      onSessionCreated();
      onClose();
    } catch (err) {
      console.error("Error creating session:", err);
      setError("Failed to create session. Please try again.");
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Create New Study Session</h2>

        <form onSubmit={handleSubmit} className="session-form-detailed">
          <div className="form-group full-width">
            <label>Topic</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., 'Chem 1210 Midterm Review'"
              required
            />
          </div>

          <div className="form-group full-width">
            <label>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What will you cover?"
            />
          </div>

          <div className="form-group full-width">
            <label>Location</label>
            <select value={location} onChange={(e) => setLocation(e.target.value)}>
              <option value="Thompson Library">Thompson Library</option>
              <option value="18th Ave Library">18th Ave Library</option>
              {/* add more */}
            </select>
          </div>

          <div className="form-group half-width">
            <label>Start Time</label>
            <input
              type="datetime-local"
              value={startTime}
              onChange={(e) => {
                setStartTime(e.target.value);
                // keep duration selection intact; preview will recompute via useMemo
              }}
              min={minStartTime}
              max={maxStartTime}
              required
            />
          </div>

          <div className="form-group half-width">
            <label>Duration</label>
            {/* ALWAYS enabled so it can't be blocked by a disabled prop */}
            <select
              value={duration}
              onChange={(e) => {
                setDuration(e.target.value);
                // quick debug in console to ensure selection registers
                console.log("Duration selected:", e.target.value);
              }}
            >
              {DURATION_OPTIONS.map((opt) => (
                <option key={opt.value + opt.label} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            {/* Live preview (only shows when startTime selected) */}
            {startTime && (
              <div style={{ marginTop: 8, color: "#444", fontSize: 13 }}>
                <strong>Ends:</strong> {endTimePreview ? formatPretty(endTimePreview) : "—"}
              </div>
            )}
          </div>

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
