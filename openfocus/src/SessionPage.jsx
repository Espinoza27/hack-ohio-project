import React from 'react';
import { useParams } from 'react-router-dom';

const SessionPage = () => {
  // This hook gets the 'sessionId' from the URL
  const { sessionId } = useParams();

  return (
    <div>
      <h2>Welcome to Study Session:</h2>
      <p>Session ID: {sessionId}</p>

      {/* We will add the live chat component here */}
    </div>
  );
};

export default SessionPage;