import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../api.config';

export interface NuevaSolicitud {
  nombre: string;
  celular: string;
  tipo_servicio: string;
  fecha_visita: string;
  direccion: string;
  barrio: string;
  descripcion: string;
}

export interface SolicitudCreada {
  id: number;
  codigo: string;
}

@Injectable({ providedIn: 'root' })
export class SolicitudesService {
  private http = inject(HttpClient);

  crear(datos: NuevaSolicitud): Observable<SolicitudCreada> {
    return this.http.post<SolicitudCreada>(`${API_URL}/servicios`, datos);
  }
}
