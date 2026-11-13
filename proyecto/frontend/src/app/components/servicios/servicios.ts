import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-servicios',
  imports: [RouterLink],
  templateUrl: './servicios.html',
  styleUrl: './servicios.css',
})
export class Servicios {
  servicios = [
    {
      nombre: 'Electricidad',
      detalle: 'Tomas, interruptores, iluminación y revisiones.',
      icono: 'M13 2L4 14h7l-1 8 9-12h-7z',
    },
    {
      nombre: 'Plomería',
      detalle: 'Fugas, llaves, tuberías y accesorios.',
      icono: 'M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z',
    },
    {
  nombre: 'Carpintería',
      detalle: 'Puertas, muebles, repisas y reparaciones en madera.',
      icono: 'M3 21l6-6M14 4l6 6-9 9-6-6 9-9z',
    },
    {
      nombre: 'Pintura',
      detalle: 'Pintura de interiores y exteriores, retoques y acabados.',
      icono: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.88L7 14.14 2 11.13l6.91-1.01L12 2z',
    },
    {
      nombre: 'Otros arreglos',
      detalle: 'Cuéntanos qué necesitas y lo coordinamos.',
      icono:
        'M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2.4-.6-.6-2.4z',
    },
  ];
}
