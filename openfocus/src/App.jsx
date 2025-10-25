// src/App.jsx
import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { auth } from './firebase'; // <-- Import auth
import { onAuthStateChanged } from 'firebase/auth'; // <-- Import the listener

import HomePage from './HomePage';
import SessionPage from './SessionPage';
import LoginPage from './LoginPage'; // <-- Import your new Login page
import SignUpPage from './SignUpPage';

// This is a custom component to protect routes
const ProtectedRoute = ({ user, children }) => {
  if (!user) {
    // If no user is logged in, redirect to the /login page
    return <Navigate to="/login" replace />;
  }
  return children; // If user is logged in, show the page
};

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // Loading state

  // This listener runs once and checks the user's login status
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setIsLoading(false);
    });

    // Cleanup function
    return () => unsubscribe();
  }, []);

  // Show a loading message while Firebase checks auth
  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Routes>
      {/* --- PROTECTED ROUTES --- */}
      <Route
        path="/"
        element={
          <ProtectedRoute user={currentUser}>
            <HomePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/session/:sessionId"
        element={
          <ProtectedRoute user={currentUser}>
            <SessionPage />
          </ProtectedRoute>
        }
      />

      {/* --- PUBLIC ROUTE --- */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      
      {/* You would also add a <Route path="/signup" ... /> here */}
    </Routes>
  );
}

export default App;