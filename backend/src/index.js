const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const sheetRoutes = require('./routes/sheets');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Backend Demoucron opérationnel 🚀' });
});

app.use('/api/auth', authRoutes);
app.use('/api/sheets', sheetRoutes);

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Route introuvable' });
});

app.listen(PORT, () => {
  console.log(`✅ Backend lancé sur http://localhost:${PORT}`);
});