# Ferreservicios Burgos 22

Sitio web + panel administrativo de la ferretería (Cra. 93 #22-11, Fontibón, Bogotá).
Angular · Node.js/Express · MySQL.

## Módulos
- **Sitio público:** inicio, catálogo, cotización, solicitud de servicios a domicilio.
- **Panel admin (`/admin/login`):** Resumen, Solicitudes, **Inventario**, **Pagos con comprobante** y **Reportes** (mensual, CSV y PDF).

## Puesta en marcha (desarrollo)
1. **Base de datos** (MySQL 8): importa en orden `database/schema.sql`, `schema_extra.sql` y `schema_pagos.sql` (ver `database/LEEME.md`).
2. **Backend:** `cd backend` → copia `.env.example` a `.env` y ajusta datos → `npm install` → `node scripts/crear-admin.js "Nombre" correo@ejemplo.com "ClaveSegura1"` → `npm run dev`. (API en http://localhost:3000, prueba `/api/health`).
3. **Frontend:** `cd frontend` → `npm install` → `npx ng serve` (http://localhost:4200).
   En Windows PowerShell usa `npm.cmd` / `npx.cmd` si los scripts están bloqueados.

## Producción (un solo servicio)
`npm run build` en la raíz compila Angular; `npm start` levanta Express, que sirve el sitio y la API. Variables: las del `.env.example` (+ `DB_SSL=true` si la BD es remota, `NODE_ENV=production`).

## Seguridad
- Nunca subas `.env` al repositorio. Cambia `JWT_SECRET` y las contraseñas antes de publicar.
- Los soportes de pago se guardan en `backend/private/comprobantes` y solo se ven con sesión de administrador.
- Imágenes: solo PNG/JPG/WEBP (se valida el contenido real), máx. 3 MB.
