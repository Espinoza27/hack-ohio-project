// src/UserProfileModal.jsx
import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';

// Default picture if needed
const defaultPic = 'https://i.pinimg.com/originals/73/83/4b/73834b0cfd3f4cf3f893ececab22a258.jpg';

const UserProfileModal = ({ userId, onClose }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      if (!userId) {
          setProfile(null); // Handle case where userId might be null/undefined initially
          setLoading(false);
          return;
      }
      try {
        const docRef = doc(db, "users", userId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setProfile(docSnap.data());
        } else {
          console.log("No such profile for userId:", userId);
          setProfile(null); // Explicitly set profile to null if not found
        }
      } catch (error) {
          console.error("Error fetching profile:", error);
          setProfile(null); // Handle potential errors during fetch
      } finally {
          setLoading(false);
      }
    };

    fetchProfile();
  }, [userId]); // Dependency array includes userId

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content user-profile-modal" onClick={(e) => e.stopPropagation()}>
        {loading && <h2 className="loading-text">Loading...</h2>}

        {!loading && !profile && <h2 className="error-text">Profile not found.</h2>}

        {!loading && profile && (
          <>
            {/* --- Profile Picture --- */}
            <img
              src={profile.photoURL || defaultPic}
              alt={profile.displayName}
              className="profile-modal-pic"
            />

            <h2>{profile.displayName}</h2>

            <div className="profile-details">
              {/* --- Simpler structure for Major --- */}
              <div className="profile-detail-item">
                <strong>Major:</strong>
                <span>{profile.major || 'Not specified'}</span>
              </div>

              {/* --- Courses Section --- */}
              <div className="profile-detail-item">
                <strong>Courses:</strong>
                {profile.courses && profile.courses.length > 0 ? (
                  <ul className="profile-courses-list">
                    {profile.courses.map((course, index) => (
                      <li key={index}>{course}</li>
                    ))}
                  </ul>
                ) : (
                  <span>No courses listed.</span>
                )}
              </div>
            </div>

            <div className="modal-actions">
              <button type="button" className="button-secondary" onClick={onClose}>
                Close
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default UserProfileModal;