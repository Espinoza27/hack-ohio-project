// src/EditProfileModal.jsx
import React, { useState, useEffect, useRef } from 'react';
import { auth, db } from './firebase';
import { updateProfile } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import axios from 'axios';

const CLOUDINARY_CLOUD_NAME = "ddf4hdczl";
const CLOUDINARY_UPLOAD_PRESET = "qvdvxd3d";
const defaultPic = 'https://i.pinimg.com/originals/73/83/4b/73834b0cfd3f4cf3f893ececab22a258.jpg';

const EditProfileModal = ({ onClose, onProfileUpdated }) => {
  const [displayName, setDisplayName] = useState('');
  const [major, setMajor] = useState('');
  const [coursesStr, setCoursesStr] = useState('');
  const [profilePicFile, setProfilePicFile] = useState(null);
  const [currentPhotoURL, setCurrentPhotoURL] = useState(defaultPic);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    const loadUserData = async () => {
      const user = auth.currentUser;
      if (!user) return;

      setDisplayName(user.displayName || '');
      setCurrentPhotoURL(user.photoURL || defaultPic);

      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setMajor(data.major || '');
        setCoursesStr(data.courses ? data.courses.join(', ') : '');
      }
    };
    loadUserData();
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setProfilePicFile(e.target.files[0]);
      setCurrentPhotoURL(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const user = auth.currentUser;
    if (!user) {
      setError('User not found.');
      setLoading(false);
      return;
    }

    try {
      let photoURL = currentPhotoURL;

      // Upload to Cloudinary if new file is selected
      if (profilePicFile) {
        const formData = new FormData();
        formData.append('file', profilePicFile);
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

        const res = await axios.post(
          `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
          formData
        );
        photoURL = res.data.secure_url;
      }

      // Update Firebase Auth and Firestore
      await updateProfile(user, { displayName, photoURL });
      const userDocRef = doc(db, "users", user.uid);
      await setDoc(userDocRef, {
        displayName,
        major,
        courses: coursesStr.split(',').map(c => c.trim()).filter(Boolean),
        photoURL
      });

      setLoading(false);
      onProfileUpdated();
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ textAlign: 'center' }}>
        <h2>Edit Your Profile</h2>

        {/* Profile Picture */}
        <div style={{ marginTop: '10px', marginBottom: '25px' }}>
          <h3 style={{ marginBottom: '10px' }}>Profile Picture</h3>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <img
              src={currentPhotoURL}
              alt="Profile"
              className="profile-pic-preview"
              onClick={handleImageClick}
              style={{
                cursor: 'pointer',
                width: '130px',
                height: '130px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '3px solid #ccc',
                transition: '0.2s',
              }}
            />
          </div>
          <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '8px', fontStyle: 'italic' }}>
            Click to change profile picture
          </p>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
        </div>

        {/* Profile Form */}
        <form onSubmit={handleSave} className="session-form-detailed">
          <div className="form-group full-width">
            <label>Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
            />
          </div>

          <div className="form-group half-width">
            <label>Major</label>
            <input
              type="text"
              value={major}
              onChange={(e) => setMajor(e.target.value)}
              placeholder="e.g., Computer Science"
            />
          </div>

          <div className="form-group half-width">
            <label>Courses</label>
            <input
              type="text"
              value={coursesStr}
              onChange={(e) => setCoursesStr(e.target.value)}
              placeholder="e.g., CSE 1223, MATH 1151"
            />
          </div>

          {/* Action Buttons */}
          <div className="modal-actions full-width" style={{ display: 'flex', justifyContent: 'space-around', marginTop: '20px' }}>
            <button type="button" className="button-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="button-secondary" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>

          {error && <p className="modal-error full-width" style={{ marginTop: '10px' }}>{error}</p>}
        </form>
      </div>
    </div>
  );
};

export default EditProfileModal;
