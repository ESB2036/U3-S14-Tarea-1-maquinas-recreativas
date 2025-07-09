USE bd_recrea_sys;
DELIMITER //

-- Registrar comercio
CREATE PROCEDURE sp_registrar_comercio(
    IN p_nombre VARCHAR(100),
    IN p_tipo ENUM('Minorista', 'Mayorista'),
    IN p_direccion TEXT,
    IN p_telefono VARCHAR(15),
    OUT p_id_comercio CHAR(36)
)
BEGIN
    DECLARE new_uuid CHAR(36);
    SET new_uuid = UUID();
    
    INSERT INTO Comercio (ID_Comercio, Nombre, Tipo, Direccion, Telefono, Fecha_Registro) 
    VALUES (new_uuid, p_nombre, p_tipo, p_direccion, p_telefono, CURDATE());
    
    SET p_id_comercio = new_uuid;
END //

-- Obtener todos los comercios
CREATE PROCEDURE sp_obtener_comercios()
BEGIN
    SELECT * FROM Comercio ORDER BY Nombre;
END //

-- Obtener comercio por ID
CREATE PROCEDURE sp_obtener_comercio_por_id(IN p_id CHAR(36))
BEGIN
    SELECT * FROM Comercio WHERE ID_Comercio = p_id;
END //

-- Incrementar máquinas en comercio
CREATE PROCEDURE sp_incrementar_maquinas_comercio(IN p_id_comercio CHAR(36))
BEGIN
    UPDATE Comercio 
    SET Cantidad_Maquinas = Cantidad_Maquinas + 1 
    WHERE ID_Comercio = p_id_comercio;
END //