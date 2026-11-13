require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pool = require('../src/config/db');

const CARPETA = path.join(__dirname, '..', 'uploads', 'productos');
const EXTENSIONES = ['.jpg', '.jpeg', '.png', '.webp'];

function slug(texto) {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function main() {
  const archivos = fs
    .readdirSync(CARPETA)
    .filter((f) => EXTENSIONES.includes(path.extname(f).toLowerCase()));

  const [productos] = await pool.query('SELECT id, sku, nombre FROM productos');
  const porClave = new Map();
  for (const p of productos) {
    porClave.set(slug(p.sku), p.id);
    porClave.set(slug(p.nombre), p.id);
  }

  let asignadas = 0;
  const sinMatch = [];

  for (const archivo of archivos) {
    const base = slug(path.basename(archivo, path.extname(archivo)));
    const id = porClave.get(base);
    if (!id) {
      sinMatch.push(archivo);
      continue;
    }
    await pool.query('UPDATE productos SET imagen_url = ? WHERE id = ?', [
      `productos/${archivo}`,
      id,
    ]);
    asignadas++;
  }

  console.log(`Imágenes encontradas: ${archivos.length}`);
  console.log(`Asignadas: ${asignadas}`);
  if (sinMatch.length) {
    console.log('Sin producto que coincida:');
    sinMatch.forEach((f) => console.log('  -', f));
  }
}

main()
  .catch((err) => {
    console.error('Error:', err.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());