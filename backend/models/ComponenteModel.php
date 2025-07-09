<?php
require_once __DIR__ . '/../config/database.php';

class ComponenteModel {
    private $db;

    public function __construct() {
        $this->db = new Database();
    }

    public function obtenerComponentes($tipo = null, $limit = 10, $offset = 0) {
        $conn = $this->db->getConnection();
        
        $sql = "CALL sp_obtener_componentes(?, ?, ?)";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("sii", $tipo, $limit, $offset);
        $stmt->execute();
        
        $result = $stmt->get_result();
        $componentes = [];
        
        while ($row = $result->fetch_assoc()) {
            $componentes[] = $row;
        }
        
        $stmt->next_result();
        $countResult = $stmt->get_result();
        $total = $countResult->fetch_assoc()['total'];
        
        return [
            'componentes' => $componentes,
            'total' => $total
        ];
    }

    public function obtenerComponentesDisponibles($tipo = null) {
        $conn = $this->db->getConnection();
        
        $sql = "CALL sp_obtener_componentes_disponibles(?)";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("s", $tipo);
        $stmt->execute();
        $result = $stmt->get_result();
        $componentes = [];
        
        while ($row = $result->fetch_assoc()) {
            $componentes[] = $row;
        }
        
        return $componentes;
    }

    public function usarComponente($idComponente, $idUsuario, $idMaquina = null) {
        $conn = $this->db->getConnection();
        
        $sql = "CALL sp_usar_componente(?, ?, ?, @resultado, @exito)";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("sss", $idComponente, $idUsuario, $idMaquina); // Changed to "s" for UUID
        $stmt->execute();
        
        $result = $conn->query("SELECT @resultado as message, @exito as success");
        $row = $result->fetch_assoc();
        
        return [
            'success' => (bool)$row['success'],
            'message' => $row['message']
        ];
    }

    public function liberarComponente($idComponente, $idUsuario) {
        $conn = $this->db->getConnection();
        
        $sql = "CALL sp_liberar_componente(?, ?, @resultado, @exito)";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("ss", $idComponente, $idUsuario); // Changed to "s" for UUID
        $stmt->execute();
        
        $result = $conn->query("SELECT @resultado as message, @exito as success");
        return $result->fetch_assoc();
    }

    public function obtenerComponentesEnUso($idUsuario, $idMaquina = null) {
        $conn = $this->db->getConnection();
        
        $sql = "CALL sp_obtener_componentes_en_uso(?, ?)";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("ss", $idUsuario, $idMaquina); // Changed to "s" for UUID
        $stmt->execute();
        $result = $stmt->get_result();
        $componentes = [];
        
        while ($row = $result->fetch_assoc()) {
            $componentes[] = $row;
        }
        
        return $componentes;
    }

    public function liberarComponentesCancelacion($idPlaca, $idCarcasa, $idUsuario) {
        $conn = $this->db->getConnection();
        
        $sql = "CALL sp_liberar_componentes_cancelacion(?, ?, ?, @resultado, @exito)";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("sss", $idPlaca, $idCarcasa, $idUsuario); // Changed to "s" for UUID
        $stmt->execute();
        
        $result = $conn->query("SELECT @resultado as message, @exito as success");
        return $result->fetch_assoc();
    }

    public function asignarCarcasa($idComponente, $idUsuario) {
        $conn = $this->db->getConnection();
        $sql = "CALL sp_Asignar_Carcasa_Maquina(?, ?, @resultado, @exito)";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("ss", $idUsuario, $idComponente); // Changed to "s" for UUID
        $stmt->execute();
        
        $result = $conn->query("SELECT @resultado as message, @exito as success");
        return $result->fetch_assoc();
    }
}
?>