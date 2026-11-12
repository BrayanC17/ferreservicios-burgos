import { Component, OnInit, computed, inject, signal } from '@angular/core';
import {
  AdminSolicitudesService,
  Cotizacion,
  CotizacionDetalle,
  Meta,
  Servicio,
} from '../../../services/admin-solicitudes.service';

type Vista = 'cotizaciones' | 'servicios';

@Component({
  selector: 'app-admin-solicitudes',
  imports: [],
  templateUrl: './admin-solicitudes.html',
  styleUrl: './admin-solicitudes.css',
})
export class AdminSolicitudes implements OnInit {
  private api = inject(AdminSolicitudesService);

  vista = signal<Vista>('cotizaciones');
  estado = signal('');
  q = signal('');
  pagina = signal(1);

  cotizaciones = signal<Cotizacion[]>([]);
  servicios = signal<Servicio[]>([]);
  meta = signal<Meta>({ total: 0, page: 1, limit: 15, totalPages: 1 });
  conteos = signal<Record<string, number>>({});

  cargando = signal(true);
  error = signal('');
  abierto = signal<number | null>(null);
  detalle = signal<CotizacionDetalle | null>(null);

  estados = computed(() =>
    this.vista() === 'cotizaciones'
      ? ['pendiente', 'confirmada', 'entregada', 'cancelada']
      : ['pendiente', 'confirmada', 'realizada', 'cancelada']
  );
  totalTodos = computed(() => Object.values(this.conteos()).reduce((a, b) => a + b, 0));

  ngOnInit() {
    this.cargar();
  }

  cambiarVista(v: Vista) {
    if (this.vista() === v) return;
    this.vista.set(v);
    this.estado.set('');
    this.q.set('');
    this.pagina.set(1);
    this.abierto.set(null);
    this.cargar();
  }

  filtrarEstado(e: string) {
    this.estado.set(e);
    this.pagina.set(1);
    this.abierto.set(null);
    this.cargar();
  }

  buscar(valor: string) {
    this.q.set(valor.trim());
    this.pagina.set(1);
    this.abierto.set(null);
    this.cargar();
  }

  irAPagina(n: number) {
    this.pagina.set(n);
    this.abierto.set(null);
    this.cargar();
  }

  cargar() {
    this.cargando.set(true);
    this.error.set('');
    const filtros = { estado: this.estado(), q: this.q(), page: this.pagina() };
    const falla = (e: unknown) => {
      console.error(e);
      this.error.set('No se pudo cargar la información. Revisa que el servidor esté encendido.');
      this.cargando.set(false);
    };

    if (this.vista() === 'cotizaciones') {
      this.api.cotizaciones(filtros).subscribe({
        next: (r) => {
          this.cotizaciones.set(r.data);
          this.meta.set(r.meta);
          this.conteos.set(r.conteos);
          this.cargando.set(false);
        },
        error: falla,
      });
    } else {
      this.api.servicios(filtros).subscribe({
        next: (r) => {
          this.servicios.set(r.data);
          this.meta.set(r.meta);
          this.conteos.set(r.conteos);
          this.cargando.set(false);
        },
        error: falla,
      });
    }
  }

  alternar(id: number) {
    if (this.abierto() === id) {
      this.abierto.set(null);
      return;
    }
    this.abierto.set(id);
    if (this.vista() === 'cotizaciones') {
      this.detalle.set(null);
      this.api.detalleCotizacion(id).subscribe({
        next: (d) => this.detalle.set(d),
        error: (e) => console.error(e),
      });
    }
  }

  cambiarEstado(id: number, select: HTMLSelectElement) {
    const nuevo = select.value;
    const lista: { id: number; estado: string }[] =
      this.vista() === 'cotizaciones' ? this.cotizaciones() : this.servicios();
    const anterior = lista.find((x) => x.id === id)?.estado ?? '';
    if (nuevo === anterior) return;

    const peticion =
      this.vista() === 'cotizaciones'
        ? this.api.estadoCotizacion(id, nuevo)
        : this.api.estadoServicio(id, nuevo);

    peticion.subscribe({
      next: () => this.cargar(), // refresca la lista y los contadores
      error: () => {
        select.value = anterior;
        this.error.set('No se pudo actualizar el estado. Intenta de nuevo.');
      },
    });
  }

  moneda(valor: string | number) {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(Number(valor));
  }

  // 'yyyy-mm-dd' -> 'dd/mm/yyyy' (sin pasar por Date para evitar corrimientos de zona horaria)
  fecha(iso: string) {
    const [a, m, d] = iso.split('-');
    return `${d}/${m}/${a}`;
  }

  fechaHora(iso: string) {
    return new Date(iso).toLocaleString('es-CO', {
      timeZone: 'America/Bogota',
      dateStyle: 'short',
      timeStyle: 'short',
    });
  }

  whatsapp(celular: string) {
    return `https://wa.me/57${celular}`;
  }
}
