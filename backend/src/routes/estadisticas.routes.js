const { Router } = require('express');
const controller = require('../controllers/estadisticas.controller');

const router = Router();

router.get('/', controller.obtener);

module.exports = router;