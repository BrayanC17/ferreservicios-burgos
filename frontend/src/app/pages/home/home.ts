import { Component, computed, inject, signal } from '@angular/core';
import { Estadisticas, EstadisticasService } from '../../services/estadisticas.service';
import { Categorias } from '../../components/categorias/categorias';
import { Destacados } from '../../components/destacados/destacados';
import { Servicios } from '../../components/servicios/servicios';

@Component({
  selector: 'app-home',
  imports: [Categorias, Destacados, Servicios],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  private estadisticasService = inject(EstadisticasService);

  // Datos que llegan de la API (null mientras cargan o si hay un error)
  private datos = signal<Estadisticas | null>(null);

  // Las cifras de la sección principal, calculadas a partir de los datos
  estadisticas = computed(() => {
    const d = this.datos();
    return [
      { cifra: d ? this.formatear(d.productos) : '—', etiqueta: 'productos registrados' },
      { cifra: d ? this.formatear(d.categorias) : '—', etiqueta: 'categorías' },
      { cifra: '+5 años', etiqueta: 'atendiendo Fontibón' },
    ];
  });

  busquedasRapidas = ['Taladro', 'Cinta aislante', 'Llave de jardín', 'Bombillo', 'Canaleta', 'Pegante'];

  pasos = [
    { numero: 1, titulo: 'Elige', texto: 'los productos que necesitas' },
    { numero: 2, titulo: 'Envía', texto: 'tu nombre, celular y día de recogida' },
    { numero: 3, titulo: 'Recoge', texto: 'en el local y paga con tu método preferido' },
  ];

  beneficios = [
    { titulo: 'Precios a la vista', texto: 'Consulta el valor actual sin ir al local.' },
    { titulo: 'Cotización en línea', texto: 'Arma tu lista y la recibimos al instante.' },
    { titulo: 'Recoge cuando quieras', texto: 'Elige el día y pasa por tu pedido.' },
    { titulo: 'Servicios a domicilio', texto: 'Electricidad, plomería y más.' },
  ];

  constructor() {
    this.estadisticasService.obtener().subscribe({
      next: (datos) => this.datos.set(datos),
      error: (e) => {
      console.error('No se pudieron cargar las estadísticas:', e);
      this.datos.set(null); // si la API falla, se muestra "—"
    }, // si la API falla, se muestra "—"
    });
  }

  // 2355 -> "2.355"
  private formatear(n: number): string {
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }
}
