import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../api.config';

export interface Meta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface Listado<T> {
  data: T[];
  meta: Meta;
  conteos: Record<string, number>;
}

export interface Cotizacion {
  id: number;
  codigo: string;
  nombre: string;
  celular: string;
  dia_recogida: string;
  medio_pago: string;
  observaciones: string | null;
  total: string | number;
  estado: string;
  creada_en: string;
}

export interface ItemCotizacion {
  producto_id: number;
  nombre: string;
  precio_unitario: string | number;
  cantidad: number;
}

export interface CotizacionDetalle extends Cotizacion {
  items: ItemCotizacion[];
}

export interface Servicio {
  id: number;
  codigo: string;
  nombre: string;
  celular: string;
  tipo_servicio: string;
  fecha_visita: string;
  direccion: string;
  barrio: string | null;
  descripcion: string;
  estado: string;
  creada_en: string;
}

export interface Filtros {
  estado?: string;
  q?: string;
  page?: number;
}

@Injectable({ providedIn: 'root' })
export class AdminSolicitudesService {
  private http = inject(HttpClient);
  private base = `${API_URL}/admin`;

  private armar(f: Filtros) {
    let p = new HttpParams();
    for (const [k, v] of Object.entries(f)) {
      if (v !== undefined && v !== null && v !== '') p = p.set(k, String(v));
    }
    return p;
  }

  cotizaciones(f: Filtros): Observable<Listado<Cotizacion>> {
    return this.http.get<Listado<Cotizacion>>(`${this.base}/cotizaciones`, { params: this.armar(f) });
  }

  detalleCotizacion(id: number): Observable<CotizacionDetalle> {
    return this.http.get<CotizacionDetalle>(`${this.base}/cotizaciones/${id}`);
  }

  estadoCotizacion(id: number, estado: string) {
    return this.http.patch(`${this.base}/cotizaciones/${id}/estado`, { estado });
  }

  servicios(f: Filtros): Observable<Listado<Servicio>> {
    return this.http.get<Listado<Servicio>>(`${this.base}/servicios`, { params: this.armar(f) });
  }

  estadoServicio(id: number, estado: string) {
    return this.http.patch(`${this.base}/servicios/${id}/estado`, { estado });
  }
}
