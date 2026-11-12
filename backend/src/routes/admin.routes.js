const { Router } = require('express');
const controller = require('../controllers/admin-solicitudes.controller');
const { requiereAuth } = require('../middlewares/auth');

const router = Router();

// Todo lo que cuelga de /api/admin exige sesión iniciada.
router.use(requiereAuth);

router.get('/cotizaciones', controller.listarCotizaciones);
router.get('/cotizaciones/:id', controller.detalleCotizacion);
router.patch('/cotizaciones/:id/estado', controller.estadoCotizacion);

router.get('/servicios', controller.listarServicios);
router.patch('/servicios/:id/estado', controller.estadoServicio);

module.exports = router;