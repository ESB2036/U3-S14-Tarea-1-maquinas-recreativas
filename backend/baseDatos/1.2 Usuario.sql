USE bd_recrea_sys;

DELIMITER //

-- Procedimiento para registrar usuario (modificado para UUID)
CREATE PROCEDURE sp_registrar_usuario(
    IN p_nombre VARCHAR(50),
    IN p_apellido VARCHAR(50),
    IN p_ci VARCHAR(100),
    IN p_email VARCHAR(100),
    IN p_usuario_asignado VARCHAR(25),
    IN p_contrasena VARCHAR(255),
    IN p_tipo ENUM('Administrador', 'Logistica', 'Tecnico', 'Contabilidad', 'Usuario'),
    IN p_especialidad VARCHAR(20),
    OUT p_id_usuario CHAR(36)
)
BEGIN
    DECLARE v_id CHAR(36);
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
        SET p_id_usuario = NULL;
    END;
    
    START TRANSACTION;
    
    -- Verificar si el email ya existe
    IF EXISTS (SELECT 1 FROM usuario WHERE email = p_email) THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'El correo electrónico ya está registrado';
    END IF;
    
    -- Verificar si la cédula ya existe
    IF EXISTS (SELECT 1 FROM usuario WHERE ci = p_ci) THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'La cédula ya está registrada';
    END IF;
    
    -- Insertar usuario principal
    INSERT INTO usuario (
        nombre, apellido, ci, email, usuario_asignado, contrasena, tipo, estado
    ) VALUES (
        p_nombre, p_apellido, p_ci, p_email, p_usuario_asignado, p_contrasena, p_tipo, 'Pendiente de asignacion'
    );
    
    -- Obtener el UUID generado
    SELECT ID_Usuario INTO v_id FROM usuario WHERE email = p_email LIMIT 1;
    SET p_id_usuario = v_id;
    
    -- Insertar en tabla específica según tipo
    IF p_tipo = 'Tecnico' AND p_especialidad IS NOT NULL THEN
        INSERT INTO Tecnico (ID_Tecnico, Especialidad) 
        VALUES (v_id, p_especialidad);
    ELSEIF p_tipo = 'Logistica' THEN
        INSERT INTO Logistica (ID_Logistica) 
        VALUES (v_id);
    END IF;
    
    COMMIT;
END //
CREATE PROCEDURE sp_buscar_usuario_por_email(
    IN p_email VARCHAR(100)
)
BEGIN
    SELECT * 
    FROM usuario
    WHERE email = p_email;
END //
-- Procedimiento para login de usuario (modificado para UUID)
CREATE PROCEDURE sp_login(IN p_usuario_asignado VARCHAR(25))
BEGIN
    SELECT u.*, t.Especialidad 
    FROM usuario u 
    LEFT JOIN Tecnico t ON u.ID_Usuario = t.ID_Tecnico 
    WHERE u.usuario_asignado = p_usuario_asignado;
END //

-- Procedimiento para registrar inicio de sesión (modificado para UUID)
CREATE PROCEDURE sp_registrar_inicio_sesion(
    IN p_id_usuario CHAR(36),
    IN p_usuario_asignado VARCHAR(100),
    IN p_contrasena VARCHAR(255)
)
BEGIN
    INSERT INTO inicio_sesion 
    (ID_Usuario, usuario_asignado, contrasena) 
    VALUES (p_id_usuario, p_usuario_asignado, p_contrasena);
END //

-- Procedimiento para registrar logout (modificado para UUID)
CREATE PROCEDURE sp_registrar_logout(IN p_id_usuario CHAR(36))
BEGIN
    UPDATE inicio_sesion 
    SET fecha_ultima_sesion = NOW() 
    WHERE ID_Usuario = p_id_usuario 
    ORDER BY fecha_inicio DESC 
    LIMIT 1;
END //

-- Procedimiento para obtener estado de usuario (modificado para UUID)
CREATE PROCEDURE sp_obtener_estado_usuario(
    IN p_id_usuario CHAR(36),
    OUT p_estado VARCHAR(30)
)
BEGIN
    SELECT estado INTO p_estado 
    FROM usuario 
    WHERE ID_Usuario = p_id_usuario;
END //

-- Procedimiento para incrementar actividades de técnico (modificado para UUID)
CREATE PROCEDURE sp_incrementar_actividades_tecnico(IN p_id_tecnico CHAR(36))
BEGIN
    UPDATE Tecnico 
    SET Cantidad_Actividades = Cantidad_Actividades + 1 
    WHERE ID_Tecnico = p_id_tecnico;
END //

-- Procedimiento para obtener usuario por ID (modificado para UUID)
CREATE PROCEDURE sp_obtener_usuario_por_id(IN p_id CHAR(36))
BEGIN
    SELECT u.*, t.Especialidad 
    FROM usuario u 
    LEFT JOIN Tecnico t ON u.ID_Usuario = t.ID_Tecnico 
    WHERE u.ID_Usuario = p_id;
END //

-- Procedimiento para actualizar perfil de usuario (modificado para UUID)
CREATE PROCEDURE sp_actualizar_perfil(
    IN p_id CHAR(36),
    IN p_nombre VARCHAR(50),
    IN p_apellido VARCHAR(50),
    IN p_email VARCHAR(100),
    IN p_ci VARCHAR(100),
    IN p_tipo VARCHAR(20),
    IN p_estado VARCHAR(30),
    IN p_especialidad VARCHAR(20),
    OUT p_resultado BOOLEAN
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_resultado = FALSE;
    END;
    
    START TRANSACTION;
    
    -- Actualizar usuario
    UPDATE usuario SET 
        nombre = p_nombre, 
        apellido = p_apellido, 
        email = p_email, 
        ci = p_ci,
        tipo = p_tipo,
        estado = p_estado
    WHERE ID_Usuario = p_id;
    
    -- Si es técnico, manejar especialidad
    IF p_tipo = 'Tecnico' THEN
        -- Eliminar primero si existe para evitar duplicados
        DELETE FROM Tecnico WHERE ID_Tecnico = p_id;
        
        -- Insertar solo si hay especialidad
        IF p_especialidad IS NOT NULL THEN
            INSERT INTO Tecnico (ID_Tecnico, Especialidad) 
            VALUES (p_id, p_especialidad);
        END IF;
    ELSE
        -- Si cambia de técnico a otro tipo, eliminar de la tabla Tecnico
        DELETE FROM Tecnico WHERE ID_Tecnico = p_id;
    END IF;
    
    COMMIT;
    SET p_resultado = TRUE;
END //

-- Procedimiento para actualizar usuario asignado (modificado para UUID)
CREATE PROCEDURE sp_actualizar_usuario_asignado(
    IN p_id CHAR(36),
    IN p_usuario_asignado VARCHAR(25),
    OUT p_resultado BOOLEAN
)
BEGIN
    DECLARE v_email VARCHAR(100);
    
    -- Verificar si se proporcionó ID o email
    IF p_id IS NOT NULL THEN
        UPDATE usuario 
        SET usuario_asignado = p_usuario_asignado 
        WHERE ID_Usuario = p_id;
        
        SET p_resultado = (ROW_COUNT() > 0);
    ELSE
        SET p_resultado = FALSE;
    END IF;
END //

-- Procedimiento para recuperar contraseña (modificado para UUID)
CREATE PROCEDURE sp_recuperar_contrasena(
    IN p_email VARCHAR(100),
    IN p_nueva_contrasena VARCHAR(255),
    OUT p_resultado BOOLEAN
)
BEGIN
    UPDATE usuario 
    SET contrasena = p_nueva_contrasena 
    WHERE email = p_email;
    
    SET p_resultado = (ROW_COUNT() > 0);
END //

-- Procedimiento para obtener técnicos por especialidad (modificado para UUID)
CREATE PROCEDURE sp_obtener_tecnicos_por_especialidad(
    IN p_especialidad VARCHAR(20),
    IN p_solo_activos BOOLEAN
)
BEGIN
    SELECT u.ID_Usuario, u.nombre, u.apellido, t.Cantidad_Actividades, u.estado 
    FROM usuario u 
    JOIN Tecnico t ON u.ID_Usuario = t.ID_Tecnico 
    WHERE t.Especialidad = p_especialidad
    AND (p_solo_activos = FALSE OR u.estado = 'Activo')
    ORDER BY t.Cantidad_Actividades ASC;
END //

-- Procedimiento para obtener usuarios por tipo (modificado para UUID)
CREATE PROCEDURE sp_obtener_usuarios_por_tipo(
    IN p_tipo VARCHAR(20),
    IN p_excluir_id CHAR(36)
)
BEGIN
    IF p_excluir_id IS NULL THEN
        SELECT ID_Usuario, nombre, apellido, tipo, email 
        FROM usuario 
        WHERE tipo = p_tipo;
    ELSE
        SELECT ID_Usuario, nombre, apellido, tipo, email 
        FROM usuario 
        WHERE tipo = p_tipo AND ID_Usuario != p_excluir_id;
    END IF;
END //

-- Procedimiento para registrar actividad (modificado para UUID)
CREATE PROCEDURE sp_registrar_actividad(
    IN p_id_usuario CHAR(36),
    IN p_descripcion TEXT,
    OUT p_resultado BOOLEAN
)
BEGIN
    INSERT INTO historial_actividades (ID_Usuario, descripcion) 
    VALUES (p_id_usuario, p_descripcion);
    
    SET p_resultado = (ROW_COUNT() > 0);
END //

-- Procedimiento para obtener historial de actividades (modificado para UUID)
CREATE PROCEDURE sp_obtener_historial_actividades(IN p_usuario_id CHAR(36))
BEGIN
    SELECT ID_Historial_Actividades, descripcion, fecha_registro
    FROM historial_actividades
    WHERE ID_Usuario = p_usuario_id
    ORDER BY fecha_registro DESC;
END //

DELIMITER ;