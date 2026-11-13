const pool = require('../config/db');

// Cuenta los productos y categorías activos que hay en este momento.
async function obtenerEstadisticas() {
  const [[{ productos }]] = await pool.query(
    'SELECT COUNT(*) AS productos FROM productos WHERE activo = 1'
  );
  const [[{ categorias }]] = await pool.query(
    'SELECT COUNT(*) AS categorias FROM categorias WHERE activa = 1'
  );
  return { productos, categorias };
}

module.exports = { obtenerEstadisticas };