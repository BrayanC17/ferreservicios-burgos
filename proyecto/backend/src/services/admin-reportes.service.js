const pool = require('../config/db');
const { errorHttp } = require('./errores');

function rangoMes(mes) {
  const hoy = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });
  mes = mes || hoy.slice(0, 7);
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(mes)) throw errorHttp(400, 'Mes inválido (use AAAA-MM).');
  const [a, m] = mes.split('-').map(Number);
  const sig = m === 12 ? `${a + 1}-01-01` : `${a}-${String(m + 1).padStart(2, '0')}-01`;
  return { mes, desde: `${mes}-01`, hasta: sig };
}

const num = (v) => Number(v ?? 0);

async function mensual(mesCrudo) {
  const { mes, desde, hasta } = rangoMes(mesCrudo);

  const [cot] = await pool.query(
    `SELECT estado, COUNT(*) AS cantidad, COALESCE(SUM(total), 0) AS total
       FROM cotizaciones WHERE creada_en >= ? AND creada_en < ? GROUP BY estado`, [desde, hasta]);
  const [srv] = await pool.query(
    `SELECT estado, COUNT(*) AS cantidad FROM solicitudes_servicio
      WHERE creada_en >= ? AND creada_en < ? GROUP BY estado`, [desde, hasta]);
  const [srvTipo] = await pool.query(
    `SELECT tipo_servicio, COUNT(*) AS cantidad FROM solicitudes_servicio
      WHERE creada_en >= ? AND creada_en < ? GROUP BY tipo_servicio ORDER BY cantidad DESC`, [desde, hasta]);
  const [pagosMedio] = await pool.query(
    `SELECT medio_pago, COUNT(*) AS cantidad, SUM(monto) AS total FROM pagos
      WHERE fecha_pago >= ? AND fecha_pago < ? GROUP BY medio_pago ORDER BY total DESC`, [desde, hasta]);
  const [diario] = await pool.query(
    `SELECT DATE_FORMAT(fecha_pago, '%Y-%m-%d') AS dia, SUM(monto) AS total FROM pagos
      WHERE fecha_pago >= ? AND fecha_pago < ? GROUP BY fecha_pago ORDER BY fecha_pago`, [desde, hasta]);
  const [top] = await pool.query(
    `SELECT i.nombre, SUM(i.cantidad) AS unidades, SUM(i.cantidad * i.precio_unitario) AS valor
       FROM cotizacion_items i JOIN cotizaciones c ON c.id = i.cotizacion_id
      WHERE c.creada_en >= ? AND c.creada_en < ? AND c.estado <> 'cancelada'
      GROUP BY i.producto_id, i.nombre ORDER BY unidades DESC, valor DESC LIMIT 10`, [desde, hasta]);
  const [bajo] = await pool.query(
    `SELECT sku, nombre, stock FROM productos
      WHERE activo = 1 AND stock <= 5 ORDER BY stock ASC, nombre LIMIT 50`);

  const porEstado = (rows) => Object.fromEntries(rows.map((r) => [r.estado, num(r.cantidad)]));
  const totalCot = cot.reduce((s, r) => s + num(r.cantidad), 0);
  const ventas = num(cot.find((r) => r.estado === 'entregada')?.total);
  const pagos = pagosMedio.reduce((s, r) => s + num(r.total), 0);
  const cotCant = cot.reduce((s, r) => s + num(r.cantidad), 0);
  const totalSrv = srv.reduce((s, r) => s + num(r.cantidad), 0);

  return {
    mes,
    kpis: {
      cotizaciones: totalCot,
      ventasEntregadas: ventas,
      pagosRecibidos: pagos,
      serviciosSolicitados: totalSrv,
      serviciosRealizados: num(srv.find((r) => r.estado === 'realizada')?.cantidad),
      ticketPromedio: cotCant ? Math.round(cot.reduce((s, r) => s + num(r.total), 0) / cotCant) : 0,
    },
    cotizacionesPorEstado: porEstado(cot),
    serviciosPorEstado: porEstado(srv),
    serviciosPorTipo: srvTipo.map((r) => ({ tipo: r.tipo_servicio, cantidad: num(r.cantidad) })),
    pagosPorMedio: pagosMedio.map((r) => ({ medio: r.medio_pago, cantidad: num(r.cantidad), total: num(r.total) })),
    pagosPorDia: diario.map((r) => ({ dia: r.dia, total: num(r.total) })),
    topProductos: top.map((r) => ({ nombre: r.nombre, unidades: num(r.unidades), valor: num(r.valor) })),
    stockBajo: bajo,
  };
}

const celda = (v) => {
  let s = String(v ?? '');
  if (/^[=+\-@]/.test(s)) s = `'${s}`; // evita inyección de fórmulas en Excel
  return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

async function csv(mesCrudo) {
  const r = await mensual(mesCrudo);
  const L = [];
  const fila = (...c) => L.push(c.map(celda).join(';'));

  fila('Ferreservicios Burgos 22 - Reporte mensual', r.mes);
  fila();
  fila('RESUMEN');
  fila('Cotizaciones recibidas', r.kpis.cotizaciones);
  fila('Ventas entregadas (COP)', r.kpis.ventasEntregadas);
  fila('Pagos recibidos (COP)', r.kpis.pagosRecibidos);
  fila('Ticket promedio (COP)', r.kpis.ticketPromedio);
  fila('Servicios solicitados', r.kpis.serviciosSolicitados);
  fila('Servicios realizados', r.kpis.serviciosRealizados);
  fila();
  fila('COTIZACIONES POR ESTADO');
  Object.entries(r.cotizacionesPorEstado).forEach(([k, v]) => fila(k, v));
  fila();
  fila('SERVICIOS POR TIPO');
  r.serviciosPorTipo.forEach((s) => fila(s.tipo, s.cantidad));
  fila();
  fila('PAGOS POR MEDIO', 'Cantidad', 'Total (COP)');
  r.pagosPorMedio.forEach((p) => fila(p.medio, p.cantidad, p.total));
  fila();
  fila('PRODUCTOS MÁS COTIZADOS', 'Unidades', 'Valor (COP)');
  r.topProductos.forEach((p) => fila(p.nombre, p.unidades, p.valor));
  fila();
  fila('STOCK BAJO (5 O MENOS) / AGOTADO', 'Stock');
  r.stockBajo.forEach((p) => fila(`${p.sku} - ${p.nombre}`, p.stock));

  return { nombre: `reporte-${r.mes}.csv`, contenido: '\uFEFF' + L.join('\r\n') };
}

module.exports = { mensual, csv };
