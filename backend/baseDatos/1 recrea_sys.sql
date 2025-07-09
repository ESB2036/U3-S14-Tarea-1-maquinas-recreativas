CREATE DATABASE IF NOT EXISTS bd_recrea_sys;
USE bd_recrea_sys;
-- DROP DATABASE bd_recrea_sys;
-- Tabla: usuario (con UUID)
CREATE TABLE usuario (
    ID_Usuario CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    ci VARCHAR(100) NOT NULL UNIQUE,
    nombre VARCHAR(50) NOT NULL,
    apellido VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    tipo ENUM('Administrador', 'Logistica', 'Tecnico', 'Contabilidad', 'Usuario') NOT NULL,
    usuario_asignado VARCHAR(25) NOT NULL DEFAULT 'Aun no tiene',
    contrasena VARCHAR(255) NOT NULL DEFAULT 'Aun no tiene',
    estado ENUM('Pendiente de asignacion', 'Activo', 'Inhabilitado') DEFAULT 'Pendiente de asignacion' NOT NULL
);

-- Tabla: inicio_sesion (con UUID)
CREATE TABLE inicio_sesion (
    ID_Inicio_Sesion CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    ID_Usuario CHAR(36) NOT NULL,
    usuario_asignado VARCHAR(100) NOT NULL,
    contrasena VARCHAR(255) NOT NULL,
    fecha_inicio DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_ultima_sesion DATETIME NULL,
    FOREIGN KEY (ID_Usuario) REFERENCES usuario(ID_Usuario)
);

-- Tabla para técnicos (con UUID)
CREATE TABLE Tecnico(
    ID_Tecnico CHAR(36) PRIMARY KEY,
    Especialidad ENUM('Ensamblador', 'Comprobador', 'Mantenimiento') NOT NULL,
    Cantidad_Actividades INT DEFAULT 0 NOT NULL,
    FOREIGN KEY (ID_Tecnico) REFERENCES usuario(ID_Usuario)
);

-- Tabla para logística (con UUID)
CREATE TABLE Logistica(
    ID_Logistica CHAR(36) PRIMARY KEY,
    FOREIGN KEY (ID_Logistica) REFERENCES usuario(ID_Usuario)
);

-- HISTORIAL DE ACTIVIDADES (con UUID)
CREATE TABLE historial_actividades (
    ID_Historial_Actividades CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    ID_Usuario CHAR(36) NOT NULL,
    descripcion TEXT DEFAULT 'Estuvo en su main',
    fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ID_Usuario) REFERENCES usuario(ID_Usuario)
);

-- Tabla de para comercios (con UUID)
CREATE TABLE Comercio (
    ID_Comercio CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    Nombre VARCHAR(100) NOT NULL UNIQUE,
    Tipo ENUM('Minorista', 'Mayorista') NOT NULL,
    Direccion TEXT NOT NULL,
    Telefono VARCHAR(15) NOT NULL UNIQUE,
    Cantidad_Maquinas INT DEFAULT 0 NOT NULL,
    Fecha_Registro DATE NOT NULL
);

-- Tabla para máquinas recreativas (con UUID)
CREATE TABLE MaquinaRecreativa (
    ID_Maquina CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    Nombre_Maquina VARCHAR(100) NOT NULL,
    Tipo VARCHAR(50) NOT NULL,
    Etapa ENUM('Montaje', 'Distribucion', 'Recaudacion') DEFAULT 'Montaje' NOT NULL,
    Estado ENUM('Ensamblandose', 'Comprobandose', 'Reensamblandose', 'Distribuyendose', 'Operativa', 'No operativa', 'Retirada') DEFAULT 'Ensamblándose' NOT NULL,
    Fecha_Registro DATE NOT NULL,
    ID_Tecnico_Ensamblador CHAR(36) NOT NULL,
    ID_Tecnico_Comprobador CHAR(36) NOT NULL,
    ID_Comercio CHAR(36) NOT NULL,
    ID_Tecnico_Mantenimiento CHAR(36),
    FOREIGN KEY (ID_Tecnico_Ensamblador) REFERENCES Tecnico(ID_Tecnico),
    FOREIGN KEY (ID_Tecnico_Comprobador) REFERENCES Tecnico(ID_Tecnico),
    FOREIGN KEY (ID_Comercio) REFERENCES Comercio(ID_Comercio),
    FOREIGN KEY (ID_Tecnico_Mantenimiento) REFERENCES Tecnico(ID_Tecnico)
);

-- Tabla para notificaciones (con UUID)
CREATE TABLE NotificacionMaquinaRecreativa (
    ID_Notificacion CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    ID_Remitente CHAR(36) NOT NULL,
    ID_Destinatario CHAR(36) NOT NULL,
    ID_Maquina CHAR(36) NOT NULL,
    Tipo ENUM(
        'Nuevo montaje',
        'Comprobar maquina recreativa',
        'Reensamblar maquina recreativa',
        'Distribuir maquina recreativa',
        'Dar mantenimiento a maquina recreativa',
        'Maquina recreativa retirada',
        'Maquina recreativa reparada'
    ) NOT NULL,
    Mensaje TEXT,
    Fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Estado ENUM('Leido', 'No leido') DEFAULT 'No leido' NOT NULL,
    FOREIGN KEY (ID_Remitente) REFERENCES usuario(ID_Usuario),
    FOREIGN KEY (ID_Destinatario) REFERENCES usuario(ID_Usuario),
    FOREIGN KEY (ID_Maquina) REFERENCES MaquinaRecreativa(ID_Maquina)
);

CREATE INDEX idx_notificacion_maquina_estado ON NotificacionMaquinaRecreativa(Estado);

-- Tabla: componente (con UUID)
CREATE TABLE componente (
    ID_Componente CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    tipo ENUM('Ensamblador', 'Comprobador', 'Mantenimiento', 'Logistico') NOT NULL,
    nombre VARCHAR(50) NOT NULL,
    precio DECIMAL(10,2) DEFAULT 10.00
);

-- Tabla: componente_usuario (con UUID)
CREATE TABLE componente_usuario (
    ID_Registro CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    ID_Componente CHAR(36) NOT NULL,
    ID_Usuario CHAR(36) NOT NULL,
    fecha_asignacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_liberacion DATETIME NULL,
    ID_Maquina CHAR(36) NULL,
    FOREIGN KEY (ID_Componente) REFERENCES componente(ID_Componente),
    FOREIGN KEY (ID_Usuario) REFERENCES usuario(ID_Usuario),
    FOREIGN KEY (ID_Maquina) REFERENCES MaquinaRecreativa(ID_Maquina)
);

-- Tabla: reporte (con UUID)
CREATE TABLE reporte (
    ID_Reporte CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    ID_Usuario_Emisor CHAR(36) NOT NULL,
    ID_Usuario_Destinatario CHAR(36),
    fecha_hora DATETIME NOT NULL,
    descripcion TEXT NOT NULL,
    estado VARCHAR(15) NOT NULL,
    FOREIGN KEY (ID_Usuario_Emisor) REFERENCES usuario(ID_Usuario),
    FOREIGN KEY (ID_Usuario_Destinatario) REFERENCES usuario(ID_Usuario)
);

-- Tabla: notificaciones (con UUID)
CREATE TABLE notificaciones (
    ID_Notificaciones CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    ID_Reporte CHAR(36) NOT NULL,
    ID_Usuario CHAR(36) NOT NULL,
    fecha_hora DATETIME NOT NULL,
    mensaje TEXT NOT NULL,
    leida BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (ID_Reporte) REFERENCES reporte(ID_Reporte),
    FOREIGN KEY (ID_Usuario) REFERENCES usuario(ID_Usuario)
);

-- Tabla: comentario (con UUID)
CREATE TABLE comentario (
    ID_Comentario CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    ID_Reporte CHAR(36) NOT NULL,
    ID_Usuario_Emisor CHAR(36) NOT NULL, 
    fecha_hora DATETIME NOT NULL,
    comentario TEXT NOT NULL,
    FOREIGN KEY (ID_Reporte) REFERENCES reporte(ID_Reporte),
    FOREIGN KEY (ID_Usuario_Emisor) REFERENCES usuario(ID_Usuario)
);

-- Tabla: recaudaciones (con UUID)
CREATE TABLE recaudaciones (
   ID_Recaudacion CHAR(36) PRIMARY KEY DEFAULT (UUID()),
   Tipo_Comercio ENUM('Minorista', 'Mayorista') NOT NULL, 
   ID_Maquina CHAR(36) NOT NULL,
   ID_Usuario CHAR(36) NOT NULL,
   Monto_Total DECIMAL(10,2) NOT NULL,
   Monto_Empresa DECIMAL(10,2),
   Monto_Comercio DECIMAL(10,2),
   Porcentaje_Comercio DECIMAL(5,2) DEFAULT 0,
    fecha DATETIME NOT NULL,
    detalle TEXT NOT NULL,
    FOREIGN KEY (ID_Usuario) REFERENCES usuario(ID_Usuario),
    FOREIGN KEY (ID_Maquina) REFERENCES MaquinaRecreativa(ID_Maquina)
);

-- Tabla: informe (con UUID)
CREATE TABLE IF NOT EXISTS informes_recaudacion (
  ID_Informe CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  ID_Recaudacion CHAR(36) NOT NULL,
  CI_Usuario VARCHAR(100) NOT NULL,
  Nombre_Maquina VARCHAR(100) NOT NULL,
  ID_Comercio CHAR(36) NOT NULL,
  Nombre_Comercio VARCHAR(100) NOT NULL,
  Direccion_Comercio TEXT NOT NULL,
  Telefono_Comercio VARCHAR(15) NOT NULL,
  Pago_Ensamblador DECIMAL(10,2) DEFAULT 400.00,
  Pago_Comprobador DECIMAL(10,2) DEFAULT 400.00,
  Pago_Mantenimiento DECIMAL(10,2) DEFAULT 400.00,
  empresa_nombre VARCHAR(100) DEFAULT 'recreasys.s.a',
  empresa_descripcion VARCHAR(255) DEFAULT 'Una empresa encargada en el ciclo de vida de las maquinas recreativas',
  FOREIGN KEY (ID_Recaudacion) REFERENCES recaudaciones(ID_Recaudacion),
  FOREIGN KEY (ID_Comercio) REFERENCES Comercio(ID_Comercio)
);

-- Tabla: informe_detalle (con UUID)
CREATE TABLE IF NOT EXISTS informe_detalle (
  ID_Informe_Detalle CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  ID_Informe CHAR(36) NOT NULL,
  ID_Componente CHAR(36) NOT NULL,
  FOREIGN KEY (ID_Informe) REFERENCES informes_recaudacion(ID_Informe),
  FOREIGN KEY (ID_Componente) REFERENCES componente(ID_Componente)
);

-- Tabla: distribuciones (con UUID)
CREATE TABLE IF NOT EXISTS informe_distribucion (
  ID_Distribucion CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  ID_Maquina CHAR(36) NOT NULL,
  ID_Usuario_Comprobador CHAR(36) NOT NULL,
  ID_Comercio CHAR(36) NOT NULL,
  fecha_alta DATETIME DEFAULT CURRENT_TIMESTAMP,
  fecha_baja DATETIME NULL,
  estado ENUM('Operativa','Retirada','No operativa') DEFAULT 'Operativa',
  FOREIGN KEY (ID_Maquina) REFERENCES MaquinaRecreativa(ID_Maquina),
  FOREIGN KEY (ID_Usuario_Comprobador) REFERENCES usuario(ID_Usuario),
  FOREIGN KEY (ID_Comercio) REFERENCES Comercio(ID_Comercio)
);

-- Tabla: montajes (con UUID)
CREATE TABLE montaje (
    ID_Montaje CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    fecha DATETIME NOT NULL,
    ID_Maquina CHAR(36) NOT NULL, 
    ID_Componente CHAR(36),
    ID_Tecnico CHAR(36),
    detalle TEXT NOT NULL,
    FOREIGN KEY (ID_Maquina) REFERENCES MaquinaRecreativa(ID_Maquina),
    FOREIGN KEY (ID_Componente) REFERENCES componente(ID_Componente),
    FOREIGN KEY (ID_Tecnico) REFERENCES Tecnico(ID_Tecnico)
);