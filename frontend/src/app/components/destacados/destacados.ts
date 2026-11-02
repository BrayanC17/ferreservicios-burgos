import { Component, OnInit, inject, signal } from '@angular/core';
import { IMAGENES_URL } from '../../api.config';
import { Producto, ProductosService } from '../../services/productos.service';
import { RouterLink } from '@angular/router';
import { CarritoService } from '../../services/carrito.service';


@Component({
  selector: 'app-destacados',
  imports: [RouterLink],
  templateUrl: './destacados.html',
  styleUrl: './destacados.css',
})
export class Destacados implements OnInit {
  private productosService = inject(ProductosService);
  productos = signal<Producto[]>([]);

  ngOnInit() {
    this.productosService.destacados().subscribe({
      next: (r) => this.productos.set(r.data),
      error: (e) => console.error('No se pudieron cargar los destacados:', e),
    });
  }

  imagen(p: Producto) {
    return p.imagen_url ? `${IMAGENES_URL}/${p.imagen_url}` : null;
  }

  precio(p: Producto) {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(Number(p.precio));
  }

    private carrito = inject(CarritoService);
  agregado = signal<number | null>(null);

  agregar(p: Producto) {
    this.carrito.agregar(p);
    this.agregado.set(p.id);
    setTimeout(() => this.agregado.set(null), 1500);
  }

}
