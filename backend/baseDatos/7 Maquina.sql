USE bd_recrea_sys;
DELIMITER //

CREATE TRIGGER after_maquina_distribucion
AFTER UPDATE ON MaquinaRecreativa
FOR EACH ROW
BEGIN
    IF NEW.Etapa = 'Distribucion' AND NEW.Estado = 'Distribuyendose' AND 
       (OLD.Etapa != 'Distribucion' OR OLD.Estado != 'Distribuyendose') THEN
        
        -- Verificar si ya existe un informe para esta máquina
        SET @existe_informe = (SELECT COUNT(*) FROM informe_distribucion 
                              WHERE ID_Maquina = NEW.ID_Maquina);
        
        IF @existe_informe = 0 THEN
            -- Solo crear nuevo informe si no existe uno previo
            INSERT INTO informe_distribucion (
                ID_Distribucion,
                ID_Maquina, 
                ID_Usuario_Comprobador, 
                ID_Comercio,
                estado,
                fecha_alta
            ) VALUES (
                UUID(),
                NEW.ID_Maquina,
                NEW.ID_Tecnico_Comprobador, 
                NEW.ID_Comercio,
                'Distribuyendose',
                CURRENT_TIMESTAMP
            );
        ELSE
            -- Actualizar informe existente
            UPDATE informe_distribucion 
            SET estado = 'Distribuyendose',
                fecha_alta = CURRENT_TIMESTAMP,
                fecha_baja = NULL
            WHERE ID_Maquina = NEW.ID_Maquina;
        END IF;
    END IF;
END //

CREATE TRIGGER after_maquina_estado_change
AFTER UPDATE ON MaquinaRecreativa
FOR EACH ROW
BEGIN
    IF NEW.Estado != OLD.Estado THEN
        -- Actualizar el informe de distribución correspondiente
        IF NEW.Estado IN ('Operativa', 'No operativa', 'Retirada') THEN
            UPDATE informe_distribucion 
            SET estado = NEW.Estado,
                fecha_baja = CASE WHEN NEW.Estado = 'Retirada' THEN NOW() ELSE NULL END
            WHERE ID_Maquina = NEW.ID_Maquina;
        END IF;
    END IF;
END //

-- Procedimiento para registrar una máquina
CREATE PROCEDURE sp_registrar_maquina(
    IN p_nombre VARCHAR(100),
    IN p_tipo VARCHAR(50),
    IN p_id_ensamblador CHAR(36),
    IN p_id_comprobador CHAR(36),
    IN p_id_comercio CHAR(36),
    OUT p_id_maquina CHAR(36)
)
BEGIN
    DECLARE new_uuid CHAR(36);
    SET new_uuid = UUID();
    SET @v_fecha = CURDATE();
    
    -- Registrar nueva máquina con valores iniciales por defecto
    INSERT INTO MaquinaRecreativa (
        ID_Maquina,
        Nombre_Maquina, 
        Tipo, 
        Fecha_Registro, 
        ID_Tecnico_Ensamblador, 
        ID_Tecnico_Comprobador, 
        ID_Comercio,
        Etapa, 
        Estado
    ) VALUES (
        new_uuid,
        p_nombre, 
        p_tipo, 
        @v_fecha,
        p_id_ensamblador, 
        p_id_comprobador, 
        p_id_comercio,
        'Montaje', 
        'Ensamblandose'
    );
    
    SET p_id_maquina = new_uuid;
    
    -- Incrementar máquinas en comercio destino
    UPDATE Comercio 
    SET Cantidad_Maquinas = Cantidad_Maquinas + 1 
    WHERE ID_Comercio = p_id_comercio;
END //

-- Procedimiento para actualizar estado de máquina
CREATE PROCEDURE sp_actualizar_estado_maquina(
    IN p_id_maquina CHAR(36),
    IN p_estado VARCHAR(20),
    IN p_etapa VARCHAR(20)
)
BEGIN
    IF p_etapa IS NULL THEN
        UPDATE MaquinaRecreativa 
        SET Estado = p_estado
        WHERE ID_Maquina = p_id_maquina;
    ELSE
        UPDATE MaquinaRecreativa 
        SET Estado = p_estado, 
            Etapa = p_etapa
        WHERE ID_Maquina = p_id_maquina;
    END IF;
END //

-- Procedimiento para asignar técnico de mantenimiento
CREATE PROCEDURE sp_asignar_tecnico_mantenimiento(
    IN p_id_maquina CHAR(36),
    IN p_id_tecnico CHAR(36)
)
BEGIN
    UPDATE MaquinaRecreativa 
    SET ID_Tecnico_Mantenimiento = p_id_tecnico 
    WHERE ID_Maquina = p_id_maquina;
    
    -- Incrementar actividades del técnico
    UPDATE Tecnico 
    SET Cantidad_Actividades = Cantidad_Actividades + 1 
    WHERE ID_Tecnico = p_id_tecnico;
END //

-- Procedimiento para obtener máquinas por técnico ensamblador
CREATE PROCEDURE sp_obtener_maquinas_por_tecnico_ensamblador(IN p_id_tecnico CHAR(36))
BEGIN
    SELECT m.*, c.Nombre as NombreComercio, c.Direccion as DireccionComercio
    FROM MaquinaRecreativa m 
    JOIN Comercio c ON m.ID_Comercio = c.ID_Comercio 
    WHERE (m.Estado = 'Ensamblandose' OR m.Estado = 'Reensamblandose')
    AND m.ID_Tecnico_Ensamblador = p_id_tecnico;
END //

-- Procedimiento para obtener máquinas por técnico comprobador
CREATE PROCEDURE sp_obtener_maquinas_por_tecnico_comprobador(IN p_id_tecnico CHAR(36))
BEGIN
    SELECT m.*, c.Nombre as NombreComercio, c.Direccion as DireccionComercio
    FROM MaquinaRecreativa m 
    JOIN Comercio c ON m.ID_Comercio = c.ID_Comercio 
    WHERE m.Estado = 'Comprobandose'
    AND m.ID_Tecnico_Comprobador = p_id_tecnico;
END //

-- Procedimiento para obtener máquinas por técnico de mantenimiento
CREATE PROCEDURE sp_obtener_maquinas_por_tecnico_mantenimiento(IN p_id_tecnico CHAR(36))
BEGIN
    SELECT m.*, c.Nombre as NombreComercio, c.Direccion as DireccionComercio
    FROM MaquinaRecreativa m 
    JOIN Comercio c ON m.ID_Comercio = c.ID_Comercio 
    WHERE m.Estado = 'No operativa' 
    AND m.ID_Tecnico_Mantenimiento = p_id_tecnico;
END //

-- Procedimiento para obtener máquinas por estado
CREATE PROCEDURE sp_obtener_maquinas_por_estado(IN p_estado VARCHAR(20))
BEGIN
    SELECT m.*, c.Nombre as NombreComercio, c.Direccion as DireccionComercio
    FROM MaquinaRecreativa m 
    JOIN Comercio c ON m.ID_Comercio = c.ID_Comercio 
    WHERE m.Estado = p_estado;
END //

-- Procedimiento para obtener máquinas por etapa
CREATE PROCEDURE sp_obtener_maquinas_por_etapa(IN p_etapa VARCHAR(20))
BEGIN
    SELECT m.*, c.Nombre as NombreComercio, c.Direccion as DireccionComercio
    FROM MaquinaRecreativa m 
    JOIN Comercio c ON m.ID_Comercio = c.ID_Comercio 
    WHERE m.Etapa = p_etapa;
END //

-- Procedimiento para obtener máquina por ID
CREATE PROCEDURE sp_obtener_maquina_por_id(IN p_id CHAR(36))
BEGIN
    SELECT m.*, c.Nombre as NombreComercio, c.Direccion as DireccionComercio
    FROM MaquinaRecreativa m 
    JOIN Comercio c ON m.ID_Comercio = c.ID_Comercio 
    WHERE m.ID_Maquina = p_id;
END //

-- Procedimiento para obtener máquinas operativas por comercio
CREATE PROCEDURE sp_obtener_maquinas_operativas_por_comercio(IN p_id_comercio CHAR(36))
BEGIN
    SELECT m.*, c.Nombre as NombreComercio, c.Tipo as TipoComercio
    FROM MaquinaRecreativa m
    JOIN Comercio c ON m.ID_Comercio = c.ID_Comercio
    WHERE m.ID_Comercio = p_id_comercio 
    AND m.Estado = 'Operativa'
    AND m.Etapa = 'Recaudacion';
END //

-- Procedimiento para obtener máquinas por etapa y estado
CREATE PROCEDURE sp_obtener_maquinas_por_etapa_y_estado(
    IN p_etapa VARCHAR(20),
    IN p_estado VARCHAR(20)
)
BEGIN
    SELECT m.*, c.Nombre as NombreComercio, c.Direccion as DireccionComercio
    FROM MaquinaRecreativa m
    JOIN Comercio c ON m.ID_Comercio = c.ID_Comercio
    WHERE m.Etapa = p_etapa AND m.Estado = p_estado;
END //

-- Procedimiento para insertar montaje
CREATE PROCEDURE sp_insertar_montaje(
    IN p_id_maquina CHAR(36),
    IN p_id_componente CHAR(36),
    IN p_id_tecnico CHAR(36),
    IN p_detalle TEXT,
    OUT p_id_montaje CHAR(36)
)
BEGIN
    DECLARE new_uuid CHAR(36);
    SET new_uuid = UUID();
    
    INSERT INTO montaje (
        ID_Montaje,
        fecha, 
        ID_Maquina, 
        ID_Componente, 
        ID_Tecnico, 
        detalle
    ) VALUES (
        new_uuid,
        NOW(), 
        p_id_maquina, 
        p_id_componente, 
        p_id_tecnico, 
        p_detalle
    );
    
    SET p_id_montaje = new_uuid;
END //

DELIMITER ;