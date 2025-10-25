// server.js (Node + Express)
const express = require('express');
const cors = require('cors'); // ✅ add this

const app = express();
app.use(cors());
app.use(express.json()); // parse JSON body

// basic auth or token check recommended
app.post('/locations', (req, res) => {
  const { lat, lon, accuracy, timestamp } = req.body;
  console.log('✅ Received location:', lat, lon, accuracy, timestamp);
  res.json({ ok: true });
});

app.listen(3000, () => console.log('🚀 Server listening on http://localhost:3000'));
