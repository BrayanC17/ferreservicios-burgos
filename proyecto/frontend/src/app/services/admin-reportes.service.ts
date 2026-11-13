import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { API_URL } from '../api.config';

export interface ReporteMensual {
  mes: string;
  kpis: {
    cotizaciones: number;
    ventasEntregadas: number;
    pagosRecibidos: number;
    serviciosSolicitados: number;
    serviciosRealizados: number;
    ticketPromedio: number;
  };
  cotizacionesPorEstado: Record<string, number>;
  serviciosPorEstado: Record<string, number>;
  serviciosPorTipo: { tipo: string; cantidad: number }[];
  pagosPorMedio: { medio: string; cantidad: number; total: number }[];
  pagosPorDia: { dia: string; total: number }[];
  topProductos: { nombre: string; unidades: number; valor: number }[];
  stockBajo: { sku: string; nombre: string; stock: number }[];
}

@Injectable({ providedIn: 'root' })
export class AdminReportesService {
  private http = inject(HttpClient);
  private base = `${API_URL}/admin/reportes`;

  mensual(mes: string) {
    return this.http.get<ReporteMensual>(`${this.base}/mensual`, { params: new HttpParams().set('mes', mes) });
  }

  csv(mes: string) {
    return this.http.get(`${this.base}/mensual.csv`, {
      params: new HttpParams().set('mes', mes),
      responseType: 'blob',
    });
  }
}
