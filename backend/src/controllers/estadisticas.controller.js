const service = require('../services/estadisticas.service');

async function obtener(req, res, next) {
  try {
    res.json(await service.obtenerEstadisticas());
  } catch (err) {
    next(err);
  }
}

module.exports = { obtener };