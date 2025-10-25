// src/SignUpPage.jsx
import React, { useState } from 'react';
import { auth } from './firebase'; // Import your Firebase auth instance
import { createUserWithEmailAndPassword } from 'firebase/auth'; // Import function to create user
import { useNavigate, Link } from 'react-router-dom'; // Import useNavigate for redirection and Link for navigation

const SignUpPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate(); // Hook to programmatically navigate

  const handleSignUp = async (e) => {
    e.preventDefault(); // Prevent default form submission
    setError(null); // Clear previous errors

    try {
      // Create a new user with email and password
      await createUserWithEmailAndPassword(auth, email, password);
      // If successful, Firebase's auth listener in App.jsx will automatically
      // detect the logged-in user and redirect to '/'
      navigate('/'); // Redirect to the home page
    } catch (err) {
      setError(err.message); // Set error message if sign-up fails
    }
  };

  return (
    <div className="session-container"> {/* Reusing the existing container style */}
      <h2>Sign Up</h2>
      <form onSubmit={handleSignUp} className="session-form">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          required
        />
        <button type="submit">Sign Up</button>
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      
      <p>
        Already have an account? <Link to="/login">Log In</Link>
      </p>
    </div>
  );
};

export default SignUpPage;