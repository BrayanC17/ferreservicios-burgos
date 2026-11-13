function errorHttp(status, mensaje) {
  const e = new Error(mensaje);
  e.status = status;
  return e;
}
function entero(valor, mensaje = 'Identificador inválido.') {
  const n = Number(valor);
  if (!Number.isInteger(n) || n < 1) throw errorHttp(400, mensaje);
  return n;
}
module.exports = { errorHttp, entero };
