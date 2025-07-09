USE bd_recrea_sys;
DELIMITER //

-- Obtener todos los usuarios
CREATE PROCEDURE sp_obtener_todos_usuarios()
BEGIN
    SELECT u.*, t.Especialidad 
    FROM usuario u 
    LEFT JOIN Tecnico t ON u.ID_Usuario = t.ID_Tecnico 
    ORDER BY u.tipo, u.nombre;
END //

-- Actualizar usuario
CREATE PROCEDURE sp_actualizar_usuario(
    IN p_id CHAR(36),
    IN p_nombre VARCHAR(50),
    IN p_apellido VARCHAR(50),
    IN p_email VARCHAR(100),
    IN p_tipo ENUM('Administrador', 'Logistica', 'Tecnico', 'Contabilidad'),
    IN p_estado ENUM('Pendiente de asignacion', 'Activo', 'Inhabilitado'),
    IN p_usuario_asignado VARCHAR(25),
    IN p_especialidad VARCHAR(50)
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    UPDATE usuario SET 
        nombre = p_nombre,
        apellido = p_apellido,
        email = p_email,
        tipo = p_tipo,
        estado = p_estado,
        usuario_asignado = p_usuario_asignado
    WHERE ID_Usuario = p_id;
    
    IF p_tipo = 'Tecnico' AND p_especialidad IS NOT NULL THEN
        INSERT INTO Tecnico (ID_Tecnico, Especialidad) 
        VALUES (p_id, p_especialidad)
        ON DUPLICATE KEY UPDATE Especialidad = p_especialidad;
    END IF;
    
    COMMIT;
END //

-- Eliminar usuario
CREATE PROCEDURE sp_eliminar_usuario(IN p_id CHAR(36))
BEGIN
    DECLARE v_has_dependencies INT;
    DECLARE v_tipo VARCHAR(20);
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    -- Verificar dependencias
    SELECT COUNT(*) INTO v_has_dependencies FROM MaquinaRecreativa 
    WHERE ID_Tecnico_Ensamblador = p_id OR ID_Tecnico_Comprobador = p_id OR ID_Tecnico_Mantenimiento = p_id;
    
    IF v_has_dependencies > 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'No se puede eliminar el usuario porque tiene máquinas asignadas';
    END IF;
    
    -- Eliminar registros relacionados
    DELETE FROM historial_actividades WHERE ID_Usuario = p_id;
    DELETE FROM NotificacionMaquinaRecreativa WHERE ID_Remitente = p_id OR ID_Destinatario = p_id;
    DELETE FROM inicio_sesion WHERE ID_Usuario = p_id;
    
    -- Obtener tipo de usuario
    SELECT tipo INTO v_tipo FROM usuario WHERE ID_Usuario = p_id;
    
    -- Eliminar de tablas específicas
    IF v_tipo = 'Tecnico' THEN
        DELETE FROM Tecnico WHERE ID_Tecnico = p_id;
    ELSEIF v_tipo = 'Logistica' THEN
        DELETE FROM Logistica WHERE ID_Logistica = p_id;
    END IF;
    
    -- Finalmente eliminar usuario
    DELETE FROM usuario WHERE ID_Usuario = p_id;
    
    COMMIT;
END //

-- Registrar usuario admin
CREATE PROCEDURE sp_registrar_usuario_admin(
    IN p_nombre VARCHAR(50),
    IN p_apellido VARCHAR(50),
    IN p_ci VARCHAR(100),
    IN p_email VARCHAR(100),
    IN p_usuario_asignado VARCHAR(25),
    IN p_tipo ENUM('Administrador', 'Logistica', 'Tecnico', 'Contabilidad'),
    IN p_estado ENUM('Pendiente de asignacion', 'Activo', 'Inhabilitado'),
    IN p_contrasena VARCHAR(255),
    IN p_especialidad VARCHAR(50),
    OUT p_id_usuario CHAR(36)
)
BEGIN
    DECLARE new_uuid CHAR(36);
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    SET new_uuid = UUID();
    
    INSERT INTO usuario (ID_Usuario, nombre, apellido, ci, email, usuario_asignado, contrasena, tipo, estado) 
    VALUES (new_uuid, p_nombre, p_apellido, p_ci, p_email, p_usuario_asignado, p_contrasena, p_tipo, p_estado);
    
    SET p_id_usuario = new_uuid;
    
    IF p_tipo = 'Tecnico' AND p_especialidad IS NOT NULL THEN
        INSERT INTO Tecnico (ID_Tecnico, Especialidad) VALUES (new_uuid, p_especialidad);
    ELSEIF p_tipo = 'Logistica' THEN
        INSERT INTO Logistica (ID_Logistica) VALUES (new_uuid);
    END IF;
    
    COMMIT;
END //

CREATE PROCEDURE sp_cambiar_estado_usuario(
    IN p_id_usuario CHAR(36),
    IN p_estado VARCHAR(30)
)
BEGIN
    UPDATE usuario 
    SET estado = p_estado 
    WHERE ID_Usuario = p_id_usuario;
END //

-- Obtener usuarios con filtros
CREATE PROCEDURE sp_obtener_usuarios_filtrados(
    IN p_ci VARCHAR(100),
    IN p_estado VARCHAR(30),
    IN p_tipo VARCHAR(20),
    IN p_rango VARCHAR(10)
)
BEGIN
    SET @sql = "SELECT 
                  u.*,
                  (SELECT fecha_ultima_sesion 
                   FROM inicio_sesion 
                   WHERE ID_Usuario = u.ID_Usuario 
                   ORDER BY fecha_ultima_sesion DESC 
                   LIMIT 1) AS fecha_ultima_sesion
                FROM usuario u
                WHERE 1=1";
    
    IF p_ci IS NOT NULL THEN
        SET @sql = CONCAT(@sql, " AND u.ci = '", p_ci, "'");
    END IF;
    
    IF p_estado IS NOT NULL THEN
        SET @sql = CONCAT(@sql, " AND u.estado = '", p_estado, "'");
    END IF;
    
    IF p_tipo IS NOT NULL THEN
        SET @sql = CONCAT(@sql, " AND u.tipo = '", p_tipo, "'");
    END IF;
    
    IF p_rango IS NOT NULL THEN
        CASE p_rango
            WHEN 'hoy' THEN
                SET @sql = CONCAT(@sql, " AND DATE((SELECT fecha_ultima_sesion FROM inicio_sesion WHERE ID_Usuario = u.ID_Usuario ORDER BY fecha_ultima_sesion DESC LIMIT 1)) = CURDATE()");
            WHEN 'ayer' THEN
                SET @sql = CONCAT(@sql, " AND DATE((SELECT fecha_ultima_sesion FROM inicio_sesion WHERE ID_Usuario = u.ID_Usuario ORDER BY fecha_ultima_sesion DESC LIMIT 1)) = CURDATE() - INTERVAL 1 DAY");
            WHEN '15dias' THEN
                SET @sql = CONCAT(@sql, " AND DATE((SELECT fecha_ultima_sesion FROM inicio_sesion WHERE ID_Usuario = u.ID_Usuario ORDER BY fecha_ultima_sesion DESC LIMIT 1)) >= CURDATE() - INTERVAL 15 DAY");
            WHEN '30dias' THEN
                SET @sql = CONCAT(@sql, " AND DATE((SELECT fecha_ultima_sesion FROM inicio_sesion WHERE ID_Usuario = u.ID_Usuario ORDER BY fecha_ultima_sesion DESC LIMIT 1)) >= CURDATE() - INTERVAL 30 DAY");
        END CASE;
    END IF;
    
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
END //
