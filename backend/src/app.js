const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const pool = require('./config/db');
const estadisticasRoutes = require('./routes/estadisticas.routes');
const productosRoutes = require('./routes/productos.routes');
const cotizacionesRoutes = require('./routes/cotizaciones.routes');
const solicitudesRoutes = require('./routes/solicitudes.routes');
const authRoutes = require('./routes/auth.routes');
const app = express();
const adminRoutes = require('./routes/admin.routes');  

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:4200' }));
app.use(express.json());


// Imágenes de productos
app.use('/imagenes', express.static(path.join(__dirname, '..', 'uploads')));

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

// Rutas de la API
app.use('/api/estadisticas', estadisticasRoutes);
app.use('/api', productosRoutes);
app.use('/api', cotizacionesRoutes);
app.use('/api', solicitudesRoutes);
app.use('/api', authRoutes);
app.use('/api/admin', adminRoutes);
// Ruta inexistente (siempre después de todas las rutas)
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada.' });
});

// Error interno: no se muestran detalles al cliente
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Ocurrió un error interno. Intenta de nuevo más tarde.' });
});

module.exports = app;