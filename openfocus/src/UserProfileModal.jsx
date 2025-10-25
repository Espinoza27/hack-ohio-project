// src/UserProfileModal.jsx
import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';

const UserProfileModal = ({ userId, onClose }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      const docRef = doc(db, "users", userId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setProfile(docSnap.data());
      } else {
        console.log("No such profile!");
      }
      setLoading(false);
    };

    fetchProfile();
  }, [userId]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content user-profile-modal" onClick={(e) => e.stopPropagation()}>
        {loading && <h2>Loading...</h2>}
        
        {!loading && !profile && <h2>Profile not found.</h2>}

        {!loading && profile && (
          <>
            <h2>{profile.displayName}</h2>
            <div className="profile-details">
              <p>
                <strong>Major:</strong>
                <span>{profile.major || 'Not specified'}</span>
              </p>
              
              <strong>Courses:</strong>
              {profile.courses && profile.courses.length > 0 ? (
                <ul className="profile-courses-list">
                  {profile.courses.map((course, index) => (
                    <li key={index}>{course}</li>
                  ))}
                </ul>
              ) : (
                <p>No courses listed.</p>
              )}
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