<?php
require_once __DIR__ . '/../config/database.php';

class ComercioModel {
    private $db;

    public function __construct() {
        $this->db = new Database();
    }

    public function registrarComercio($nombre, $tipo, $direccion, $telefono) {
        $conn = $this->db->getConnection();
        
        $sql = "CALL sp_registrar_comercio(?, ?, ?, ?, @id_comercio)";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("ssss", $nombre, $tipo, $direccion, $telefono);
        
        if ($stmt->execute()) {
            $result = $conn->query("SELECT @id_comercio as id");
            return $result->fetch_assoc()['id'];
        } else {
            return false;
        }
    }

    public function obtenerComercios() {
        $conn = $this->db->getConnection();
        
        $sql = "CALL sp_obtener_comercios()";
        $result = $conn->query($sql);
        $comercios = [];
        
        while ($row = $result->fetch_assoc()) {
            $comercios[] = $row;
        }
        
        return $comercios;
    }
    
    public function obtenerComercioPorId($id) {
        $conn = $this->db->getConnection();
        
        $sql = "CALL sp_obtener_comercio_por_id(?)";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("s", $id); // Changed from "i" to "s" for UUID
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows > 0) {
            return $result->fetch_assoc();
        } else {
            return false;
        }
    }

    public function incrementarMaquinasComercio($idComercio) {
        $conn = $this->db->getConnection();
        
        $sql = "CALL sp_incrementar_maquinas_comercio(?)";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("s", $idComercio); // Changed from "i" to "s" for UUID
        
        return $stmt->execute();
    }
}