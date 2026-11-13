import { Component, OnInit, inject, signal } from '@angular/core';
import { Categoria, ProductosService } from '../../services/productos.service';
import { RouterLink } from '@angular/router';

const ICONOS: Record<string, string> = {
  'herramienta': '🔨',
  'electricos': '⚡',
  'bombilleria': '💡',
  'pvc-y-canaletas': '🚰',
  'pinturas-disolventes-y-accesorios': '🎨',
  'cerrajeria': '🔑',
  'candados-y-pilas': '🔒',
  'cintas': '🩹',
  'discos-llaves-y-brocas': '⚙️',
  'tornilleria-chazos-y-empaques': '🔩',
  'puntillas-y-clavos': '📌',
  'pegantes-y-soldaduras': '🧴',
  'siliconas-y-lijas': '🧰',
  'aseo': '🧹',
  'accesorios-de-riego': '💧',
};

@Component({
  selector: 'app-categorias',
  imports: [RouterLink],
  templateUrl: './categorias.html',
  styleUrl: './categorias.css',
})
export class Categorias implements OnInit {
  private productos = inject(ProductosService);
  categorias = signal<Categoria[]>([]);
  total = signal(0);

  ngOnInit() {
    this.productos.categorias().subscribe({
      next: (lista) => {
        this.total.set(lista.length);
        this.categorias.set(lista.slice(0, 8));
      },
      error: (e) => console.error('No se pudieron cargar las categorías:', e),
    });
  }

  icono(slug: string) {
    return ICONOS[slug] ?? '🛠️';
  }
}
