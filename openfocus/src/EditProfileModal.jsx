// src/EditProfileModal.jsx
import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase'; // <-- 1. 'storage' is gone
import { updateProfile } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import axios from 'axios'; // <-- 2. Import axios

// --- !! IMPORTANT !! ---
// Replace these with your Cloudinary details from Step 2
const CLOUDINARY_CLOUD_NAME = "ddf4hdczl";
const CLOUDINARY_UPLOAD_PRESET = "qvdvxd3d";
// -----------------------

const defaultPic = 'https://i.pinimg.com/originals/73/83/4b/73834b0cfd3f4cf3f893ececab22a258.jpg';

const EditProfileModal = ({ onClose, onProfileUpdated }) => {
  const [displayName, setDisplayName] = useState('');
  const [major, setMajor] = useState('');
  const [coursesStr, setCoursesStr] = useState('');
  const [profilePicFile, setProfilePicFile] = useState(null);
  const [currentPhotoURL, setCurrentPhotoURL] = useState(defaultPic);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

      // 3. If a *new* file was selected, upload it to Cloudinary
      if (profilePicFile) {
        const formData = new FormData();
        formData.append('file', profilePicFile);
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
        
        const res = await axios.post(
          `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
          formData
        );
        photoURL = res.data.secure_url; // 4. Get the new URL
      }

      // 5. Update Auth
      await updateProfile(user, {
        displayName: displayName,
        photoURL: photoURL
      });

      // 6. Update Firestore
      const userDocRef = doc(db, "users", user.uid);
      await setDoc(userDocRef, {
        displayName: displayName,
        major: major,
        courses: coursesStr.split(',').map(course => course.trim()).filter(c => c),
        photoURL: photoURL
      });
      
      setLoading(false);
      onProfileUpdated();
      onClose();
    } catch (err) {
      setLoading(false);
      setError(err.message);
      console.error(err);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Edit Your Profile</h2>
        <form onSubmit={handleSave} className="session-form-detailed">
          
          <div className="form-group full-width" style={{alignItems: 'center'}}>
            <label>Profile Picture</label>
            <img src={currentPhotoURL} alt="Profile" className="profile-pic-preview" />
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleFileChange} 
              style={{border: 'none', padding: 0}}
            />
          </div>

          {/* ... all your other form fields (DisplayName, Major, etc.) ... */}

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

          <div className="modal-actions full-width">
            <button type="button" className="button-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="create-button-full" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
          
          {error && <p className="modal-error full-width">{error}</p>}
        </form>
      </div>
    </div>
  );
};

export default EditProfileModal;