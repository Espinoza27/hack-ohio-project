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
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: '#0d1117',
      padding: '20px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        backgroundColor: '#161b22',
        border: '1px solid #30363d',
        borderRadius: '8px',
        padding: '32px',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)'
      }}>
        <h1 style={{
          color: '#c9d1d9',
          fontSize: '28px',
          fontWeight: '600',
          marginBottom: '8px',
          textAlign: 'center'
        }}>
          Welcome to OpenFocus!
        </h1>
        <h2 style={{
          color: '#8b949e',
          fontSize: '16px',
          fontWeight: '400',
          marginBottom: '24px',
          textAlign: 'center'
        }}>
          Login
        </h2>
        
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
            style={{
              padding: '10px 12px',
              borderRadius: '6px',
              border: '1px solid #30363d',
              backgroundColor: '#0d1117',
              color: '#c9d1d9',
              fontSize: '14px',
              outline: 'none',
              transition: 'border-color 0.2s'
            }}
            onFocus={(e) => e.target.style.borderColor = '#58a6ff'}
            onBlur={(e) => e.target.style.borderColor = '#30363d'}
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
            style={{
              padding: '10px 12px',
              borderRadius: '6px',
              border: '1px solid #30363d',
              backgroundColor: '#0d1117',
              color: '#c9d1d9',
              fontSize: '14px',
              outline: 'none',
              transition: 'border-color 0.2s'
            }}
            onFocus={(e) => e.target.style.borderColor = '#58a6ff'}
            onBlur={(e) => e.target.style.borderColor = '#30363d'}
          />
          <button 
            type="submit"
            style={{
              padding: '10px 20px',
              borderRadius: '6px',
              border: '1px solid #238636',
              backgroundColor: '#238636',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.2s',
              marginTop: '8px'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#2ea043';
              e.target.style.borderColor = '#2ea043';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#238636';
              e.target.style.borderColor = '#238636';
            }}
          >
            Log In
          </button>
        </form>
        
        {error && (
          <p style={{
            color: '#f85149',
            fontSize: '14px',
            marginTop: '16px',
            padding: '8px 12px',
            backgroundColor: '#490202',
            border: '1px solid #f85149',
            borderRadius: '6px'
          }}>
            {error}
          </p>
        )}
        
        <p style={{
          color: '#8b949e',
          fontSize: '14px',
          textAlign: 'center',
          marginTop: '24px'
        }}>
          Don't have an account?{' '}
          <Link 
            to="/signup"
            style={{
              color: '#58a6ff',
              textDecoration: 'none',
              fontWeight: '500'
            }}
            onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
            onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
          >
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;