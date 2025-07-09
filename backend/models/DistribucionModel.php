<?php
require_once __DIR__ . '/../config/database.php';

class DistribucionModel {
    private $db;

    public function __construct() {
        $this->db = new Database();
    }

    public function actualizarInformeDistribucion($idMaquina, $estado) {
        $conn = $this->db->getConnection();
        
        $estadosPermitidos = ['Operativa', 'Retirada', 'No operativa'];
        if (!in_array($estado, $estadosPermitidos)) {
            $estado = 'Operativa';
        }
        
        $sql = "CALL sp_actualizar_informe_distribucion(?, ?)";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("ss", $idMaquina, $estado);
        
        return $stmt->execute();
    }

    public function crearInformeDistribucion($idMaquina, $idUsuario, $idComercio) {
        $conn = $this->db->getConnection();
        
        $sql = "CALL sp_crear_informe_distribucion(?, ?, ?)";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("sss", $idMaquina, $idUsuario, $idComercio);
        
        return $stmt->execute();
    }

    public function obtenerInformesDistribucion($filters = []) {
        $conn = $this->db->getConnection();
        
        $estado = $filters['estado'] ?? null;
        $idComercio = $filters['ID_Comercio'] ?? null;
        $fechaInicio = $filters['fecha_inicio'] ?? null;
        $fechaFin = $filters['fecha_fin'] ?? null;
        $idMaquina = $filters['ID_Maquina'] ?? null;
        
        $sql = "CALL sp_obtener_informes_distribucion(?, ?, ?, ?, ?)";
        $stmt = $conn->prepare($sql);
        
        $stmt->bind_param("sssss", 
            $estado,
            $idComercio,
            $fechaInicio,
            $fechaFin,
            $idMaquina
        );
        
        $stmt->execute();
        $result = $stmt->get_result();
        $informes = [];
        
        while ($row = $result->fetch_assoc()) {
            $informes[] = $row;
        }
        
        return $informes;
    }
}
?>