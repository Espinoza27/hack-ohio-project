// src/App.jsx
import { Routes, Route } from 'react-router-dom'
// You will need to create these components in the next steps
import HomePage from './HomePage' // <-- We will create this
import SessionPage from './SessionPage' // <-- We will create this

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/session/:sessionId" element={<SessionPage />} />
    </Routes>
  )
}

export default App