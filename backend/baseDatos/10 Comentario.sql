USE bd_recrea_sys;
DELIMITER //

-- Procedimiento para crear un comentario
CREATE PROCEDURE sp_crear_comentario(
    IN p_id_reporte CHAR(36),
    IN p_id_usuario_emisor CHAR(36),
    IN p_comentario TEXT,
    OUT p_id_comentario CHAR(36)
)
BEGIN
    DECLARE new_uuid CHAR(36);
    SET new_uuid = UUID();

    INSERT INTO comentario (id_comentario, id_reporte, id_usuario_emisor, comentario, fecha_hora) 
    VALUES (new_uuid, p_id_reporte, p_id_usuario_emisor, p_comentario, NOW());

    SET p_id_comentario = new_uuid;
END //
CREATE PROCEDURE sp_obtener_comentarios_por_reporte(
    IN p_id_reporte CHAR(36),
    IN p_id_usuario CHAR(36)
)
BEGIN
    -- Verificar acceso al reporte
    IF EXISTS (
        SELECT 1 FROM reporte 
        WHERE id_reporte = p_id_reporte 
        AND (id_usuario_emisor = p_id_usuario OR id_usuario_destinatario = p_id_usuario)
    ) THEN
        SELECT c.*, u.nombre, u.apellido, u.tipo
        FROM comentario c
        JOIN usuario u ON c.id_usuario_emisor = u.id_usuario
        WHERE c.id_reporte = p_id_reporte
        ORDER BY c.fecha_hora ASC;
    END IF;
END //
CREATE PROCEDURE sp_obtener_comentarios_por_chat(
    IN p_id_emisor CHAR(36),
    IN p_id_destinatario CHAR(36)
)
BEGIN
    SELECT c.*, u.nombre, u.apellido, u.tipo
    FROM comentario c
    JOIN usuario u ON c.id_usuario_emisor = u.id_usuario
    JOIN reporte r ON c.id_reporte = r.id_reporte
    WHERE (r.id_usuario_emisor = p_id_emisor AND r.id_usuario_destinatario = p_id_destinatario)
       OR (r.id_usuario_emisor = p_id_destinatario AND r.id_usuario_destinatario = p_id_emisor)
    ORDER BY c.fecha_hora ASC;
END //

DELIMITER ;