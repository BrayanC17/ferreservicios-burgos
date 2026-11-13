import { isDevMode } from '@angular/core';

// En desarrollo (ng serve) la API corre en otro puerto; en producción
// Express sirve el sitio y la API desde el mismo dominio.
const ORIGEN = isDevMode() ? 'http://localhost:3000' : '';

export const API_URL = `${ORIGEN}/api`;
export const IMAGENES_URL = `${ORIGEN}/imagenes`;
