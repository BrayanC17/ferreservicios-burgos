const { Router } = require('express');
const controller = require('../controllers/admin-solicitudes.controller');
const gestion = require('../controllers/admin-gestion.controller');
const express = require('express');
const { requiereAuth } = require('../middlewares/auth');

const router = Router();

// Todo lo que cuelga de /api/admin exige sesión iniciada.
router.use(requiereAuth);

router.get('/cotizaciones', controller.listarCotizaciones);
router.get('/cotizaciones/:id', controller.detalleCotizacion);
router.patch('/cotizaciones/:id/estado', controller.estadoCotizacion);
router.delete('/cotizaciones/:id', controller.eliminarCotizacion);

router.get('/servicios', controller.listarServicios);
router.patch('/servicios/:id/estado', controller.estadoServicio);
router.delete('/servicios/:id', controller.eliminarServicio);

// Imágenes: llegan como binario crudo (sin multer), máx. 3 MB.
const binario = express.raw({ type: ['image/png', 'image/jpeg', 'image/webp'], limit: '3mb' });

// Inventario
router.get('/inventario', gestion.invListar);
router.get('/inventario/categorias', gestion.invCategorias);
router.post('/inventario', gestion.invCrear);
router.patch('/inventario/:id', gestion.invActualizar);
router.patch('/inventario/:id/stock', gestion.invStock);
router.put('/inventario/:id/imagen', binario, gestion.invSubirImagen);
router.delete('/inventario/:id/imagen', gestion.invQuitarImagen);

// Pagos con comprobante
router.get('/pagos', gestion.pagListar);
router.get('/pagos/cotizaciones', gestion.pagCotizaciones);
router.post('/pagos', gestion.pagRegistrar);
router.get('/pagos/:id', gestion.pagObtener);
router.put('/pagos/:id/soporte', binario, gestion.pagSoporte);
router.get('/pagos/:id/soporte', gestion.pagVerSoporte);
router.delete('/pagos/:id', gestion.pagEliminar);

// Reportes
router.get('/reportes/mensual', gestion.repMensual);
router.get('/reportes/mensual.csv', gestion.repCsv);

module.exports = router;