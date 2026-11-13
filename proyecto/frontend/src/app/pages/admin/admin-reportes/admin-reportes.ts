import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { AdminReportesService, ReporteMensual } from '../../../services/admin-reportes.service';

@Component({
  selector: 'app-admin-reportes',
  imports: [],
  templateUrl: './admin-reportes.html',
})
export class AdminReportes implements OnInit {
  private api = inject(AdminReportesService);

  mes = signal(new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' }).slice(0, 7));
  reporte = signal<ReporteMensual | null>(null);
  cargando = signal(true);
  error = signal('');
  descargando = signal(false);

  maxDia = computed(() => Math.max(1, ...(this.reporte()?.pagosPorDia.map((d) => d.total) ?? [0])));
  maxProducto = computed(() => Math.max(1, ...(this.reporte()?.topProductos.map((p) => p.unidades) ?? [0])));
  maxMedio = computed(() => Math.max(1, ...(this.reporte()?.pagosPorMedio.map((m) => m.total) ?? [0])));

  ngOnInit() {
    this.cargar();
  }

  cambiarMes(valor: string) {
    if (!/^\d{4}-\d{2}$/.test(valor)) return;
    this.mes.set(valor);
    this.cargar();
  }

  cargar() {
    this.cargando.set(true);
    this.error.set('');
    this.api.mensual(this.mes()).subscribe({
      next: (r) => {
        this.reporte.set(r);
        this.cargando.set(false);
      },
      error: (e) => {
        console.error(e);
        this.error.set('No se pudo generar el reporte. Revisa que el servidor esté encendido.');
        this.cargando.set(false);
      },
    });
  }

  descargarCsv() {
    this.descargando.set(true);
    this.api.csv(this.mes()).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reporte-${this.mes()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        this.descargando.set(false);
      },
      error: () => {
        this.error.set('No se pudo descargar el archivo.');
        this.descargando.set(false);
      },
    });
  }

  imprimir() {
    window.print();
  }

  pct(valor: number, max: number) {
    return `${Math.max(Math.round((valor / max) * 100), valor > 0 ? 3 : 0)}%`;
  }

  nombreMes() {
    const [a, m] = this.mes().split('-').map(Number);
    return new Date(a, m - 1, 1).toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });
  }

  diaCorto(iso: string) {
    return iso.slice(8);
  }

  moneda(valor: number) {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency', currency: 'COP', maximumFractionDigits: 0,
    }).format(valor);
  }

  estados(obj: Record<string, number>) {
    return Object.entries(obj);
  }
}
