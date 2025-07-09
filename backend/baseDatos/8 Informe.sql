USE bd_recrea_sys;
DELIMITER //

-- Procedimiento para registrar recaudación
CREATE PROCEDURE sp_registrar_recaudacion(
    IN p_tipo_comercio ENUM('Minorista', 'Mayorista'),
    IN p_id_maquina CHAR(36),
    IN p_id_usuario CHAR(36),
    IN p_monto_total DECIMAL(10,2),
    IN p_monto_empresa DECIMAL(10,2),
    IN p_monto_comercio DECIMAL(10,2),
    IN p_fecha DATETIME,
    IN p_detalle TEXT,
    IN p_porcentaje_comercio DECIMAL(5,2),
    OUT p_id_recaudacion CHAR(36)
)
BEGIN
    DECLARE new_uuid CHAR(36);
    SET new_uuid = UUID();
    
    INSERT INTO recaudaciones (
        ID_Recaudacion,
        Tipo_Comercio, 
        ID_Maquina, 
        ID_Usuario, 
        Monto_Total, 
        Monto_Empresa, 
        Monto_Comercio,
        fecha, 
        detalle, 
        Porcentaje_Comercio
    ) VALUES (
        new_uuid,
        p_tipo_comercio,
        p_id_maquina,
        p_id_usuario,
        p_monto_total,
        p_monto_empresa,
        p_monto_comercio,
        p_fecha,
        IFNULL(p_detalle, ''),
        p_porcentaje_comercio
    );
    
    SET p_id_recaudacion = new_uuid;
END //

-- Procedimiento para obtener recaudaciones con filtros
CREATE PROCEDURE sp_obtener_recaudaciones(
    IN p_fecha_inicio DATE,
    IN p_fecha_fin DATE,
    IN p_id_maquina CHAR(36),
    IN p_tipo_comercio VARCHAR(20)
)
BEGIN
    SELECT r.*, m.Nombre_Maquina, c.Nombre as Nombre_Comercio, c.Tipo as Tipo_Comercio,
           u.nombre as UsuarioNombre, u.apellido as UsuarioApellido
    FROM recaudaciones r
    JOIN MaquinaRecreativa m ON r.ID_Maquina = m.ID_Maquina
    JOIN Comercio c ON m.ID_Comercio = c.ID_Comercio
    JOIN usuario u ON r.ID_Usuario = u.ID_Usuario
    WHERE (p_fecha_inicio IS NULL OR r.fecha >= p_fecha_inicio)
    AND (p_fecha_fin IS NULL OR r.fecha <= p_fecha_fin)
    AND (p_id_maquina IS NULL OR r.ID_Maquina = p_id_maquina)
    AND (p_tipo_comercio IS NULL OR c.Tipo = p_tipo_comercio)
    ORDER BY r.fecha DESC;
END //

-- Procedimiento para obtener resumen de recaudaciones limitado
CREATE PROCEDURE sp_obtener_resumen_recaudaciones_limitado(IN p_limit INT)
BEGIN
    SELECT 
        c.Tipo as Tipo_Comercio,
        COUNT(r.ID_Recaudacion) as TotalRecaudaciones,
        SUM(r.Monto_Total) as TotalRecaudado,
        SUM(r.Monto_Empresa) as TotalEmpresa,
        SUM(r.Monto_Comercio) as TotalComercio
    FROM recaudaciones r
    JOIN MaquinaRecreativa m ON r.ID_Maquina = m.ID_Maquina
    JOIN Comercio c ON m.ID_Comercio = c.ID_Comercio
    GROUP BY c.Tipo
    ORDER BY TotalRecaudado DESC
    LIMIT p_limit;
END //

-- Procedimiento para actualizar recaudación
CREATE PROCEDURE sp_actualizar_recaudacion(
    IN p_ID_Recaudacion CHAR(36),
    IN p_ID_Maquina CHAR(36),
    IN p_Tipo_Comercio VARCHAR(20),
    IN p_Monto_Total DECIMAL(10,2),
    IN p_Monto_Empresa DECIMAL(10,2),
    IN p_Monto_Comercio DECIMAL(10,2),
    IN p_fecha DATETIME,
    IN p_detalle TEXT,
    IN p_Porcentaje_Comercio DECIMAL(5,2)
)
BEGIN
    DECLARE recaudacion_existe INT;
    DECLARE maquina_existe INT;
    DECLARE tipo_comercio_valido ENUM('Minorista', 'Mayorista');
    DECLARE monto_empresa_calc DECIMAL(10,2);
    DECLARE monto_comercio_calc DECIMAL(10,2);

    -- Verificar que la recaudación existe
    SELECT COUNT(*) INTO recaudacion_existe 
    FROM recaudaciones 
    WHERE ID_Recaudacion = p_ID_Recaudacion;

    IF recaudacion_existe = 0 THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'La recaudación no existe';
    END IF;

    -- Verificar que la máquina existe
    SELECT COUNT(*) INTO maquina_existe 
    FROM MaquinaRecreativa 
    WHERE ID_Maquina = p_ID_Maquina;

    IF maquina_existe = 0 THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'La máquina asociada no existe';
    END IF;

    -- Validar que el tipo de comercio sea válido
    IF p_Tipo_Comercio NOT IN ('Minorista', 'Mayorista') THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Tipo de comercio no válido';
    END IF;

    -- Validar montos
    IF p_Monto_Total <= 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'El monto total debe ser positivo';
    END IF;

    -- Calcular montos según tipo de comercio
    IF p_Tipo_Comercio = 'Mayorista' THEN
        -- Para mayoristas, validar porcentaje
        IF p_Porcentaje_Comercio <= 0 OR p_Porcentaje_Comercio > 100 THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Porcentaje para comercio debe estar entre 0 y 100';
        END IF;
        
        SET monto_comercio_calc = p_Monto_Total * (p_Porcentaje_Comercio / 100);
        SET monto_empresa_calc = p_Monto_Total - monto_comercio_calc;
    ELSE
        -- Para minoristas, monto comercio es 0
        SET monto_comercio_calc = 0;
        SET monto_empresa_calc = p_Monto_Total;
        SET p_Porcentaje_Comercio = 0;
    END IF;

    -- Validar suma de montos
    IF ABS((monto_empresa_calc + monto_comercio_calc) - p_Monto_Total) > 0.01 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'La suma de montos no coincide con el total';
    END IF;

    -- Actualizar los datos
    UPDATE recaudaciones SET 
        ID_Maquina = p_ID_Maquina,
        Tipo_Comercio = p_Tipo_Comercio,
        Monto_Total = p_Monto_Total,
        Monto_Empresa = monto_empresa_calc,
        Monto_Comercio = monto_comercio_calc,
        fecha = p_fecha,
        detalle = IFNULL(p_detalle, ''),
        Porcentaje_Comercio = p_Porcentaje_Comercio
    WHERE ID_Recaudacion = p_ID_Recaudacion;

    -- Devolver el número de filas afectadas
    SELECT ROW_COUNT() AS filas_afectadas;
END //

-- Procedimiento para eliminar recaudación
CREATE PROCEDURE sp_eliminar_recaudacion(IN p_id_recaudacion CHAR(36))
BEGIN
    DELETE FROM recaudaciones WHERE ID_Recaudacion = p_id_recaudacion;
END //

-- Procedimiento para guardar informe principal
CREATE PROCEDURE sp_guardar_informe_principal(
    IN p_id_recaudacion CHAR(36),
    IN p_ci_usuario VARCHAR(100),
    IN p_nombre_maquina VARCHAR(100),
    IN p_id_comercio CHAR(36),
    IN p_nombre_comercio VARCHAR(100),
    IN p_direccion_comercio TEXT,
    IN p_telefono_comercio VARCHAR(15),
    IN p_pago_ensamblador DECIMAL(10,2),
    IN p_pago_comprobador DECIMAL(10,2),
    IN p_pago_mantenimiento DECIMAL(10,2),
    IN p_empresa_nombre VARCHAR(100),
    IN p_empresa_descripcion VARCHAR(255),
    OUT p_id_informe CHAR(36)
)
BEGIN
    DECLARE new_uuid CHAR(36);
    SET new_uuid = UUID();
    
    INSERT INTO informes_recaudacion (
        ID_Informe,
        ID_Recaudacion, 
        CI_Usuario, 
        Nombre_Maquina, 
        ID_Comercio,
        Nombre_Comercio, 
        Direccion_Comercio, 
        Telefono_Comercio,
        Pago_Ensamblador, 
        Pago_Comprobador, 
        Pago_Mantenimiento,
        empresa_nombre, 
        empresa_descripcion
    ) VALUES (
        new_uuid,
        p_id_recaudacion,
        p_ci_usuario,
        p_nombre_maquina,
        p_id_comercio,
        p_nombre_comercio,
        p_direccion_comercio,
        p_telefono_comercio,
        p_pago_ensamblador,
        p_pago_comprobador,
        p_pago_mantenimiento,
        p_empresa_nombre,
        p_empresa_descripcion
    );
    
    SET p_id_informe = new_uuid;
END //

-- Procedimiento para guardar detalle de componente
CREATE PROCEDURE sp_guardar_detalle_componente(
    IN p_id_informe CHAR(36),
    IN p_id_componente CHAR(36)
)
BEGIN
    DECLARE new_uuid CHAR(36);
    SET new_uuid = UUID();
    
    INSERT INTO informe_detalle (
        ID_Informe_Detalle,
        ID_Informe, 
        ID_Componente
    ) VALUES (
        new_uuid,
        p_id_informe, 
        p_id_componente
    );
END //

-- Procedimiento para obtener informe principal
CREATE PROCEDURE sp_obtener_informe_principal(IN p_id_recaudacion CHAR(36))
BEGIN
    SELECT * FROM informes_recaudacion 
    WHERE ID_Recaudacion = p_id_recaudacion 
    LIMIT 1;
END //

-- Procedimiento para obtener componentes de informe
CREATE PROCEDURE sp_obtener_componentes_informe(IN p_id_informe CHAR(36))
BEGIN
    SELECT c.ID_Componente, c.nombre, c.tipo, c.precio
    FROM informe_detalle id
    JOIN componente c ON id.ID_Componente = c.ID_Componente
    WHERE id.ID_Informe = p_id_informe;
END //
CREATE PROCEDURE sp_obtener_recaudacion(IN p_id_recaudacion CHAR(36))
BEGIN
    SELECT 
        r.*, 
        m.Nombre_Maquina, 
        c.Nombre as Nombre_Comercio, 
        c.Tipo as Tipo_Comercio,
        u.nombre as UsuarioNombre, 
        u.apellido as UsuarioApellido
    FROM recaudaciones r
    JOIN MaquinaRecreativa m ON r.ID_Maquina = m.ID_Maquina
    JOIN Comercio c ON m.ID_Comercio = c.ID_Comercio
    JOIN usuario u ON r.ID_Usuario = u.ID_Usuario
    WHERE r.ID_Recaudacion = p_id_recaudacion;
END //
DELIMITER ;