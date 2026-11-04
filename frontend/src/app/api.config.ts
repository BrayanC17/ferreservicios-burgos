export const API_URL = 'http://localhost:3000/api';
export const IMAGENES_URL = 'http://localhost:3000/imagenes';

import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './auth.interceptor';
provideHttpClient(withInterceptors([authInterceptor]))
