const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

function errorHttp(status, mensaje) {
  const e = new Error(mensaje);
  e.status = status;
  return e;
}

function secreto() {
  const s = process.env.JWT_SECRET;
  if (!s || s.length < 32) throw new Error('JWT_SECRET no está configurado en el .env');
  return s;
}

// Hash de relleno: así tarda lo mismo aunque el correo no exista.
const HASH_FALSO = bcrypt.hashSync('relleno-no-valido', 10);

async function login(correo, password) {
  correo = String(correo ?? '').trim().toLowerCase();
  password = String(password ?? '');
  if (!correo || !password) throw errorHttp(400, 'Ingresa tu correo y tu contraseña.');

  const [rows] = await pool.query(
    'SELECT id, nombre, correo, password_hash, rol FROM usuarios WHERE correo = ? AND activo = 1',
    [correo]
  );
  const u = rows[0];

  const coincide = await bcrypt.compare(password, u ? u.password_hash : HASH_FALSO);
  if (!u || !coincide) throw errorHttp(401, 'Correo o contraseña incorrectos.');

  const token = jwt.sign({ sub: u.id, nombre: u.nombre, rol: u.rol }, secreto(), {
    expiresIn: process.env.JWT_EXPIRES || '8h',
  });

  return { token, usuario: { id: u.id, nombre: u.nombre, correo: u.correo, rol: u.rol } };
}

function verificar(token) {
  return jwt.verify(token, secreto());
}

module.exports = { login, verificar };