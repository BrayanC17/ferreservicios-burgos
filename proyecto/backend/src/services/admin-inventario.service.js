const fs = require('fs');
const path = require('path');
const pool = require('../config/db');
const { errorHttp, entero } = require('./errores');

// Se considera "stock bajo" cuando quedan 5 unidades o menos (pero más de 0).
const UMBRAL_STOCK_BAJO = 5;

const CARPETA_IMAGENES = path.join(__dirname, '..', '..', 'uploads', 'productos');

function paginacion(page, limit) {
  page = Math.max(parseInt(page) || 1, 1);
  limit = Math.min(Math.max(parseInt(limit) || 15, 1), 50);
  return { page, limit, offset: (page - 1) * limit };
}

const SELECT = `SELECT p.id, p.categoria_id, c.nombre AS categoria, p.sku, p.nombre, p.descripcion, p.marca,
                       p.unidad, p.precio, p.stock, p.stock_minimo, p.imagen_url, p.destacado, p.activo
                  FROM productos p JOIN categorias c ON c.id = p.categoria_id`;

async function listar(query) {
  const { page, limit, offset } = paginacion(query.page, query.limit);
  const cond = [];
  const params = [];

  if (query.q) {
    cond.push('(p.nombre LIKE ? OR p.sku LIKE ? OR p.marca LIKE ?)');
    params.push(`%${query.q}%`, `%${query.q}%`, `%${query.q}%`);
  }
  if (query.categoria) {
    cond.push('p.categoria_id = ?');
    params.push(entero(query.categoria));
  }
  switch (query.filtro) {
    case 'bajo': cond.push(`p.activo = 1 AND p.stock > 0 AND p.stock <= ${UMBRAL_STOCK_BAJO}`); break;
    case 'agotado': cond.push('p.activo = 1 AND p.stock = 0'); break;
    case 'inactivo': cond.push('p.activo = 0'); break;
    case 'destacado': cond.push('p.destacado = 1'); break;
    case undefined: case '': break;
    default: throw errorHttp(400, 'Filtro inválido.');
  }
  const where = cond.length ? 'WHERE ' + cond.join(' AND ') : '';

  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM productos p ${where}`, params);
  const [data] = await pool.query(
    `${SELECT} ${where} ORDER BY p.nombre ASC LIMIT ? OFFSET ?`, [...params, limit, offset]);

  const [[r]] = await pool.query(
    `SELECT COUNT(*) AS total,
            COALESCE(SUM(activo = 1 AND stock > 0 AND stock <= ${UMBRAL_STOCK_BAJO}), 0) AS bajo,
            COALESCE(SUM(activo = 1 AND stock = 0), 0) AS agotado,
            COALESCE(SUM(activo = 0), 0) AS inactivo,
            COALESCE(SUM(CASE WHEN activo = 1 THEN precio * stock END), 0) AS valor
       FROM productos`);

  return {
    data,
    meta: { total, page, limit, totalPages: Math.max(Math.ceil(total / limit), 1) },
    resumen: {
      total: Number(r.total), bajo: Number(r.bajo), agotado: Number(r.agotado),
      inactivo: Number(r.inactivo), valor: Number(r.valor),
    },
  };
}

async function categorias() {
  const [rows] = await pool.query('SELECT id, nombre FROM categorias WHERE activa = 1 ORDER BY nombre');
  return rows;
}

function validar(d = {}, parcial = false) {
  const out = {};
  const texto = (k, min, max, etiqueta, opcional = false) => {
    if (d[k] === undefined && parcial) return;
    const v = String(d[k] ?? '').trim();
    if (!v && opcional) { out[k] = null; return; }
    if (v.length < min || v.length > max) throw errorHttp(400, `${etiqueta} inválido.`);
    out[k] = v;
  };
  const numero = (k, etiqueta, { decimal = false, max = 99999999 } = {}) => {
    if (d[k] === undefined && parcial) return;
    const n = Number(d[k]);
    if (!Number.isFinite(n) || n < 0 || n > max || (!decimal && !Number.isInteger(n))) {
      throw errorHttp(400, `${etiqueta} inválido.`);
    }
    out[k] = n;
  };

  texto('sku', 2, 40, 'El SKU');
  texto('nombre', 3, 150, 'El nombre');
  texto('descripcion', 0, 2000, 'La descripción', true);
  texto('marca', 0, 80, 'La marca', true);
  texto('unidad', 1, 20, 'La unidad');
  numero('precio', 'El precio', { decimal: true });
  numero('stock', 'El stock');
  if (d.stock_minimo !== undefined) numero('stock_minimo', 'El stock mínimo');
  if (d.categoria_id !== undefined || !parcial) out.categoria_id = entero(d.categoria_id, 'Categoría inválida.');
  if (d.destacado !== undefined) out.destacado = d.destacado ? 1 : 0;
  if (d.activo !== undefined) out.activo = d.activo ? 1 : 0;
  return out;
}

function manejarDuplicado(err) {
  if (err.code === 'ER_DUP_ENTRY') throw errorHttp(409, 'Ya existe un producto con ese SKU.');
  if (err.code === 'ER_NO_REFERENCED_ROW_2') throw errorHttp(400, 'La categoría no existe.');
  throw err;
}

async function obtener(id) {
  const [rows] = await pool.query(`${SELECT} WHERE p.id = ?`, [id]);
  if (!rows[0]) throw errorHttp(404, 'Producto no encontrado.');
  return rows[0];
}

async function crear(datos) {
  const v = validar(datos);
  v.unidad = v.unidad || 'unidad';
  const campos = Object.keys(v);
  try {
    const [r] = await pool.query(
      `INSERT INTO productos (${campos.join(', ')}) VALUES (${campos.map(() => '?').join(', ')})`,
      campos.map((c) => v[c]));
    return obtener(r.insertId);
  } catch (e) { return manejarDuplicado(e); }
}

async function actualizar(idCrudo, datos) {
  const id = entero(idCrudo);
  const v = validar(datos, true);
  const campos = Object.keys(v);
  if (!campos.length) throw errorHttp(400, 'No hay cambios.');
  try {
    const [r] = await pool.query(
      `UPDATE productos SET ${campos.map((c) => `${c} = ?`).join(', ')} WHERE id = ?`,
      [...campos.map((c) => v[c]), id]);
    if (r.affectedRows === 0) throw errorHttp(404, 'Producto no encontrado.');
  } catch (e) { if (e.status) throw e; manejarDuplicado(e); }
  return obtener(id);
}

// Suma o resta unidades al stock (delta puede ser negativo).
async function ajustarStock(idCrudo, delta) {
  const id = entero(idCrudo);
  const n = Number(delta);
  if (!Number.isInteger(n) || n === 0 || Math.abs(n) > 100000) throw errorHttp(400, 'Cantidad inválida.');
  const [r] = await pool.query(
    'UPDATE productos SET stock = stock + ? WHERE id = ? AND stock + ? >= 0', [n, id, n]);
  if (r.affectedRows === 0) {
    await obtener(id);
    throw errorHttp(400, 'No puedes dejar el stock en negativo.');
  }
  return obtener(id);
}

// ---- Imagen: llega como binario crudo (image/png | jpeg | webp) ----
function detectarTipo(buf) {
  if (buf.length > 12 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpg';
  if (buf.length > 12 && buf.subarray(0, 4).toString() === 'RIFF' && buf.subarray(8, 12).toString() === 'WEBP') return 'webp';
  return null;
}

function slug(texto) {
  return String(texto).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'producto';
}

function borrarArchivo(rel) {
  if (!rel || !rel.startsWith('productos/')) return;
  const ruta = path.join(CARPETA_IMAGENES, '..', rel);
  if (path.dirname(ruta) !== CARPETA_IMAGENES) return;
  fs.promises.unlink(ruta).catch(() => {});
}

async function subirImagen(idCrudo, buf) {
  const id = entero(idCrudo);
  if (!Buffer.isBuffer(buf) || !buf.length) throw errorHttp(400, 'No llegó ninguna imagen.');
  const tipo = detectarTipo(buf);
  if (!tipo) throw errorHttp(400, 'Formato no válido. Usa PNG, JPG o WEBP.');

  const p = await obtener(id);
  await fs.promises.mkdir(CARPETA_IMAGENES, { recursive: true });
  const nombre = `${slug(p.nombre)}-${Date.now()}.${tipo}`;
  await fs.promises.writeFile(path.join(CARPETA_IMAGENES, nombre), buf);

  const rel = `productos/${nombre}`;
  await pool.query('UPDATE productos SET imagen_url = ? WHERE id = ?', [rel, id]);
  if (p.imagen_url && p.imagen_url !== rel) borrarArchivo(p.imagen_url);
  return obtener(id);
}

async function quitarImagen(idCrudo) {
  const id = entero(idCrudo);
  const p = await obtener(id);
  await pool.query('UPDATE productos SET imagen_url = NULL WHERE id = ?', [id]);
  borrarArchivo(p.imagen_url);
  return obtener(id);
}

module.exports = { listar, categorias, crear, actualizar, ajustarStock, subirImagen, quitarImagen, detectarTipo, slug };