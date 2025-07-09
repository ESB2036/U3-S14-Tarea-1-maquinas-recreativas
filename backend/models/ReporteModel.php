<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helper/CifradoHelper.php';

class ReporteModel {
    private $db;

    public function __construct() {
        $this->db = new Database();
    }

    public function crearReporte($emisorId, $destinatarioId, $descripcion) {
        $conn = $this->db->getConnection();
        
        $sql = "CALL sp_crear_reporte(?, ?, ?, @p_id_reporte)";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("sss", $emisorId, $destinatarioId, $descripcion);
        
        if ($stmt->execute()) {
            $result = $conn->query("SELECT @p_id_reporte as id");
            $row = $result->fetch_assoc();
            return $row['id'];
        }
        
        return false;
    }

    public function obtenerReportesPorUsuario($userId) {
        $conn = $this->db->getConnection();
        
        $sql = "CALL sp_obtener_reportes_por_usuario(?)";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("s", $userId);
        $stmt->execute();
        
        $result = $stmt->get_result();
        $reportes = [];
        
        while ($row = $result->fetch_assoc()) {
            // Decrypt emails if they exist
            if (isset($row['emisor_email'])) {
                $row['emisor_email'] = CifradoHelper::desencriptar($row['emisor_email']);
            }
            if (isset($row['destinatario_email'])) {
                $row['destinatario_email'] = CifradoHelper::desencriptar($row['destinatario_email']);
            }
            $reportes[] = $row;
        }
        
        return $reportes;
    }

    public function obtenerReportePorId($reporteId) {
        $conn = $this->db->getConnection();
        
        $sql = "CALL sp_obtener_reporte_por_id(?)";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("s", $reporteId);
        $stmt->execute();
        
        $result = $stmt->get_result();
        $reporte = $result->fetch_assoc();
        
        if ($reporte) {
            // Decrypt emails if they exist
            if (isset($reporte['emisor_email'])) {
                $reporte['emisor_email'] = CifradoHelper::desencriptar($reporte['emisor_email']);
            }
            if (isset($reporte['destinatario_email'])) {
                $reporte['destinatario_email'] = CifradoHelper::desencriptar($reporte['destinatario_email']);
            }
        }
        
        return $reporte;
    }

    public function actualizarEstadoReporte($reporteId, $estado) {
        $conn = $this->db->getConnection();
        
        $sql = "CALL sp_actualizar_estado_reporte(?, ?)";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("ss", $reporteId, $estado);
        
        return $stmt->execute();
    }

    public function obtenerChat($emisorId, $destinatarioId) {
        $conn = $this->db->getConnection();
        
        $sql = "CALL sp_obtener_chat(?, ?)";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("ss", $emisorId, $destinatarioId);
        $stmt->execute();
        
        $result = $stmt->get_result();
        $reportes = [];
        
        while ($row = $result->fetch_assoc()) {
            // Decrypt emails if they exist
            if (isset($row['emisor_email'])) {
                $row['emisor_email'] = CifradoHelper::desencriptar($row['emisor_email']);
            }
            if (isset($row['destinatario_email'])) {
                $row['destinatario_email'] = CifradoHelper::desencriptar($row['destinatario_email']);
            }
            $reportes[] = $row;
        }
        
        return $reportes;
    }

    public function obtenerUsuariosChat($userId) {
        $conn = $this->db->getConnection();
        
        $sql = "CALL sp_obtener_usuarios_chat(?)";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("s", $userId);
        $stmt->execute();
        
        $result = $stmt->get_result();
        $usuarios = [];
        
        while ($row = $result->fetch_assoc()) {
            // Decrypt email if it exists
            if (isset($row['email'])) {
                $row['email'] = CifradoHelper::desencriptar($row['email']);
            }
            $usuarios[] = $row;
        }
        
        return $usuarios;
    }
    public function buscarChatsPorEmail($email) {
        $conn = $this->db->getConnection();
        
        $sql = "CALL sp_buscar_chats_por_email(?)";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("s", $email);
        $stmt->execute();
        
        $result = $stmt->get_result();
        $chats = [];
        
        while ($row = $result->fetch_assoc()) {
            $chats[] = $row;
        }
        
        return $chats;
    }
}
?>