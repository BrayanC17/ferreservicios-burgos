-- =====================================================================
-- Tablas de cotizaciones, servicios y usuarios (seguras de re-ejecutar).
-- Ejecutar DESPUÉS de schema.sql.  Si ya las tienes, no pasa nada.
-- =====================================================================
USE ferreservicios_burgos;

CREATE TABLE IF NOT EXISTS usuarios (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nombre        VARCHAR(100) NOT NULL,
  correo        VARCHAR(150) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  rol           VARCHAR(20)  NOT NULL DEFAULT 'admin',
  activo        TINYINT(1)   NOT NULL DEFAULT 1,
  creado_en     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_usuarios_correo (correo)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS cotizaciones (
  id            INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  codigo        VARCHAR(20)   NULL,
  nombre        VARCHAR(100)  NOT NULL,
  celular       VARCHAR(15)   NOT NULL,
  dia_recogida  DATE          NOT NULL,
  medio_pago    VARCHAR(20)   NOT NULL,
  observaciones VARCHAR(500)  NULL,
  total         DECIMAL(12,2) NOT NULL DEFAULT 0,
  estado        ENUM('pendiente','confirmada','entregada','cancelada') NOT NULL DEFAULT 'pendiente',
  creada_en     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_cotizaciones_codigo (codigo),
  KEY idx_cotizaciones_estado (estado)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS cotizacion_items (
  id              INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  cotizacion_id   INT UNSIGNED  NOT NULL,
  producto_id     INT UNSIGNED  NOT NULL,
  nombre          VARCHAR(150)  NOT NULL,
  precio_unitario DECIMAL(12,2) NOT NULL,
  cantidad        INT UNSIGNED  NOT NULL,
  PRIMARY KEY (id),
  KEY idx_items_cotizacion (cotizacion_id),
  CONSTRAINT fk_items_cotizacion FOREIGN KEY (cotizacion_id) REFERENCES cotizaciones (id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS solicitudes_servicio (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  codigo        VARCHAR(20)  NULL,
  nombre        VARCHAR(100) NOT NULL,
  celular       VARCHAR(15)  NOT NULL,
  tipo_servicio VARCHAR(40)  NOT NULL,
  fecha_visita  DATE         NOT NULL,
  direccion     VARCHAR(200) NOT NULL,
  barrio        VARCHAR(100) NULL,
  descripcion   TEXT         NOT NULL,
  estado        ENUM('pendiente','confirmada','realizada','cancelada') NOT NULL DEFAULT 'pendiente',
  creada_en     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_solicitudes_codigo (codigo),
  KEY idx_solicitudes_estado (estado)
) ENGINE=InnoDB;
