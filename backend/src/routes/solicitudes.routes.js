const { Router } = require('express');
const controller = require('../controllers/solicitudes.controller');

const router = Router();

router.post('/servicios', controller.crear);

module.exports = router;