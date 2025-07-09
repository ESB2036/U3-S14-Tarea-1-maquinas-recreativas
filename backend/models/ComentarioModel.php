<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helper/CifradoHelper.php';

class ComentarioModel {
    private $db;

    public function __construct() {
        $this->db = new Database();
    }

    public function crearComentario($reporteId, $emisorId, $comentario) {
        $conn = $this->db->getConnection();
        
        $sql = "CALL sp_crear_comentario(?, ?, ?, @id_comentario)";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("sss", $reporteId, $emisorId, $comentario);
        
        if ($stmt->execute()) {
            $result = $conn->query("SELECT @id_comentario AS id");
            $row = $result->fetch_assoc();
            return $row['id'];
        }
        
        return false;
    }

    public function obtenerComentariosPorReporte($reporteId, $userId) {
        $conn = $this->db->getConnection();
        
        $sql = "CALL sp_obtener_comentarios_por_reporte(?, ?)";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("ss", $reporteId, $userId);
        $stmt->execute();
        
        $result = $stmt->get_result();
        $comentarios = [];
        
        while ($row = $result->fetch_assoc()) {
            // Decrypt email if it exists
            if (isset($row['email'])) {
                $row['email'] = CifradoHelper::desencriptar($row['email']);
            }
            $comentarios[] = $row;
        }
        
        return $comentarios;
    }

    public function obtenerComentariosPorChat($emisorId, $destinatarioId) {
        $conn = $this->db->getConnection();
        
        $sql = "CALL sp_obtener_comentarios_por_chat(?, ?)";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("ss", $emisorId, $destinatarioId);
        $stmt->execute();
        
        $result = $stmt->get_result();
        $comentarios = [];
        
        while ($row = $result->fetch_assoc()) {
            // Decrypt email if it exists
            if (isset($row['email'])) {
                $row['email'] = CifradoHelper::desencriptar($row['email']);
            }
            $comentarios[] = $row;
        }
        
        return $comentarios;
    }
}
?>