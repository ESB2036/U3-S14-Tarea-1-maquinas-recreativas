USE bd_recrea_sys;
DELIMITER //

-- Procedimiento para crear notificación de máquina con UUID
CREATE PROCEDURE sp_crear_notificacion_maquina(
    IN p_id_remitente CHAR(36),
    IN p_id_destinatario CHAR(36),
    IN p_id_maquina CHAR(36),
    IN p_tipo VARCHAR(50),
    IN p_mensaje TEXT
)
BEGIN
    INSERT INTO NotificacionMaquinaRecreativa (
        ID_Notificacion, ID_Remitente, ID_Destinatario, ID_Maquina, Tipo, Mensaje
    ) VALUES (
        UUID(), p_id_remitente, p_id_destinatario, p_id_maquina, p_tipo, p_mensaje
    );
END //

-- Procedimiento para obtener notificaciones por destinatario con UUID
CREATE PROCEDURE sp_obtener_notificaciones_por_destinatario(IN p_id_destinatario CHAR(36))
BEGIN
    SELECT n.*, u.nombre AS NombreRemitente, m.Nombre_Maquina, 
           c.Nombre AS NombreComercio, c.Direccion AS DireccionComercio
    FROM NotificacionMaquinaRecreativa n 
    JOIN usuario u ON n.ID_Remitente = u.ID_Usuario 
    JOIN MaquinaRecreativa m ON n.ID_Maquina = m.ID_Maquina
    JOIN Comercio c ON m.ID_Comercio = c.ID_Comercio
    WHERE n.ID_Destinatario = p_id_destinatario 
    ORDER BY n.Fecha DESC;
END //

-- Procedimiento para marcar notificación como leída con UUID
CREATE PROCEDURE sp_marcar_como_leida(IN p_id_notificacion CHAR(36))
BEGIN
    UPDATE NotificacionMaquinaRecreativa 
    SET Estado = 'Leido' 
    WHERE ID_Notificacion = p_id_notificacion;
END //

-- Procedimiento para obtener cantidad de notificaciones no leídas con UUID
CREATE PROCEDURE sp_obtener_no_leidas(IN p_id_usuario CHAR(36), OUT p_total INT)
BEGIN
    SELECT COUNT(*) INTO p_total 
    FROM NotificacionMaquinaRecreativa 
    WHERE ID_Destinatario = p_id_usuario AND Estado = 'No leido';
END //

-- Procedimiento para crear notificación de reporte con UUID
CREATE PROCEDURE sp_crear_notificacion_reporte(
    IN p_id_reporte CHAR(36),
    IN p_id_usuario CHAR(36),
    IN p_mensaje TEXT
)
BEGIN
    INSERT INTO notificaciones (
        ID_Notificaciones, ID_Reporte, ID_Usuario, mensaje, fecha_hora, leida
    ) VALUES (
        UUID(), p_id_reporte, p_id_usuario, p_mensaje, NOW(), 0
    );
END //

-- Procedimiento para obtener notificaciones por usuario con UUID
CREATE PROCEDURE sp_obtener_notificaciones_por_usuario(IN p_usuario_id CHAR(36))
BEGIN
    SELECT n.*, r.descripcion AS reporte_descripcion,
           ue.nombre AS emisor_nombre, ue.apellido AS emisor_apellido
    FROM notificaciones n
    LEFT JOIN reporte r ON n.ID_Reporte = r.ID_Reporte
    LEFT JOIN usuario ue ON r.ID_Usuario_Emisor = ue.ID_Usuario
    WHERE n.ID_Usuario = p_usuario_id
    ORDER BY n.fecha_hora DESC;
END //

-- Procedimiento para marcar notificación como leída con UUID
CREATE PROCEDURE sp_marcar_como_leida_notificacion(
    IN p_notificacion_id CHAR(36),
    IN p_usuario_id CHAR(36)
)
BEGIN
    UPDATE notificaciones 
    SET leida = 1 
    WHERE ID_Notificaciones = p_notificacion_id AND ID_Usuario = p_usuario_id;
END //

-- Procedimiento para marcar todas las notificaciones como leídas con UUID
CREATE PROCEDURE sp_marcar_todas_como_leidas(IN p_usuario_id CHAR(36))
BEGIN
    UPDATE notificaciones 
    SET leida = 1 
    WHERE ID_Usuario = p_usuario_id;
END //

-- Procedimiento para obtener cantidad de notificaciones no leídas con UUID
CREATE PROCEDURE sp_obtener_cantidad_no_leidas(IN p_usuario_id CHAR(36), OUT p_cantidad INT)
BEGIN
    SELECT COUNT(*) INTO p_cantidad
    FROM notificaciones
    WHERE ID_Usuario = p_usuario_id AND leida = 0;
END //

DELIMITER ;