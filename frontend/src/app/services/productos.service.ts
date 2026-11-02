import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../api.config';


export interface Producto {
  id: number;
  sku: string;
  nombre: string;
  precio: string | number;
  imagen_url: string | null;
  destacado: number;
  categoria: string;
  categoria_slug: string;
}

export interface Categoria {
  id: number;
  nombre: string;
  slug: string;
  total_productos: number;
}

export interface Paginado<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export interface Sugerencia {
  id: number;
  nombre: string;
  categoria: string;
}

@Injectable({ providedIn: 'root' })
export class ProductosService {
  private http = inject(HttpClient);

  destacados(): Observable<Paginado<Producto>> {
    return this.http.get<Paginado<Producto>>(`${API_URL}/productos?destacados=true`);
  }

  categorias(): Observable<Categoria[]> {
    return this.http.get<Categoria[]>(`${API_URL}/categorias`);
  }

    listar(params: { q?: string; categoria?: string; page?: number; limit?: number }) {
    let httpParams = new HttpParams();
    for (const [clave, valor] of Object.entries(params)) {
      if (valor !== undefined && valor !== null && valor !== '') {
        httpParams = httpParams.set(clave, String(valor));
      }
    }
    return this.http.get<Paginado<Producto>>(`${API_URL}/productos`, { params: httpParams });

  }

  sugerencias(q: string): Observable<Sugerencia[]> {
    return this.http.get<Sugerencia[]>(`${API_URL}/productos/sugerencias`, { params: { q } });
  }
}
