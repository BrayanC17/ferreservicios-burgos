const fs = require('fs');
const path = require('path');
const pool = require('../config/db');
const { errorHttp, entero } = require('./errores');
const { detectarTipo } = require('./admin-inventario.service');

const MEDIOS = ['Efectivo', 'Transferencia', 'Nequi', 'Daviplata', 'Tarjeta'];
const CARPETA = path.join(__dirname, '..', '..', 'private', 'comprobantes') // fuera de /imagenes: no es público;

const CAMPOS = `id, numero, cotizacion_id, cliente, concepto, monto, medio_pago, referencia,
                soporte_url, DATE_FORMAT(fecha_pago, '%Y-%m-%d') AS fecha_pago, registrado_por, creado_en`;

function paginacion(page, limit) {
  page = Math.max(parseInt(page) || 1, 1);
  limit = Math.min(Math.max(parseInt(limit) || 15, 1), 50);
  return { page, limit, offset: (page - 1) * limit };
}

const hoyBogota = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });
const fechaValida = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));

async function listar(query) {
  const { page, limit, offset } = paginacion(query.page, query.limit);
  const cond = [];
  const params = [];

  if (query.medio) {
    if (!MEDIOS.includes(query.medio)) throw errorHttp(400, 'Medio de pago inválido.');
    cond.push('medio_pago = ?'); params.push(query.medio);
  }
  if (query.mes) {
    if (!/^\d{4}-\d{2}$/.test(query.mes)) throw errorHttp(400, 'Mes inválido (use AAAA-MM).');
    cond.push("DATE_FORMAT(fecha_pago, '%Y-%m') = ?"); params.push(query.mes);
  }
  if (query.q) {
    cond.push('(cliente LIKE ? OR concepto LIKE ? OR numero LIKE ? OR referencia LIKE ?)');
    params.push(...Array(4).fill(`%${query.q}%`));
  }
  const where = cond.length ? 'WHERE ' + cond.join(' AND ') : '';

  const [[agg]] = await pool.query(
    `SELECT COUNT(*) AS total, COALESCE(SUM(monto), 0) AS suma FROM pagos ${where}`, params);
  const [data] = await pool.query(
    `SELECT ${CAMPOS} FROM pagos ${where} ORDER BY fecha_pago DESC, id DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]);
  const [porMedio] = await pool.query(
    `SELECT medio_pago, COUNT(*) AS cantidad, SUM(monto) AS total FROM pagos ${where}
      GROUP BY medio_pago ORDER BY total DESC`, params);

  return {
    data: data.map((p) => ({ ...p, monto: Number(p.monto) })),
    meta: { total: agg.total, page, limit, totalPages: Math.max(Math.ceil(agg.total / limit), 1) },
    resumen: {
      suma: Number(agg.suma),
      porMedio: porMedio.map((m) => ({ medio_pago: m.medio_pago, cantidad: m.cantidad, total: Number(m.total) })),
    },
  };
}

// Cotizaciones que se pueden asociar a un pago (no canceladas).
async function cotizacionesParaPago() {
  const [rows] = await pool.query(
    `SELECT c.id, c.codigo, c.nombre, c.total, c.estado,
            COALESCE((SELECT SUM(monto) FROM pagos WHERE cotizacion_id = c.id), 0) AS pagado
       FROM cotizaciones c
      WHERE c.estado <> 'cancelada'
      ORDER BY c.creada_en DESC LIMIT 100`);
  return rows.map((r) => ({ ...r, total: Number(r.total), pagado: Number(r.pagado) }));
}

async function obtener(id) {
  const [rows] = await pool.query(`SELECT ${CAMPOS} FROM pagos WHERE id = ?`, [id]);
  if (!rows[0]) throw errorHttp(404, 'Pago no encontrado.');
  return { ...rows[0], monto: Number(rows[0].monto) };
}

async function registrar(datos = {}, usuario) {
  const cliente = String(datos.cliente ?? '').trim();
  const concepto = String(datos.concepto ?? '').trim();
  const medio = String(datos.medio_pago ?? '').trim();
  const referencia = String(datos.referencia ?? '').trim();
  const monto = Number(datos.monto);
  const fecha = String(datos.fecha_pago ?? hoyBogota()).trim();
  let cotizacionId = null;

  if (cliente.length < 3 || cliente.length > 100) throw errorHttp(400, 'Cliente inválido.');
  if (concepto.length < 3 || concepto.length > 200) throw errorHttp(400, 'Concepto inválido.');
  if (!MEDIOS.includes(medio)) throw errorHttp(400, 'Medio de pago inválido.');
  if (!Number.isFinite(monto) || monto <= 0 || monto > 999999999) throw errorHttp(400, 'Monto inválido.');
  if (referencia.length > 60) throw errorHttp(400, 'La referencia es muy larga.');
  if (!fechaValida(fecha) || fecha > hoyBogota()) throw errorHttp(400, 'Fecha de pago inválida.');

  if (datos.cotizacion_id) {
    cotizacionId = entero(datos.cotizacion_id, 'Cotización inválida.');
    const [c] = await pool.query('SELECT id FROM cotizaciones WHERE id = ?', [cotizacionId]);
    if (!c[0]) throw errorHttp(400, 'La cotización no existe.');
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [r] = await conn.query(
      `INSERT INTO pagos (cotizacion_id, cliente, concepto, monto, medio_pago, referencia, fecha_pago, registrado_por)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [cotizacionId, cliente, concepto, monto, medio, referencia || null, fecha, usuario?.nombre ?? null]);
    const numero = `PAG-${String(r.insertId).padStart(6, '0')}`;
    await conn.query('UPDATE pagos SET numero = ? WHERE id = ?', [numero, r.insertId]);
    await conn.commit();
    return obtener(r.insertId);
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

async function subirSoporte(idCrudo, buf) {
  const id = entero(idCrudo);
  if (!Buffer.isBuffer(buf) || !buf.length) throw errorHttp(400, 'No llegó ninguna imagen.');
  const tipo = detectarTipo(buf);
  if (!tipo) throw errorHttp(400, 'Formato no válido. Usa PNG, JPG o WEBP.');
  const pago = await obtener(id);

  await fs.promises.mkdir(CARPETA, { recursive: true });
  const nombre = `${pago.numero.toLowerCase()}-${Date.now()}.${tipo}`;
  await fs.promises.writeFile(path.join(CARPETA, nombre), buf);
  await pool.query('UPDATE pagos SET soporte_url = ? WHERE id = ?', [`comprobantes/${nombre}`, id]);
  borrarSoporte(pago.soporte_url);
  return obtener(id);
}

function borrarSoporte(rel) {
  if (!rel || !rel.startsWith('comprobantes/')) return;
  const ruta = path.join(CARPETA, path.basename(rel));
  fs.promises.unlink(ruta).catch(() => {});
}

async function eliminar(idCrudo) {
  const id = entero(idCrudo);
  const pago = await obtener(id);
  await pool.query('DELETE FROM pagos WHERE id = ?', [id]);
  borrarSoporte(pago.soporte_url);
  return { id };
}

function rutaSoporte(rel) {
  if (!rel || !rel.startsWith('comprobantes/')) return null;
  return path.join(CARPETA, path.basename(rel));
}

module.exports = { rutaSoporte, listar, cotizacionesParaPago, obtener, registrar, subirSoporte, eliminar, MEDIOS };
