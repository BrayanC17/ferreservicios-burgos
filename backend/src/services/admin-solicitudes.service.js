const pool = require('../config/db');

const TABLAS = { cotizaciones: 'cotizaciones', servicios: 'solicitudes_servicio' };
const ESTADOS = {
  cotizaciones: ['pendiente', 'confirmada', 'entregada', 'cancelada'],
  servicios: ['pendiente', 'confirmada', 'realizada', 'cancelada'],
};

function errorHttp(status, mensaje) {
  const e = new Error(mensaje);
  e.status = status;
  return e;
}

function paginacion(page, limit) {
  page = Math.max(parseInt(page) || 1, 1);
  limit = Math.min(Math.max(parseInt(limit) || 15, 1), 50);
  return { page, limit, offset: (page - 1) * limit };
}

function filtros(clave, { estado, q }, camposBusqueda) {
  const condiciones = [];
  const params = [];

  if (estado) {
    if (!ESTADOS[clave].includes(estado)) throw errorHttp(400, 'Estado inválido.');
    condiciones.push('estado = ?');
    params.push(estado);
  }
  if (q) {
    condiciones.push('(' + camposBusqueda.map((c) => `${c} LIKE ?`).join(' OR ') + ')');
    camposBusqueda.forEach(() => params.push(`%${q}%`));
  }
  return { where: condiciones.length ? 'WHERE ' + condiciones.join(' AND ') : '', params };
}

async function conteos(clave) {
  const [rows] = await pool.query(
    `SELECT estado, COUNT(*) AS total FROM ${TABLAS[clave]} GROUP BY estado`
  );
  return Object.fromEntries(rows.map((r) => [r.estado, r.total]));
}

async function listarCotizaciones(query) {
  const { page, limit, offset } = paginacion(query.page, query.limit);
  const { where, params } = filtros('cotizaciones', query, ['nombre', 'celular', 'codigo']);

  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM cotizaciones ${where}`,
    params
  );
  const [data] = await pool.query(
    `SELECT id, codigo, nombre, celular,
            DATE_FORMAT(dia_recogida, '%Y-%m-%d') AS dia_recogida,
            medio_pago, observaciones, total, estado, creada_en
       FROM cotizaciones ${where}
      ORDER BY creada_en DESC, id DESC
      LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  return {
    data,
    meta: { total, page, limit, totalPages: Math.max(Math.ceil(total / limit), 1) },
    conteos: await conteos('cotizaciones'),
  };
}

async function detalleCotizacion(id) {
  id = parseInt(id);
  if (!Number.isInteger(id)) throw errorHttp(400, 'Identificador inválido.');

  const [rows] = await pool.query(
    `SELECT id, codigo, nombre, celular,
            DATE_FORMAT(dia_recogida, '%Y-%m-%d') AS dia_recogida,
            medio_pago, observaciones, total, estado, creada_en
       FROM cotizaciones WHERE id = ?`,
    [id]
  );
  if (!rows[0]) throw errorHttp(404, 'Cotización no encontrada.');

  const [items] = await pool.query(
    `SELECT producto_id, nombre, precio_unitario, cantidad
       FROM cotizacion_items WHERE cotizacion_id = ? ORDER BY id`,
    [id]
  );
  return { ...rows[0], items };
}

async function listarServicios(query) {
  const { page, limit, offset } = paginacion(query.page, query.limit);
  const { where, params } = filtros('servicios', query, ['nombre', 'celular', 'codigo', 'direccion']);

  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM solicitudes_servicio ${where}`,
    params
  );
  const [data] = await pool.query(
    `SELECT id, codigo, nombre, celular, tipo_servicio,
            DATE_FORMAT(fecha_visita, '%Y-%m-%d') AS fecha_visita,
            direccion, barrio, descripcion, estado, creada_en
       FROM solicitudes_servicio ${where}
      ORDER BY creada_en DESC, id DESC
      LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  return {
    data,
    meta: { total, page, limit, totalPages: Math.max(Math.ceil(total / limit), 1) },
    conteos: await conteos('servicios'),
  };
}

async function cambiarEstado(clave, id, estado) {
  id = parseInt(id);
  if (!Number.isInteger(id)) throw errorHttp(400, 'Identificador inválido.');
  if (!ESTADOS[clave].includes(estado)) throw errorHttp(400, 'Estado inválido.');

  const [r] = await pool.query(`UPDATE ${TABLAS[clave]} SET estado = ? WHERE id = ?`, [estado, id]);
  if (r.affectedRows === 0) throw errorHttp(404, 'No se encontró la solicitud.');
  return { id, estado };
}

module.exports = { listarCotizaciones, detalleCotizacion, listarServicios, cambiarEstado };