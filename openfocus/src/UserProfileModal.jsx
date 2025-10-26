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
          setProfile(null);
          setLoading(false);
          return;
      }
      try {
        const docRef = doc(db, "users", userId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setProfile(docSnap.data());
        } else {
          setProfile(null);
        }
      } catch (error) {
          console.error("Error fetching profile:", error);
          setProfile(null);
      } finally {
          setLoading(false);
      }
    };

    fetchProfile();
  }, [userId]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      {/* Added class to distinguish the profile modal for specific styling */}
      <div className="modal-content user-profile-modal" onClick={(e) => e.stopPropagation()}>
        {loading && <h2 className="loading-text">Loading Profile...</h2>}

        {!loading && !profile && <h2 className="error-text">Profile not found.</h2>}

        {!loading && profile && (
          <>
            {/* --- Profile Picture (Aesthetic: Centered, Large) --- */}
            <img
              src={profile.photoURL || defaultPic}
              alt={profile.displayName}
              className="profile-modal-pic"
            />

            <h2>{profile.displayName}</h2>
            
            {/* --- Details Section --- */}
            <div className="profile-details-grid">
              
              {/* Major */}
              <div className="profile-detail-item">
                <strong>Major</strong>
                <span>{profile.major || 'Not specified'}</span>
              </div>
              
              {/* Courses */}
              <div className="profile-detail-item full-row">
                <strong>Courses</strong>
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

            <div className="modal-actions full-row">
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