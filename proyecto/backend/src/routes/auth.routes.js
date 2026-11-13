const { Router } = require('express');
const rateLimit = require('express-rate-limit');
const controller = require('../controllers/auth.controller');
const { requiereAuth } = require('../middlewares/auth');

const router = Router();

// Máximo 10 intentos de login cada 15 minutos por dirección.
const limiteLogin = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos. Espera 15 minutos e intenta de nuevo.' },
});

router.post('/auth/login', limiteLogin, controller.login);
router.get('/auth/me', requiereAuth, controller.me);

module.exports = router;