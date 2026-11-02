const service = require('../services/cotizaciones.service');

async function crear(req, res, next) {
  try {
    const resultado = await service.crear(req.body);
    res.status(201).json(resultado);
  } catch (err) {
    if (err.status === 400) return res.status(400).json({ error: err.message });
    next(err);
  }
}

module.exports = { crear };