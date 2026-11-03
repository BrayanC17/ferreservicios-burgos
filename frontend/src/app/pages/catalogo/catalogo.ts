import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IMAGENES_URL } from '../../api.config';
import { Categoria, Producto, ProductosService } from '../../services/productos.service';
import { CarritoService } from '../../services/carrito.service';

@Component({
  selector: 'app-catalogo',
  imports: [],
  templateUrl: './catalogo.html',
  styleUrl: './catalogo.css',
})
export class Catalogo implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private api = inject(ProductosService);
  private carrito = inject(CarritoService);


  productos = signal<Producto[]>([]);
  categorias = signal<Categoria[]>([]);
  meta = signal({ total: 0, page: 1, limit: 12, totalPages: 1 });
  cargando = signal(true);
  error = signal(false);
  q = signal('');
  categoria = signal('');
  agregado = signal<number | null>(null);

  paginas = computed(() =>
    Array.from({ length: this.meta().totalPages }, (_, i) => i + 1)
  );

  ngOnInit() {
    this.api.categorias().subscribe({
      next: (c) => this.categorias.set(c),
      error: (e) => console.error('No se pudieron cargar las categorías:', e),
    });

    // Cada vez que cambia la URL (?q=, ?categoria=, ?page=) se vuelve a cargar.
    this.route.queryParamMap.subscribe((p) => {
      this.q.set(p.get('q') ?? '');
      this.categoria.set(p.get('categoria') ?? '');
      this.cargar(Number(p.get('page')) || 1);
    });
  }

  private cargar(page: number) {
    this.cargando.set(true);
    this.error.set(false);
    this.api
      .listar({ q: this.q(), categoria: this.categoria(), page, limit: 12 })
      .subscribe({
        next: (r) => {
          this.productos.set(r.data);
          this.meta.set(r.meta);
          this.cargando.set(false);
        },
        error: (e) => {
          console.error('No se pudo cargar el catálogo:', e);
          this.error.set(true);
          this.cargando.set(false);
        },
      });
  }

  private irA(queryParams: Record<string, string | number | null>) {
    this.router.navigate([], { queryParams, queryParamsHandling: 'merge' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  buscar(valor: string) {
    this.irA({ q: valor.trim() || null, categoria: null, page: null });
  }

  elegirCategoria(slug: string) {
    this.irA({ categoria: slug || null, page: null });
  }

  irAPagina(n: number) {
    this.irA({ page: n });
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

  agregar(p: Producto) {
    this.carrito.agregar(p);
    this.agregado.set(p.id);
    setTimeout(() => this.agregado.set(null), 1500);
  }
}
