// src/LoginPage.jsx
import React, { useState } from 'react';
import { auth } from './firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigate, Link } from 'react-router-dom';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // On success, Firebase's auth listener (in App.jsx)
      // will see the change and redirect automatically.
      navigate('/'); // Redirect to home
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="session-container"> {/* We can reuse this style */}
      <h2>Login</h2>
      <form onSubmit={handleLogin} className="session-form">
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
        <button type="submit">Log In</button>
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      
      <p>
        Don't have an account?
        <Link to="/signup">Sign Up</Link>
        </p>

      {/* You can add a Link here to your SignUp page later */}
    </div>
  );
};

export default LoginPage;