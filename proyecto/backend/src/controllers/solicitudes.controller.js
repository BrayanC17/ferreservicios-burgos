const service = require('../services/solicitudes.service');

async function crear(req, res, next) {
  try {
    res.status(201).json(await service.crear(req.body));
  } catch (err) {
    if (err.status === 400) return res.status(400).json({ error: err.message });
    next(err);
  }
}

module.exports = { crear };