USE bd_recrea_sys;
DELIMITER //

CREATE TRIGGER after_montaje_insert
AFTER INSERT ON montaje
FOR EACH ROW
BEGIN
    DECLARE v_placa_asignada BOOLEAN DEFAULT FALSE;
    DECLARE v_id_placa CHAR(36);

    -- Verificar si ya existe una placa asignada a esta máquina
    SELECT EXISTS(
        SELECT 1 FROM montaje m
        JOIN componente c ON m.ID_Componente = c.ID_Componente
        WHERE m.ID_Maquina = NEW.ID_Maquina
        AND c.nombre LIKE 'PL%'
    ) INTO v_placa_asignada;

    -- Obtener ID de la placa si existe
    IF v_placa_asignada THEN
        SELECT m.ID_Componente INTO v_id_placa
        FROM montaje m
        JOIN componente c ON m.ID_Componente = c.ID_Componente
        WHERE m.ID_Maquina = NEW.ID_Maquina
        AND c.nombre LIKE 'PL%'
        LIMIT 1;

        -- Actualizar registro de la placa si no está aún asociada a una máquina
        UPDATE componente_usuario
        SET ID_Maquina = NEW.ID_Maquina
        WHERE ID_Componente = v_id_placa
        AND ID_Maquina IS NULL
        AND fecha_liberacion IS NULL;

        -- Registrar en historial
        INSERT INTO historial_actividades (ID_Usuario, descripcion)
        VALUES (
            NEW.ID_Tecnico,
            CONCAT('Placa ID ', v_id_placa, ' asignada a máquina ID ', NEW.ID_Maquina)
        );
    END IF;
END //

CREATE PROCEDURE sp_Generar_Placa_Maquina_Recreativa(
    IN p_id_tecnico CHAR(36),
    OUT p_numero_placa VARCHAR(20),
    OUT p_id_componente CHAR(36)
)
BEGIN
    DECLARE v_prefijo VARCHAR(3);
    DECLARE v_secuencia INT;
    DECLARE new_uuid CHAR(36);
    
    -- Obtener prefijo basado en el año actual
    SET v_prefijo = CONCAT('PL', YEAR(CURDATE()) % 100);
    
    -- Obtener siguiente número de secuencia
    SELECT IFNULL(MAX(CAST(SUBSTRING(nombre, 5) AS UNSIGNED)), 0) + 1 INTO v_secuencia
    FROM componente
    WHERE nombre LIKE CONCAT(v_prefijo, '%') AND tipo = 'Logistico';
    
    -- Formar número de placa (ej: PL23001)
    SET p_numero_placa = CONCAT(v_prefijo, LPAD(v_secuencia, 3, '0'));
    
    -- Generar UUID para el nuevo componente
    SET new_uuid = UUID();
    
    -- Insertar el componente placa
    INSERT INTO componente (ID_Componente, tipo, nombre, precio)
    VALUES (new_uuid, 'Logistico', p_numero_placa, 120.00);
    
    SET p_id_componente = new_uuid;
    
    -- Registrar uso del componente por el técnico
    INSERT INTO componente_usuario (ID_Componente, ID_Usuario, fecha_asignacion)
    VALUES (p_id_componente, p_id_tecnico, NOW());
END //

CREATE PROCEDURE sp_obtener_componentes_disponibles(IN p_tipo VARCHAR(20))
BEGIN
    SELECT 
        c.ID_Componente,
        c.tipo,
        c.nombre,
        c.precio,
        (SELECT COUNT(*) 
         FROM componente_usuario cu 
         WHERE cu.ID_Componente = c.ID_Componente 
         AND cu.fecha_liberacion IS NULL) AS en_uso
    FROM componente c
    WHERE p_tipo IS NULL OR c.tipo = p_tipo;
END //

CREATE PROCEDURE sp_Asignar_Carcasa_Maquina(
    IN p_id_tecnico CHAR(36),
    IN p_id_carcasa CHAR(36),
    OUT p_resultado VARCHAR(100),
    OUT p_exito BOOLEAN
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        SET p_exito = FALSE;
        SET p_resultado = 'Error en la transacción';
        ROLLBACK;
    END;
    
    START TRANSACTION;
    
    -- Verificar que la carcasa existe y es de tipo Logístico
    IF NOT EXISTS (
        SELECT 1 FROM componente 
        WHERE ID_Componente = p_id_carcasa 
        AND tipo = 'Logistico' 
        AND nombre LIKE 'Carcasa%'
    ) THEN
        SET p_exito = FALSE;
        SET p_resultado = 'La carcasa seleccionada no existe o no es válida';
        ROLLBACK;
    ELSE
        -- Registrar en componente_usuario para seguimiento (sin ID_Maquina aún)
        INSERT INTO componente_usuario (ID_Componente, ID_Usuario, fecha_asignacion)
        VALUES (p_id_carcasa, p_id_tecnico, NOW());
        
        SET p_exito = TRUE;
        SET p_resultado = 'Carcasa asignada correctamente';
        COMMIT;
    END IF;
END //

CREATE PROCEDURE sp_obtener_componentes(
    IN p_tipo VARCHAR(20),
    IN p_limit INT,
    IN p_offset INT
)
BEGIN
    IF p_tipo IS NULL THEN
        SELECT * FROM componente 
        LIMIT p_limit OFFSET p_offset;
    ELSE
        SELECT * FROM componente 
        WHERE tipo = p_tipo
        LIMIT p_limit OFFSET p_offset;
    END IF;
    
    -- También devolvemos el conteo total para la paginación
    IF p_tipo IS NULL THEN
        SELECT COUNT(*) AS total FROM componente;
    ELSE
        SELECT COUNT(*) AS total FROM componente WHERE tipo = p_tipo;
    END IF;
END //

CREATE PROCEDURE sp_usar_componente(
    IN p_id_componente CHAR(36),
    IN p_id_usuario CHAR(36),
    IN p_id_maquina CHAR(36),
    OUT p_resultado VARCHAR(100),
    OUT p_exito BOOLEAN
)
BEGIN
    DECLARE v_es_tecnico BOOLEAN DEFAULT FALSE;
    DECLARE v_tipo_tecnico VARCHAR(20);
    DECLARE v_tipo_componente VARCHAR(20);
    DECLARE v_componente_nombre VARCHAR(50);

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_exito = FALSE;
        SET p_resultado = 'Error en la transacción';
    END;

    -- Verificar que el usuario es un técnico
    SELECT COUNT(*) > 0 INTO v_es_tecnico
    FROM Tecnico 
    WHERE ID_Tecnico = p_id_usuario;

    IF NOT v_es_tecnico THEN
        SET p_exito = FALSE;
        SET p_resultado = 'El usuario no es un técnico válido';
    ELSE
        -- Obtener tipo de técnico y tipo/nombre del componente
        SELECT Especialidad INTO v_tipo_tecnico
        FROM Tecnico 
        WHERE ID_Tecnico = p_id_usuario;

        SELECT tipo, nombre INTO v_tipo_componente, v_componente_nombre
        FROM componente
        WHERE ID_Componente = p_id_componente;

        -- Verificar que el componente existe
        IF v_tipo_componente IS NULL THEN
            SET p_exito = FALSE;
            SET p_resultado = 'El componente no existe';
        ELSE
            -- Verificar compatibilidad de tipos
            IF v_tipo_componente != 'Logistico' AND v_tipo_componente != v_tipo_tecnico THEN
                SET p_exito = FALSE;
                SET p_resultado = CONCAT('Componente de tipo ', v_tipo_componente, 
                                       ' no compatible con técnico ', v_tipo_tecnico);
            ELSE
                START TRANSACTION;

                -- Registrar uso del componente
                INSERT INTO componente_usuario (ID_Componente, ID_Usuario, ID_Maquina, fecha_asignacion)
                VALUES (p_id_componente, p_id_usuario, p_id_maquina, NOW());

                -- Registrar en montaje si hay máquina
                IF p_id_maquina IS NOT NULL THEN
                    INSERT INTO montaje (fecha, ID_Maquina, ID_Componente, ID_Tecnico, detalle)
                    VALUES (NOW(), p_id_maquina, p_id_componente, p_id_usuario, 
                           CONCAT('Componente ', v_componente_nombre, ' asignado'));
                END IF;

                SET p_exito = TRUE;
                SET p_resultado = 'Componente asignado correctamente';
                COMMIT;
            END IF;
        END IF;
    END IF;
END //

CREATE PROCEDURE sp_liberar_componente(
    IN p_id_componente CHAR(36),
    IN p_id_usuario CHAR(36),
    OUT p_resultado VARCHAR(100),
    OUT p_exito BOOLEAN
)
BEGIN
    DECLARE v_afectadas INT;
    DECLARE v_id_maquina CHAR(36);
    DECLARE v_id_registro CHAR(36);
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        GET DIAGNOSTICS CONDITION 1 @sqlstate = RETURNED_SQLSTATE;
        SET p_exito = FALSE;
        SET p_resultado = CONCAT('Error en la transacción: ', @sqlstate);
    END;
    
    START TRANSACTION;
    
    -- 1. Obtener el ID del registro y la máquina asociada
    SELECT ID_Registro, ID_Maquina INTO v_id_registro, v_id_maquina
    FROM componente_usuario
    WHERE ID_Componente = p_id_componente 
      AND ID_Usuario = p_id_usuario 
      AND fecha_liberacion IS NULL
    ORDER BY fecha_asignacion DESC 
    LIMIT 1;
    
    -- 2. Marcar como liberado usando ID_Registro para evitar ambigüedades
    IF v_id_registro IS NOT NULL THEN
        UPDATE componente_usuario 
        SET 
            fecha_liberacion = NOW(),
            ID_Maquina = NULL
        WHERE ID_Registro = v_id_registro;
        
        SET v_afectadas = ROW_COUNT();
        
        -- 3. Si tenía máquina asociada, eliminar de montaje
        IF v_id_maquina IS NOT NULL THEN
            DELETE FROM montaje 
            WHERE ID_Componente = p_id_componente
              AND ID_Maquina = v_id_maquina
              AND ID_Tecnico = p_id_usuario;
        END IF;
        
        SET p_resultado = CONCAT('Componente liberado correctamente', 
                                IF(v_id_maquina IS NULL, '', ' de la máquina'));
        SET p_exito = TRUE;
        COMMIT;
    ELSE
        SET p_exito = FALSE;
        SET p_resultado = 'No se encontró el componente en uso';
        ROLLBACK;
    END IF;
END //

CREATE PROCEDURE sp_obtener_componentes_en_uso(
    IN p_id_usuario CHAR(36),
    IN p_id_maquina CHAR(36)
)
BEGIN
    -- Primero verificar si el usuario existe
    IF NOT EXISTS (SELECT 1 FROM usuario WHERE ID_Usuario = p_id_usuario) THEN
        SELECT 
            NULL AS ID_Componente,
            NULL AS tipo,
            'Usuario no existe' AS nombre,
            NULL AS precio,
            NULL AS ID_Maquina,
            NULL AS Nombre_Maquina,
            NULL AS fecha_asignacion,
            'Error' AS estado_uso
        WHERE FALSE; -- Para que no devuelva filas
    ELSE
        -- Si el usuario existe, devolver componentes
        SELECT 
            c.ID_Componente,
            c.tipo,
            c.nombre,
            c.precio,
            cu.ID_Maquina,
            COALESCE(m.Nombre_Maquina, 'N/A') AS Nombre_Maquina,
            cu.fecha_asignacion,
            CASE 
                WHEN cu.ID_Maquina IS NOT NULL THEN 'Asignado permanentemente'
                WHEN cu.fecha_liberacion IS NULL THEN 'En uso temporal'
                ELSE 'Liberado'
            END AS estado_uso
        FROM componente c
        JOIN componente_usuario cu ON c.ID_Componente = cu.ID_Componente
        LEFT JOIN MaquinaRecreativa m ON cu.ID_Maquina = m.ID_Maquina
        WHERE cu.ID_Usuario = p_id_usuario 
        AND cu.fecha_liberacion IS NULL
        AND (p_id_maquina IS NULL OR cu.ID_Maquina = p_id_maquina);
    END IF;
END //

CREATE PROCEDURE crear_componente_maquina(
  IN p_id_componente CHAR(36),
  IN p_id_usuario CHAR(36),
  IN p_id_maquina CHAR(36),
  OUT p_resultado VARCHAR(100)
)
BEGIN
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    SET p_resultado = 'Error en la transacción';
  END;
  
  START TRANSACTION;
  
  -- Registrar uso del componente
  INSERT INTO componente_usuario (ID_Componente, ID_Usuario, fecha_asignacion)
  VALUES (p_id_componente, p_id_usuario, NOW());
  
  -- Registrar en tabla montaje si hay máquina
  IF p_id_maquina IS NOT NULL THEN
    INSERT INTO montaje (fecha, ID_Maquina, ID_Componente, ID_Tecnico, detalle)
    VALUES (NOW(), p_id_maquina, p_id_componente, p_id_usuario, 'Componente asignado');
  END IF;
  
  COMMIT;
  SET p_resultado = 'Operación exitosa';
END //

CREATE PROCEDURE sp_liberar_componentes_cancelacion(
    IN p_id_placa CHAR(36),
    IN p_id_carcasa CHAR(36),
    IN p_id_usuario CHAR(36),
    OUT p_resultado VARCHAR(100),
    OUT p_exito BOOLEAN
)
BEGIN
    DECLARE v_afectadas_placa INT;
    DECLARE v_afectadas_carcasa INT;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_exito = FALSE;
        SET p_resultado = 'Error en la transacción';
    END;
    
    START TRANSACTION;
    
    -- Liberar placa
    UPDATE componente_usuario 
    SET fecha_liberacion = NOW() 
    WHERE ID_Componente = p_id_placa 
    AND ID_Usuario = p_id_usuario 
    AND fecha_liberacion IS NULL;
    
    SET v_afectadas_placa = ROW_COUNT();
    
    -- Liberar carcasa
    UPDATE componente_usuario 
    SET fecha_liberacion = NOW() 
    WHERE ID_Componente = p_id_carcasa 
    AND ID_Usuario = p_id_usuario 
    AND fecha_liberacion IS NULL;
    
    SET v_afectadas_carcasa = ROW_COUNT();
    
    IF v_afectadas_placa = 0 OR v_afectadas_carcasa = 0 THEN
        SET p_exito = FALSE;
        SET p_resultado = 'No se encontraron todos los componentes en uso';
        ROLLBACK;
    ELSE
        SET p_exito = TRUE;
        SET p_resultado = 'Componentes liberados correctamente';
        COMMIT;
    END IF;
END //
CREATE PROCEDURE sp_obtener_componentes_por_maquina(IN p_id_maquina CHAR(36))
BEGIN
    SELECT 
        c.ID_Componente, 
        c.nombre, 
        c.tipo, 
        c.precio
    FROM montaje m
    JOIN componente c ON m.ID_Componente = c.ID_Componente
    WHERE m.ID_Maquina = p_id_maquina;
END //

DELIMITER ;