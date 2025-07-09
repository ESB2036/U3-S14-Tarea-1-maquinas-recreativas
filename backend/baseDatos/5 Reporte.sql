USE bd_recrea_sys;
DELIMITER //

-- Procedimiento para crear reporte
CREATE PROCEDURE sp_crear_reporte(
    IN p_emisor_id CHAR(36),
    IN p_destinatario_id CHAR(36),
    IN p_descripcion TEXT,
    OUT p_id_reporte CHAR(36)
)
BEGIN
    DECLARE new_uuid CHAR(36);
    SET new_uuid = UUID();
    
    INSERT INTO reporte (
        ID_Reporte, ID_Usuario_Emisor, ID_Usuario_Destinatario, descripcion, estado, fecha_hora
    ) VALUES (
        new_uuid, p_emisor_id, p_destinatario_id, p_descripcion, 'Pendiente', NOW()
    );
    
    SET p_id_reporte = new_uuid;
END //

-- Procedimiento para obtener reportes por usuario
CREATE PROCEDURE sp_obtener_reportes_por_usuario(IN p_user_id CHAR(36))
BEGIN
    SELECT r.*, 
           ue.nombre AS emisor_nombre, ue.apellido AS emisor_apellido, ue.tipo AS emisor_tipo,
           ud.nombre AS destinatario_nombre, ud.apellido AS destinatario_apellido, ud.tipo AS destinatario_tipo
    FROM reporte r
    JOIN usuario ue ON r.ID_Usuario_Emisor = ue.ID_Usuario
    LEFT JOIN usuario ud ON r.ID_Usuario_Destinatario = ud.ID_Usuario
    WHERE r.ID_Usuario_Emisor = p_user_id OR r.ID_Usuario_Destinatario = p_user_id
    ORDER BY r.fecha_hora DESC;
END //

-- Procedimiento para obtener reporte por ID
CREATE PROCEDURE sp_obtener_reporte_por_id(IN p_reporte_id CHAR(36))
BEGIN
    SELECT r.*, 
           ue.nombre AS emisor_nombre, ue.apellido AS emisor_apellido, ue.tipo AS emisor_tipo,
           ud.nombre AS destinatario_nombre, ud.apellido AS destinatario_apellido, ud.tipo AS destinatario_tipo
    FROM reporte r
    JOIN usuario ue ON r.ID_Usuario_Emisor = ue.ID_Usuario
    LEFT JOIN usuario ud ON r.ID_Usuario_Destinatario = ud.ID_Usuario
    WHERE r.ID_Reporte = p_reporte_id;
END //

-- Procedimiento para actualizar estado de reporte
CREATE PROCEDURE sp_actualizar_estado_reporte(
    IN p_reporte_id CHAR(36),
    IN p_estado VARCHAR(15)
)
BEGIN
    UPDATE reporte 
    SET estado = p_estado 
    WHERE ID_Reporte = p_reporte_id;
END //

-- Procedimiento para obtener chat entre dos usuarios
CREATE PROCEDURE sp_obtener_chat(
    IN p_emisor_id CHAR(36),
    IN p_destinatario_id CHAR(36)
)
BEGIN
    SELECT r.ID_Reporte, r.descripcion, r.estado, r.fecha_hora,
           ue.nombre AS emisor_nombre, ue.apellido AS emisor_apellido, ue.tipo AS emisor_tipo,
           ud.nombre AS destinatario_nombre, ud.apellido AS destinatario_apellido, ud.tipo AS destinatario_tipo
    FROM reporte r
    JOIN usuario ue ON r.ID_Usuario_Emisor = ue.ID_Usuario
    JOIN usuario ud ON r.ID_Usuario_Destinatario = ud.ID_Usuario
    WHERE (r.ID_Usuario_Emisor = p_emisor_id AND r.ID_Usuario_Destinatario = p_destinatario_id)
    OR (r.ID_Usuario_Emisor = p_destinatario_id AND r.ID_Usuario_Destinatario = p_emisor_id)
    ORDER BY r.fecha_hora DESC;
END //

-- Procedimiento para obtener usuarios con los que se ha chateado
CREATE PROCEDURE sp_obtener_usuarios_chat(IN p_user_id CHAR(36))
BEGIN
    SELECT DISTINCT 
        CASE 
            WHEN r.ID_Usuario_Emisor = p_user_id THEN ud.ID_Usuario
            ELSE ue.ID_Usuario
        END AS ID_Usuario,
        CASE 
            WHEN r.ID_Usuario_Emisor = p_user_id THEN ud.nombre
            ELSE ue.nombre
        END AS nombre,
        CASE 
            WHEN r.ID_Usuario_Emisor = p_user_id THEN ud.apellido
            ELSE ue.apellido
        END AS apellido,
        CASE 
            WHEN r.ID_Usuario_Emisor = p_user_id THEN ud.email
            ELSE ue.email
        END AS email,
        CASE 
            WHEN r.ID_Usuario_Emisor = p_user_id THEN ud.tipo
            ELSE ue.tipo
        END AS tipo
    FROM reporte r
    JOIN usuario ue ON r.ID_Usuario_Emisor = ue.ID_Usuario
    JOIN usuario ud ON r.ID_Usuario_Destinatario = ud.ID_Usuario
    WHERE r.ID_Usuario_Emisor = p_user_id OR r.ID_Usuario_Destinatario = p_user_id
    ORDER BY nombre, apellido;
END //
CREATE PROCEDURE sp_buscar_chats_por_email(
    IN p_email VARCHAR(100)
)
BEGIN
    DECLARE v_user_id CHAR(36);
    
    -- Buscar el ID del usuario por email
    SELECT ID_Usuario INTO v_user_id FROM usuario WHERE email = p_email LIMIT 1;
    
    IF v_user_id IS NOT NULL THEN
        -- Obtener todos los chats donde el usuario es emisor o destinatario
        SELECT 
            r.ID_Reporte,
            r.descripcion,
            r.estado,
            r.fecha_hora,
            ue.nombre AS emisor_nombre,
            ue.apellido AS emisor_apellido,
            ue.tipo AS emisor_tipo,
            ud.nombre AS destinatario_nombre,
            ud.apellido AS destinatario_apellido,
            ud.tipo AS destinatario_tipo,
            CASE 
                WHEN r.ID_Usuario_Emisor = v_user_id THEN ud.ID_Usuario
                ELSE ue.ID_Usuario
            END AS otro_usuario_id
        FROM reporte r
        JOIN usuario ue ON r.ID_Usuario_Emisor = ue.ID_Usuario
        JOIN usuario ud ON r.ID_Usuario_Destinatario = ud.ID_Usuario
        WHERE r.ID_Usuario_Emisor = v_user_id OR r.ID_Usuario_Destinatario = v_user_id
        ORDER BY r.fecha_hora DESC;
    END IF;
END //
