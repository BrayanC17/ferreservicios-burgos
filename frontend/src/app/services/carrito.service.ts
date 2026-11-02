import { Injectable, computed, signal } from '@angular/core';
import { Producto } from './productos.service';

export interface ItemCotizacion {
  id: number;
  sku: string;
  nombre: string;
  precio: number;
  imagen_url: string | null;
  categoria: string;
  cantidad: number;
}

const CLAVE = 'fsb_cotizacion';

@Injectable({ providedIn: 'root' })
export class CarritoService {
  private _items = signal<ItemCotizacion[]>(this.leer());

  items = this._items.asReadonly();
  totalUnidades = computed(() => this._items().reduce((s, i) => s + i.cantidad, 0));
  total = computed(() => this._items().reduce((s, i) => s + i.precio * i.cantidad, 0));

  agregar(p: Producto, cantidad = 1) {
    const items = [...this._items()];
    const existente = items.find((i) => i.id === p.id);
    if (existente) {
      existente.cantidad = Math.min(existente.cantidad + cantidad, 999);
    } else {
      items.push({
        id: p.id,
        sku: p.sku,
        nombre: p.nombre,
        precio: Number(p.precio),
        imagen_url: p.imagen_url,
        categoria: p.categoria,
        cantidad,
      });
    }
    this.actualizar(items);
  }

  cambiarCantidad(id: number, cantidad: number) {
    if (cantidad < 1) return this.quitar(id);
    this.actualizar(
      this._items().map((i) => (i.id === id ? { ...i, cantidad: Math.min(cantidad, 999) } : i))
    );
  }

  quitar(id: number) {
    this.actualizar(this._items().filter((i) => i.id !== id));
  }

  vaciar() {
    this.actualizar([]);
  }

  private actualizar(items: ItemCotizacion[]) {
    this._items.set(items);
    try {
      localStorage.setItem(CLAVE, JSON.stringify(items));
    } catch {
      /* si el navegador bloquea el almacenamiento, el carrito sigue en memoria */
    }
  }

  private leer(): ItemCotizacion[] {
    try {
      return JSON.parse(localStorage.getItem(CLAVE) ?? '[]');
    } catch {
      return [];
    }
  }
}
