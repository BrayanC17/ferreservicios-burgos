const service = require('../services/admin-solicitudes.service');

const manejar = (fn) => async (req, res, next) => {
  try {
    res.json(await fn(req));
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
};

module.exports = {
  listarCotizaciones: manejar((req) => service.listarCotizaciones(req.query)),
  detalleCotizacion: manejar((req) => service.detalleCotizacion(req.params.id)),
  estadoCotizacion: manejar((req) =>
    service.cambiarEstado('cotizaciones', req.params.id, req.body?.estado)
  ),
  listarServicios: manejar((req) => service.listarServicios(req.query)),
  estadoServicio: manejar((req) =>
    service.cambiarEstado('servicios', req.params.id, req.body?.estado)
  ),
  eliminarCotizacion: manejar((req) => service.eliminar('cotizaciones', req.params.id)),
  eliminarServicio: manejar((req) => service.eliminar('servicios', req.params.id)),
};