require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const productosRoutes = require('./routes/productos.routes');

const pool = require('./config/db');
const estadisticasRoutes = require('./routes/estadisticas.routes');

const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:4200' }));
app.use(express.json());
app.use('/imagenes', express.static(path.join(__dirname, '..', 'uploads')));
app.use('/api/productos', productosRoutes);

// Comprueba que la API y la base de datos respondan.
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch (err) {
    console.error(err);
    res.status(503).json({ status: 'error', database: 'unreachable' });
  }
});

app.use('/api/estadisticas', estadisticasRoutes);

// Ruta inexistente
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada.' });
});

// Error interno: no se muestran detalles al cliente
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Ocurrió un error interno. Intenta de nuevo más tarde.' });
});

module.exports = app;