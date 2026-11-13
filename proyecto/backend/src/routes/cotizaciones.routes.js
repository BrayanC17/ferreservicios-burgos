const { Router } = require('express');
const controller = require('../controllers/cotizaciones.controller');

const router = Router();

router.post('/cotizaciones', controller.crear);

module.exports = router;