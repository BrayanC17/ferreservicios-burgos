import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../api.config';

export interface NuevaCotizacion {
  nombre: string;
  celular: string;
  dia_recogida: string;
  medio_pago: string;
  observaciones: string;
  items: { producto_id: number; cantidad: number }[];
}

export interface CotizacionCreada {
  id: number;
  codigo: string;
  total: number;
}

@Injectable({ providedIn: 'root' })
export class CotizacionesService {
  private http = inject(HttpClient);

  crear(datos: NuevaCotizacion): Observable<CotizacionCreada> {
    return this.http.post<CotizacionCreada>(`${API_URL}/cotizaciones`, datos);
  }
}
