import React from 'react';
import { Link } from 'react-router-dom';

const HomePage = () => {
  return (
    <div>
      <h2>Study Sessions</h2>
      {/* We will soon load a list from Firebase here */}

      <p>Example Session:</p>
      <Link to="/session/example-session-123">
        Join Example Session
      </Link>
    </div>
  );
};

export default HomePage;