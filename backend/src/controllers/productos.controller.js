const productosService = require('../services/productos.service');

async function listar(req, res, next) {
  try {
    const { q, categoria, destacados, page, limit } = req.query;
    const resultado = await productosService.listar({
      q,
      categoria,
      destacados: destacados === 'true',
      page,
      limit,
    });
    res.json(resultado);
  } catch (err) {
    next(err);
  }
}

async function listarCategorias(req, res, next) {
  try {
    res.json(await productosService.listarCategorias());
  } catch (err) {
    next(err);
  }
}

module.exports = { listar, listarCategorias };