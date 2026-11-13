import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { Catalogo } from './pages/catalogo/catalogo';
import { Cotizacion } from './pages/cotizacion/cotizacion';
import { SolicitarServicio } from './pages/solicitar-servicio/solicitar-servicio';
import { authGuard } from './auth.guard';
import { AdminLogin } from './pages/admin/admin-login/admin-login';
import { AdminLayout } from './pages/admin/admin-layout/admin-layout';
import { AdminResumen } from './pages/admin/admin-resumen/admin-resumen';
import { AdminSolicitudes } from './pages/admin/admin-solicitudes/admin-solicitudes';

import { AdminInventario } from './pages/admin/admin-inventario/admin-inventario';
import { AdminPagos } from './pages/admin/admin-pagos/admin-pagos';
import { AdminReportes } from './pages/admin/admin-reportes/admin-reportes';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'catalogo', component: Catalogo },
  { path: 'cotizacion', component: Cotizacion },
  { path: 'servicios', component: SolicitarServicio },
  { path: 'admin/login', component: AdminLogin },
  {
    path: 'admin',
    component: AdminLayout,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'resumen' },
      { path: 'resumen', component: AdminResumen },
      { path: 'solicitudes', component: AdminSolicitudes },
      { path: 'inventario', component: AdminInventario },
      { path: 'pagos', component: AdminPagos },
      { path: 'reportes', component: AdminReportes },
    ],
  },
  { path: '**', redirectTo: '' },
];
