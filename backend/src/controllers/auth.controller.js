const service = require('../services/auth.service');

async function login(req, res, next) {
  try {
    res.json(await service.login(req.body?.correo, req.body?.password));
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
}

function me(req, res) {
  res.json({ usuario: req.usuario });
}

module.exports = { login, me };