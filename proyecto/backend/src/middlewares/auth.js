const authService = require('../services/auth.service');

// Protege una ruta: exige un token válido en el encabezado Authorization.
function requiereAuth(req, res, next) {
  const [tipo, token] = (req.headers.authorization || '').split(' ');
  if (tipo !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'No autorizado.' });
  }
  try {
    const datos = authService.verificar(token);
    req.usuario = { id: datos.sub, nombre: datos.nombre, rol: datos.rol };
    next();
  } catch {
    res.status(401).json({ error: 'Tu sesión expiró. Inicia sesión de nuevo.' });
  }
}

module.exports = { requiereAuth };