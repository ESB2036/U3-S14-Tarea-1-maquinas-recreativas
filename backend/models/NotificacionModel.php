<?php
require_once __DIR__ . '/../config/database.php';

class NotificacionModel {
    private $db;

    public function __construct() {
        $this->db = new Database();
    }

    public function crearNotificacion($idRemitente, $idDestinatario, $idMaquina, $tipo, $mensaje) {
        $conn = $this->db->getConnection();
        
        $sql = "CALL sp_crear_notificacion_maquina(?, ?, ?, ?, ?)";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("sssss", $idRemitente, $idDestinatario, $idMaquina, $tipo, $mensaje); // Changed from "iiiss" to "sssss"
        
        return $stmt->execute();
    }

    public function obtenerNotificacionesPorDestinatario($idDestinatario) {
        $conn = $this->db->getConnection();
        
        try {
            $sql = "CALL sp_obtener_notificaciones_por_destinatario(?)";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("s", $idDestinatario); // Changed from "i" to "s"
            $stmt->execute();
            
            $result = $stmt->get_result();
            $notificaciones = [];
            
            while ($row = $result->fetch_assoc()) {
                $notificaciones[] = $row;
            }
            
            return $notificaciones;
        } catch (Exception $e) {
            error_log("Error en obtenerNotificacionesPorDestinatario: " . $e->getMessage());
            return [];
        }
    }

    public function marcarComoLeida($idNotificacion) {
        $conn = $this->db->getConnection();
        
        $sql = "CALL sp_marcar_como_leida(?)";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("s", $idNotificacion); // Changed from "i" to "s"
        
        return $stmt->execute();
    }

    public function obtenerNoLeidas($idUsuario) {
        $conn = $this->db->getConnection();
        
        $sql = "CALL sp_obtener_no_leidas(?, @p_total)";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("s", $idUsuario); // Changed from "i" to "s"
        $stmt->execute();
        
        $result = $conn->query("SELECT @p_total as total");
        return $result->fetch_assoc()['total'];
    }

    public function crearNotificacionReporte($reporteId, $usuarioId, $mensaje) {
        $conn = $this->db->getConnection();
        
        $sql = "CALL sp_crear_notificacion_reporte(?, ?, ?)";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("sss", $reporteId, $usuarioId, $mensaje); // Changed from "iis" to "sss"
        
        return $stmt->execute();
    }

    public function obtenerNotificacionesPorUsuario($usuarioId) {
        $conn = $this->db->getConnection();
        
        $sql = "CALL sp_obtener_notificaciones_por_usuario(?)";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("s", $usuarioId); // Changed from "i" to "s"
        $stmt->execute();
        
        $result = $stmt->get_result();
        $notificaciones = [];
        
        while ($row = $result->fetch_assoc()) {
            $notificaciones[] = $row;
        }
        
        return $notificaciones;
    }

    public function marcarComoLeidaNotificacion($notificacionId, $usuarioId) {
        $conn = $this->db->getConnection();
        
        $sql = "CALL sp_marcar_como_leida_notificacion(?, ?)";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("ss", $notificacionId, $usuarioId); // Changed from "ii" to "ss"
        
        return $stmt->execute();
    }

    public function marcarTodasComoLeidas($usuarioId) {
        $conn = $this->db->getConnection();
        
        $sql = "CALL sp_marcar_todas_como_leidas(?)";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("s", $usuarioId); // Changed from "i" to "s"
        
        return $stmt->execute();
    }

    public function obtenerCantidadNoLeidas($usuarioId) {
        $conn = $this->db->getConnection();
        
        $sql = "CALL sp_obtener_cantidad_no_leidas(?, @p_cantidad)";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("s", $usuarioId); // Changed from "i" to "s"
        $stmt->execute();
        
        $result = $conn->query("SELECT @p_cantidad as cantidad");
        return $result->fetch_assoc()['cantidad'];
    }
}
?>