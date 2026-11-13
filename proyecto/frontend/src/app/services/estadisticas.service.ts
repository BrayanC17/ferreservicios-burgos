import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_URL } from '../api.config';

export interface Estadisticas {
  productos: number;
  categorias: number;
}

@Injectable({ providedIn: 'root' })
export class EstadisticasService {
  private http = inject(HttpClient);

  obtener(): Observable<Estadisticas> {
    return this.http.get<Estadisticas>(`${API_URL}/estadisticas`);
  }
}
