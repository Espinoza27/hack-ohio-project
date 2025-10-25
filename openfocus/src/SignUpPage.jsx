// src/SignUpPage.jsx
import React, { useState } from 'react';
import { auth, db } from './firebase'; // <-- 1. Notice 'storage' is gone
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios'; // <-- 2. Import axios for uploading

// --- !! IMPORTANT !! ---
// Replace these with your Cloudinary details from Step 2
const CLOUDINARY_CLOUD_NAME = "ddf4hdczl";
const CLOUDINARY_UPLOAD_PRESET = "qvdvxd3d";
// -----------------------

const defaultPic = 'https://i.pinimg.com/originals/73/83/4b/73834b0cfd3f4cf3f893ececab22a258.jpg';

const SignUpPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [major, setMajor] = useState('');
  const [coursesStr, setCoursesStr] = useState('');
  const [profilePicFile, setProfilePicFile] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setProfilePicFile(e.target.files[0]);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!displayName) {
      setError("Display name is required.");
      setLoading(false);
      return;
    }

    try {
      // 1. Create the user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      let photoURL = defaultPic; // Start with the default

      // 2. If user uploaded a file, upload it to CLOUDINARY
      if (profilePicFile) {
        const formData = new FormData();
        formData.append('file', profilePicFile);
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
        
        const res = await axios.post(
          `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
          formData
        );
        photoURL = res.data.secure_url; // 3. Get the public URL from Cloudinary
      }

      // 4. Update the user's Auth profile
      await updateProfile(user, {
        displayName: displayName,
        photoURL: photoURL
      });

      // 5. Create their profile document in Firestore
      const userDocRef = doc(db, "users", user.uid);
      await setDoc(userDocRef, {
        displayName: displayName,
        email: user.email,
        major: major,
        courses: coursesStr.split(',').map(course => course.trim()).filter(c => c),
        photoURL: photoURL
      });

      setLoading(false);
      navigate('/');
    } catch (err) {
      setLoading(false);
      setError(err.message);
      console.error(err);
    }
  };

  return (
    <div className="session-container">
      <h2>Create Your Profile</h2>
      <form onSubmit={handleSignUp} className="session-form-detailed">
        
        <div className="form-group full-width" style={{alignItems: 'center'}}>
          <label>Profile Picture (Optional)</label>
          <input 
            type="file" 
            accept="image/*"
            onChange={handleFileChange} 
            style={{border: 'none', padding: 0}}
          />
        </div>

        {/* ... all your other form fields (DisplayName, Email, etc.) ... */}
        
        <div className="form-group full-width">
          <label>Display Name</label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your public name"
            required
          />
        </div>
        <div className="form-group full-width">
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
          />
        </div>
        <div className="form-group full-width">
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
          />
        </div>
        <div className="form-group half-width">
          <label>Major (Optional)</label>
          <input
            type="text"
            value={major}
            onChange={(e) => setMajor(e.target.value)}
            placeholder="e.g., Computer Science"
          />
        </div>
        <div className="form-group half-width">
          <label>Courses (Optional)</label>
          <input
            type="text"
            value={coursesStr}
            onChange={(e) => setCoursesStr(e.target.value)}
            placeholder="e.g., CSE 1223, MATH 1151"
          />
        </div>

        <div className="modal-actions full-width">
          <button type="submit" className="create-button-full" disabled={loading}>
            {loading ? 'Creating...' : 'Sign Up'}
          </button>
        </div>
        
        {error && <p className="modal-error full-width">{error}</p>}
      
      </form>
      <p style={{textAlign: 'center', marginTop: '20px'}}>
        Already have an account? <Link to="/login">Log In</Link>
      </p>
    </div>
  );
};

export default SignUpPage;