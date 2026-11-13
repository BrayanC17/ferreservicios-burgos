import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../api.config';
import { Meta } from './admin-solicitudes.service';

export const MEDIOS_PAGO = ['Efectivo', 'Transferencia', 'Nequi', 'Daviplata', 'Tarjeta'];

export interface Pago {
  id: number;
  numero: string;
  cotizacion_id: number | null;
  cliente: string;
  concepto: string;
  monto: number;
  medio_pago: string;
  referencia: string | null;
  soporte_url: string | null;
  fecha_pago: string;
  registrado_por: string | null;
  creado_en: string;
}

export interface ListadoPagos {
  data: Pago[];
  meta: Meta;
  resumen: {
    suma: number;
    porMedio: { medio_pago: string; cantidad: number; total: number }[];
  };
}

export interface CotizacionPago {
  id: number;
  codigo: string;
  nombre: string;
  total: number;
  estado: string;
  pagado: number;
}

export interface FormPago {
  cotizacion_id: number | null;
  cliente: string;
  concepto: string;
  monto: number;
  medio_pago: string;
  referencia: string;
  fecha_pago: string;
}

@Injectable({ providedIn: 'root' })
export class AdminPagosService {
  private http = inject(HttpClient);
  private base = `${API_URL}/admin/pagos`;

  listar(f: { q?: string; medio?: string; mes?: string; page?: number }): Observable<ListadoPagos> {
    let p = new HttpParams();
    for (const [k, v] of Object.entries(f)) {
      if (v !== undefined && v !== null && v !== '') p = p.set(k, String(v));
    }
    return this.http.get<ListadoPagos>(this.base, { params: p });
  }

  cotizaciones() {
    return this.http.get<CotizacionPago[]>(`${this.base}/cotizaciones`);
  }

  registrar(d: FormPago) {
    return this.http.post<Pago>(this.base, d);
  }

  subirSoporte(id: number, archivo: File) {
    return this.http.put<Pago>(`${this.base}/${id}/soporte`, archivo, {
      headers: { 'Content-Type': archivo.type },
    });
  }

  // El soporte es privado: se descarga con el token y se muestra como blob.
  soporte(id: number) {
    return this.http.get(`${this.base}/${id}/soporte`, { responseType: 'blob' });
  }

  eliminar(id: number) {
    return this.http.delete<{ id: number }>(`${this.base}/${id}`);
  }
}
