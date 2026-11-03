import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { Catalogo } from './pages/catalogo/catalogo';
import { Cotizacion } from './pages/cotizacion/cotizacion';
import { SolicitarServicio } from './pages/solicitar-servicio/solicitar-servicio';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'catalogo', component: Catalogo },
  { path: 'cotizacion', component: Cotizacion },
  { path: 'servicios', component: SolicitarServicio },
  { path: '**', redirectTo: '' },
];
