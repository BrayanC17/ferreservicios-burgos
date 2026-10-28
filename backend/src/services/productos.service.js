const pool = require('../config/db');

// Lista productos activos con búsqueda, filtro por categoría, destacados y paginación.
async function listar({ q, categoria, destacados, page = 1, limit = 12 } = {}) {
  page = Math.max(parseInt(page) || 1, 1);
  limit = Math.min(Math.max(parseInt(limit) || 12, 1), 50);
  const offset = (page - 1) * limit;

  const condiciones = ['p.activo = 1'];
  const params = [];

  if (q) {
    condiciones.push('(p.nombre LIKE ? OR p.sku LIKE ?)');
    params.push(`%${q}%`, `%${q}%`);
  }
  if (categoria) {
    condiciones.push('c.slug = ?');
    params.push(categoria);
  }
  if (destacados) {
    condiciones.push('p.destacado = 1');
  }

  const where = condiciones.join(' AND ');

  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total
       FROM productos p
       JOIN categorias c ON c.id = p.categoria_id
      WHERE ${where}`,
    params
  );

  const [data] = await pool.query(
    `SELECT p.id, p.sku, p.nombre, p.precio, p.imagen_url, p.destacado,
            c.nombre AS categoria, c.slug AS categoria_slug
       FROM productos p
       JOIN categorias c ON c.id = p.categoria_id
      WHERE ${where}
      ORDER BY p.destacado DESC, p.nombre ASC
      LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  return {
    data,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
}

// Categorías activas con la cantidad de productos activos de cada una.
async function listarCategorias() {
  const [rows] = await pool.query(
    `SELECT c.id, c.nombre, c.slug, COUNT(p.id) AS total_productos
       FROM categorias c
       LEFT JOIN productos p ON p.categoria_id = c.id AND p.activo = 1
      WHERE c.activa = 1
      GROUP BY c.id, c.nombre, c.slug
      ORDER BY total_productos DESC, c.nombre ASC`
  );
  return rows;
}

module.exports = { listar, listarCategorias };