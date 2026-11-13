-- =====================================================================
-- Ferreservicios Burgos - Esquema de base de datos (Fase 1: Productos)
-- Motor: MySQL 8.x  |  Codificación: utf8mb4
-- =====================================================================

CREATE DATABASE IF NOT EXISTS ferreservicios_burgos
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE ferreservicios_burgos;

-- Se recrean las tablas para poder reinstalar en desarrollo.
-- (No usar DROP en producción.)
DROP TABLE IF EXISTS productos;
DROP TABLE IF EXISTS categorias;

-- ---------------------------------------------------------------------
-- Categorías de productos (tornillería, herramientas, eléctrico, etc.)
-- ---------------------------------------------------------------------
CREATE TABLE categorias (
  id           INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  nombre       VARCHAR(80)   NOT NULL,
  slug         VARCHAR(100)  NOT NULL,
  descripcion  VARCHAR(255)  NULL,
  activa       TINYINT(1)    NOT NULL DEFAULT 1,
  creada_en    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_categorias_nombre (nombre),
  UNIQUE KEY uq_categorias_slug (slug)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Productos del catálogo / inventario
--   precio    : pesos colombianos (COP)
--   stock     : unidades disponibles; stock_minimo sirve para alertas
--   destacado : marca los "productos con mayor demanda" del sitio web
--   activo    : permite ocultar un producto sin borrarlo
-- ---------------------------------------------------------------------
CREATE TABLE productos (
  id             INT UNSIGNED   NOT NULL AUTO_INCREMENT,
  categoria_id   INT UNSIGNED   NOT NULL,
  sku            VARCHAR(40)    NOT NULL,
  nombre         VARCHAR(150)   NOT NULL,
  descripcion    TEXT           NULL,
  marca          VARCHAR(80)    NULL,
  unidad         VARCHAR(20)    NOT NULL DEFAULT 'unidad',
  precio         DECIMAL(12,2)  NOT NULL,
  stock          INT UNSIGNED   NOT NULL DEFAULT 0,
  stock_minimo   INT UNSIGNED   NOT NULL DEFAULT 0,
  imagen_url     VARCHAR(255)   NULL,
  destacado      TINYINT(1)     NOT NULL DEFAULT 0,
  activo         TINYINT(1)     NOT NULL DEFAULT 1,
  creado_en      TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP
                                ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_productos_sku (sku),
  KEY idx_productos_categoria (categoria_id),
  KEY idx_productos_nombre (nombre),
  KEY idx_productos_listado (activo, destacado),
  CONSTRAINT fk_productos_categoria
    FOREIGN KEY (categoria_id) REFERENCES categorias (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT chk_productos_precio CHECK (precio >= 0)
) ENGINE=InnoDB;