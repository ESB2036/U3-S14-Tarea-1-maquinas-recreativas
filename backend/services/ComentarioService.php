<?php
require_once __DIR__ . '/../models/ComentarioModel.php';
require_once __DIR__ . '/../models/NotificacionModel.php';
require_once __DIR__ . '/../models/ReporteModel.php';
/**
 * Contiene la lógica de negocio relacionada con los comentarios. Se conecta con los modelos de comentario, notificación y reporte.
 */
class ComentarioService {
    private $comentarioModel;
    private $notificacionesModel;
    private $reporteModel;
    /**
     * Instancia los modelos necesarios.
     */
    public function __construct() {
        $this->comentarioModel = new ComentarioModel();
        $this->notificacionesModel = new NotificacionModel();
        $this->reporteModel = new ReporteModel();
    }
    /**
     * Valida y crea un comentario, asegurando que el usuario tenga permiso para hacerlo.
     * @param mixed $data
     * @return array{comentarioId: bool|int|string, success: bool|array{message: string, success: bool}}
     */
    public function crearComentario($data) {
        if (empty($data['ID_Reporte']) || empty($data['ID_Usuario_Emisor']) || empty($data['comentario'])) {
            return ['success' => false, 'message' => 'Datos incompletos'];
        }

        $reporte = $this->reporteModel->obtenerReportePorId($data['ID_Reporte']);
        
        if (!$reporte || 
            ($reporte['ID_Usuario_Emisor'] != $data['ID_Usuario_Emisor'] && 
            $reporte['ID_Usuario_Destinatario'] != $data['ID_Usuario_Emisor'])) {
            return ['success' => false, 'message' => 'No autorizado'];
        }

        $comentarioId = $this->comentarioModel->crearComentario(
            $data['ID_Reporte'],
            $data['ID_Usuario_Emisor'],
            $data['comentario']
        );

        if (!$comentarioId) {
            return ['success' => false, 'message' => 'Error al crear el comentario'];
        }

        $destinatarioId = ($reporte['ID_Usuario_Emisor'] == $data['ID_Usuario_Emisor']) 
                        ? $reporte['ID_Usuario_Destinatario'] 
                        : $reporte['ID_Usuario_Emisor'];

        $mensaje = "Nuevo comentario en el reporte #" . $data['ID_Reporte'] . ": " . substr($data['comentario'], 0, 50) . "...";
        $this->notificacionesModel->crearNotificacionReporte($data['ID_Reporte'], $destinatarioId, $mensaje);
        return ['success' => true, 'comentarioId' => $comentarioId];
    }

    /**
     * ObtenerComentariosPorReporte
     * @param mixed $reporteId
     * @param mixed $userId
     * @return array{data: array, success: bool|array{message: string, success: bool}}
     */
    public function obtenerComentariosPorReporte($reporteId, $userId) {
        $reporte = $this->reporteModel->obtenerReportePorId($reporteId);

        if (!$reporte || 
            ($reporte['ID_Usuario_Emisor'] != $userId && 
            $reporte['ID_Usuario_Destinatario'] != $userId)) {
            return ['success' => false, 'message' => 'No autorizado'];
        }

        $comentarios = $this->comentarioModel->obtenerComentariosPorReporte($reporteId, $userId);

        if ($comentarios === false) {
            return ['success' => false, 'message' => 'Error al obtener comentarios'];
        }

        return ['success' => true, 'data' => $comentarios];
    }

    /**
     * Obtener todos los comentarios hechos en el chat
     */
    public function obtenerComentariosPorChat($emisorId, $destinatarioId) {
        $comentarios = $this->comentarioModel->obtenerComentariosPorChat($emisorId, $destinatarioId);
        
        return ['success' => true, 'comentarios' => $comentarios];
    }
}
?>