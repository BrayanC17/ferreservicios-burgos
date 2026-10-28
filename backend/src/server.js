const app = require('./app');

const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, () => {
  console.log(`API Ferreservicios Burgos escuchando en http://localhost:${PORT}`);
});