const { Router } = require('express');
const controller = require('../controllers/productos.controller');

const router = Router();

router.get('/categorias', controller.listarCategorias);
router.get('/productos', controller.listar);

module.exports = router;