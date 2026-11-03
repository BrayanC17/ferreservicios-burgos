const pool = require('../config/db');

const TIPOS = ['Electricidad', 'Plomería', 'Pintura', 'Otros arreglos'];

function errorValidacion(mensaje) {
  const e = new Error(mensaje);
  e.status = 400;
  return e;
}

function validar(datos) {
  const d = datos || {};
  const nombre = String(d.nombre ?? '').trim();
  const celular = String(d.celular ?? '').trim();
  const tipo = String(d.tipo_servicio ?? '').trim();
  const dia = String(d.fecha_visita ?? '').trim();
  const direccion = String(d.direccion ?? '').trim();
  const barrio = String(d.barrio ?? '').trim();
  const descripcion = String(d.descripcion ?? '').trim();

  if (nombre.length < 3 || nombre.length > 100) throw errorValidacion('Nombre inválido.');
  if (!/^3\d{9}$/.test(celular)) throw errorValidacion('Celular inválido.');
  if (!TIPOS.includes(tipo)) throw errorValidacion('Tipo de servicio inválido.');
  if (direccion.length < 5 || direccion.length > 200) throw errorValidacion('Dirección inválida.');
  if (barrio.length > 100) throw errorValidacion('Barrio inválido.');
  if (descripcion.length < 10 || descripcion.length > 500) {
    throw errorValidacion('Cuéntanos con un poco más de detalle qué necesitas (mínimo 10 letras).');
  }

  const hoy = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dia) || dia < hoy) throw errorValidacion('Fecha de visita inválida.');
  if (new Date(`${dia}T12:00:00`).getDay() === 0) {
    throw errorValidacion('Atendemos de lunes a sábado. Elige otro día.');
  }

  return { nombre, celular, tipo, dia, direccion, barrio, descripcion };
}

async function crear(datos) {
  const v = validar(datos);

  const [res] = await pool.query(
    `INSERT INTO solicitudes_servicio
       (nombre, celular, tipo_servicio, fecha_visita,  direccion, barrio, descripcion)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [v.nombre, v.celular, v.tipo, v.dia, v.direccion, v.barrio || null, v.descripcion]
  );

  const codigo = `SRV-${String(res.insertId).padStart(6, '0')}`;
  await pool.query('UPDATE solicitudes_servicio SET codigo = ? WHERE id = ?', [codigo, res.insertId]);

  return { id: res.insertId, codigo };
}

module.exports = { crear };