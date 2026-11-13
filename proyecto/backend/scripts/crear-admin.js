require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('../src/config/db');

async function main() {
  const [nombre, correo, password] = process.argv.slice(2);
  if (!nombre || !correo || !password) {
    console.log('Uso: node scripts/crear-admin.js "Nombre" correo@ejemplo.com "contraseña"');
    return;
  }
  if (password.length < 8) throw new Error('La contraseña debe tener al menos 8 caracteres.');

  const hash = await bcrypt.hash(password, 10);
  await pool.query(
    'INSERT INTO usuarios (nombre, correo, password_hash, rol) VALUES (?, ?, ?, ?)',
    [nombre, correo.toLowerCase(), hash, 'admin']
  );
  console.log('Administrador creado:', correo);
}

main()
  .catch((e) => console.error('Error:', e.code === 'ER_DUP_ENTRY' ? 'Ese correo ya existe.' : e.message))
  .finally(() => pool.end());