const inventario = require('../services/admin-inventario.service');
const pagos = require('../services/admin-pagos.service');
const reportes = require('../services/admin-reportes.service');

const manejar = (fn, codigo = 200) => async (req, res, next) => {
  try {
    res.status(codigo).json(await fn(req));
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
};

module.exports = {
  // Inventario
  invListar: manejar((req) => inventario.listar(req.query)),
  invCategorias: manejar(() => inventario.categorias()),
  invCrear: manejar((req) => inventario.crear(req.body), 201),
  invActualizar: manejar((req) => inventario.actualizar(req.params.id, req.body)),
  invStock: manejar((req) => inventario.ajustarStock(req.params.id, req.body?.delta)),
  invSubirImagen: manejar((req) => inventario.subirImagen(req.params.id, req.body)),
  invQuitarImagen: manejar((req) => inventario.quitarImagen(req.params.id)),

  // Pagos
  pagListar: manejar((req) => pagos.listar(req.query)),
  pagCotizaciones: manejar(() => pagos.cotizacionesParaPago()),
  pagObtener: manejar((req) => pagos.obtener(Number(req.params.id))),
  pagRegistrar: manejar((req) => pagos.registrar(req.body, req.usuario), 201),
  pagSoporte: manejar((req) => pagos.subirSoporte(req.params.id, req.body)),
  pagEliminar: manejar((req) => pagos.eliminar(req.params.id)),

  pagVerSoporte: async (req, res, next) => {
    try {
      const pago = await pagos.obtener(Number(req.params.id));
      const ruta = pagos.rutaSoporte(pago.soporte_url);
      if (!ruta) return res.status(404).json({ error: 'Este pago no tiene soporte.' });
      res.sendFile(ruta, (e) => { if (e && !res.headersSent) res.status(404).json({ error: 'Archivo no encontrado.' }); });
    } catch (err) {
      if (err.status) return res.status(err.status).json({ error: err.message });
      next(err);
    }
  },

  // Reportes
  repMensual: manejar((req) => reportes.mensual(req.query.mes)),
  repCsv: async (req, res, next) => {
    try {
      const { nombre, contenido } = await reportes.csv(req.query.mes);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${nombre}"`);
      res.send(contenido);
    } catch (err) {
      if (err.status) return res.status(err.status).json({ error: err.message });
      next(err);
    }
  },
};
