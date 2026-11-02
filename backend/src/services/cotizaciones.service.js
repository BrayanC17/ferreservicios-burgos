const pool = require('../config/db');

const MEDIOS_PAGO = ['Efectivo', 'Transferencia', 'Nequi', 'Daviplata', 'Tarjeta'];

function errorValidacion(mensaje) {
  const e = new Error(mensaje);
  e.status = 400;
  return e;
}

function validar(datos) {
  const d = datos || {};
  const nombre = String(d.nombre ?? '').trim();
  const celular = String(d.celular ?? '').trim();
  const dia = String(d.dia_recogida ?? '').trim();
  const medio = String(d.medio_pago ?? '').trim();
  const observaciones = String(d.observaciones ?? '').trim();

  if (nombre.length < 3 || nombre.length > 100) throw errorValidacion('Nombre inválido.');
  if (!/^3\d{9}$/.test(celular)) throw errorValidacion('Celular inválido.');
  if (!MEDIOS_PAGO.includes(medio)) throw errorValidacion('Medio de pago inválido.');
  if (observaciones.length > 500) throw errorValidacion('Las observaciones son muy largas.');

  const hoy = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dia) || dia < hoy) throw errorValidacion('Día de recogida inválido.');

  if (!Array.isArray(d.items) || d.items.length === 0 || d.items.length > 100) {
    throw errorValidacion('La cotización no tiene productos.');
  }

  // Une duplicados y valida cantidades.
  const cantidades = new Map();
  for (const it of d.items) {
    const id = Number(it.producto_id);
    const cant = Number(it.cantidad);
    if (!Number.isInteger(id) || !Number.isInteger(cant) || cant < 1 || cant > 999) {
      throw errorValidacion('Producto o cantidad inválidos.');
    }
    cantidades.set(id, (cantidades.get(id) ?? 0) + cant);
  }

  return { nombre, celular, dia, medio, observaciones, cantidades };
}

async function crear(datos) {
  const v = validar(datos);
  const ids = [...v.cantidades.keys()];

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Precios reales desde la base de datos, no los que manda el navegador.
    const [productos] = await conn.query(
      'SELECT id, nombre, precio FROM productos WHERE activo = 1 AND id IN (?)',
      [ids]
    );
    if (productos.length !== ids.length) {
      throw errorValidacion('Algunos productos ya no están disponibles. Revisa tu cotización.');
    }

    let total = 0;
    const lineas = productos.map((p) => {
      const cantidad = v.cantidades.get(p.id);
      total += Number(p.precio) * cantidad;
      return [null, p.id, p.nombre, p.precio, cantidad];
    });

    const [res] = await conn.query(
      `INSERT INTO cotizaciones (nombre, celular, dia_recogida, medio_pago, observaciones, total)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [v.nombre, v.celular, v.dia, v.medio, v.observaciones || null, total]
    );

    const id = res.insertId;
    const codigo = `COT-${String(id).padStart(6, '0')}`;
    await conn.query('UPDATE cotizaciones SET codigo = ? WHERE id = ?', [codigo, id]);

    lineas.forEach((l) => (l[0] = id));
    await conn.query(
      `INSERT INTO cotizacion_items (cotizacion_id, producto_id, nombre, precio_unitario, cantidad)
       VALUES ?`,
      [lineas]
    );

    await conn.commit();
    return { id, codigo, total };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

module.exports = { crear };