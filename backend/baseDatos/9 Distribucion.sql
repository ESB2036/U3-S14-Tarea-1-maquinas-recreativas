USE bd_recrea_sys;
DELIMITER //

-- Procedimiento para actualizar informe de distribución (UUID)
CREATE PROCEDURE sp_actualizar_informe_distribucion(
    IN p_id_maquina CHAR(36),
    IN p_estado VARCHAR(20)
)
BEGIN
    IF EXISTS (
        SELECT ID_Distribucion FROM informe_distribucion 
        WHERE ID_Maquina = p_id_maquina
    ) THEN
        UPDATE informe_distribucion 
        SET estado = p_estado,
            fecha_baja = CASE 
                WHEN p_estado = 'Operativa' THEN NULL 
                ELSE COALESCE(fecha_baja, CURRENT_TIMESTAMP) 
            END
        WHERE ID_Maquina = p_id_maquina;
    ELSE
        INSERT INTO informe_distribucion (
            ID_Maquina, estado, fecha_alta, fecha_baja
        ) VALUES (
            p_id_maquina, 
            p_estado, 
            CURRENT_TIMESTAMP, 
            CASE WHEN p_estado = 'Operativa' THEN NULL ELSE NULL END
        );
    END IF;
END //

-- Procedimiento para crear informe de distribución (UUID)
CREATE PROCEDURE sp_crear_informe_distribucion(
    IN p_id_maquina CHAR(36),
    IN p_id_usuario CHAR(36),
    IN p_id_comercio CHAR(36)
)
BEGIN
    IF EXISTS (
        SELECT ID_Distribucion FROM informe_distribucion 
        WHERE ID_Maquina = p_id_maquina
    ) THEN
        UPDATE informe_distribucion 
        SET ID_Usuario_Comprobador = p_id_usuario, 
            ID_Comercio = p_id_comercio,
            estado = 'Distribuyendose',
            fecha_alta = CURRENT_TIMESTAMP,
            fecha_baja = NULL
        WHERE ID_Maquina = p_id_maquina;
    ELSE
        INSERT INTO informe_distribucion (
            ID_Maquina, ID_Usuario_Comprobador, ID_Comercio, 
            estado, fecha_alta
        ) VALUES (p_id_maquina, p_id_usuario, p_id_comercio, 'Distribuyendose', CURRENT_TIMESTAMP);
    END IF;
END //

-- Procedimiento para obtener informes de distribución con filtros (UUID)
CREATE PROCEDURE sp_obtener_informes_distribucion(
    IN p_estado VARCHAR(20),
    IN p_id_comercio CHAR(36),
    IN p_fecha_inicio DATE,
    IN p_fecha_fin DATE,
    IN p_id_maquina CHAR(36)
)
BEGIN
    SELECT 
        d.ID_Distribucion,
        d.ID_Maquina,
        d.ID_Usuario_Comprobador,
        d.ID_Comercio,
        d.fecha_alta,
        d.fecha_baja,
        d.estado,
        m.Nombre_Maquina,
        CONCAT(u.nombre, ' ', u.apellido) AS Nombre_Tecnico,
        c.Nombre AS Nombre_Comercio,
        c.Direccion AS Direccion_Comercio,
        c.Telefono AS Telefono_Comercio,
        c.Tipo AS Tipo_Comercio
    FROM informe_distribucion d
    JOIN MaquinaRecreativa m ON d.ID_Maquina = m.ID_Maquina
    JOIN usuario u ON d.ID_Usuario_Comprobador = u.ID_Usuario
    JOIN Comercio c ON d.ID_Comercio = c.ID_Comercio
    WHERE 1=1
    AND (p_estado IS NULL OR d.estado = p_estado)
    AND (p_id_comercio IS NULL OR d.ID_Comercio = p_id_comercio)
    AND (p_fecha_inicio IS NULL OR d.fecha_alta >= p_fecha_inicio)
    AND (p_fecha_fin IS NULL OR d.fecha_alta <= p_fecha_fin)
    AND (p_id_maquina IS NULL OR d.ID_Maquina = p_id_maquina)
    ORDER BY d.fecha_alta DESC;
END //

DELIMITER ;