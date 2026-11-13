import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../api.config';
import { Meta } from './admin-solicitudes.service';

export interface ProductoAdmin {
  id: number;
  categoria_id: number;
  categoria: string;
  sku: string;
  nombre: string;
  descripcion: string | null;
  marca: string | null;
  unidad: string;
  precio: string | number;
  stock: number;
  stock_minimo: number;
  imagen_url: string | null;
  destacado: number;
  activo: number;
}

export interface ResumenInventario {
  total: number;
  bajo: number;
  agotado: number;
  inactivo: number;
  valor: number;
}

export interface ListadoInventario {
  data: ProductoAdmin[];
  meta: Meta;
  resumen: ResumenInventario;
}

export interface CategoriaAdmin {
  id: number;
  nombre: string;
}

export interface FormProducto {
  categoria_id: number;
  sku: string;
  nombre: string;
  descripcion: string;
  marca: string;
  unidad: string;
  precio: number;
  stock: number;
  destacado: boolean;
  activo: boolean;
}

@Injectable({ providedIn: 'root' })
export class AdminInventarioService {
  private http = inject(HttpClient);
  private base = `${API_URL}/admin/inventario`;

  listar(f: { q?: string; categoria?: string; filtro?: string; page?: number }): Observable<ListadoInventario> {
    let p = new HttpParams();
    for (const [k, v] of Object.entries(f)) {
      if (v !== undefined && v !== null && v !== '') p = p.set(k, String(v));
    }
    return this.http.get<ListadoInventario>(this.base, { params: p });
  }

  categorias() {
    return this.http.get<CategoriaAdmin[]>(`${this.base}/categorias`);
  }

  crear(d: FormProducto) {
    return this.http.post<ProductoAdmin>(this.base, d);
  }

  actualizar(id: number, d: Partial<FormProducto>) {
    return this.http.patch<ProductoAdmin>(`${this.base}/${id}`, d);
  }

  ajustarStock(id: number, delta: number) {
    return this.http.patch<ProductoAdmin>(`${this.base}/${id}/stock`, { delta });
  }

  subirImagen(id: number, archivo: File) {
    return this.http.put<ProductoAdmin>(`${this.base}/${id}/imagen`, archivo, {
      headers: { 'Content-Type': archivo.type },
    });
  }

  quitarImagen(id: number) {
    return this.http.delete<ProductoAdmin>(`${this.base}/${id}/imagen`);
  }
}
