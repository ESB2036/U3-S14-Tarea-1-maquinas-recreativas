<?php
require_once __DIR__ . '/../models/ReporteModel.php';
require_once __DIR__ . '/../models/NotificacionModel.php';
require_once __DIR__ . '/../models/ComentarioModel.php';
/**
 * ReporteService intermediario entre el model y el controller
 */
class ReporteService {
    private $reporteModel;
    private $notificacionesModel;
    private $comentarioModel;

    public function __construct() {
        $this->reporteModel = new ReporteModel();
        $this->notificacionesModel = new NotificacionModel();
        $this->comentarioModel = new ComentarioModel();
    }
    /**
     * Crear reporte
     * @param mixed $data
     * @throws \Exception
     * @return array{message: string, reporteId: bool|int|string, success: bool}
     */
    public function crearReporte($data) {
        if (!isset($data['ID_Usuario_Emisor']) || !isset($data['ID_Usuario_Destinatario']) || !isset($data['descripcion'])) {
            throw new Exception('Datos incompletos para crear el reporte');
        }

        $reporteId = $this->reporteModel->crearReporte(
            $data['ID_Usuario_Emisor'],
            $data['ID_Usuario_Destinatario'],
            $data['descripcion']
        );

        if (!$reporteId) {
            throw new Exception('Error al crear el reporte');
        }

        $mensaje = "Tienes un nuevo reporte: " . substr($data['descripcion'], 0, 50) . "...";
        $this->notificacionesModel->crearNotificacionReporte($reporteId, $data['ID_Usuario_Destinatario'], $mensaje);

        return [
            'success' => true,
            'reporteId' => $reporteId,
            'message' => 'Reporte creado correctamente'
        ];
    }
    public function obtenerReportesPorUsuario($userId) {
        $reportes = $this->reporteModel->obtenerReportesPorUsuario($userId);
        return [
            'success' => true,
            'reportes' => $reportes
        ];
    }
    /**
     * Obtener reporte por Id
     * @param mixed $reporteId
     * @throws \Exception
     * @return array{reporte: array|bool, success: bool}
     */
    public function obtenerReportePorId($reporteId) {
        $reporte = $this->reporteModel->obtenerReportePorId($reporteId);
        
        if (!$reporte) {
            throw new Exception('Reporte no encontrado');
        }
        
        return [
            'success' => true,
            'reporte' => $reporte
        ];
    }
    /**
     * Obtener chat completo
     * @param mixed $emisorId
     * @param mixed $destinatarioId
     * @param mixed $reporteId
     * @return array{comentarios: array, message: string, reportes: array, success: bool|array{comentarios: array, reportes: array, success: bool}|array{message: string, success: bool}}
     */
    public function obtenerChatCompleto($emisorId, $destinatarioId, $reporteId = null) {
        try {
            $reportes = $this->reporteModel->obtenerChat($emisorId, $destinatarioId);
            
            if (empty($reportes)) {
                return [
                    'success' => true,
                    'reportes' => [],
                    'comentarios' => [],
                    'message' => 'No hay conversaciones entre estos usuarios'
                ];
            }
    
            if ($reporteId) {
                $comentarios = $this->comentarioModel->obtenerComentariosPorReporte($reporteId, $emisorId);
            } else {
                $comentarios = [];
                foreach ($reportes as $reporte) {
                    $comentariosReporte = $this->comentarioModel->obtenerComentariosPorReporte($reporte['ID_Reporte'], $emisorId);
                    $comentarios = array_merge($comentarios, $comentariosReporte);
                }
            }
            
            return [
                'success' => true,
                'reportes' => $reportes,
                'comentarios' => $comentarios
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'Error al obtener chat: ' . $e->getMessage()
            ];
        }
    }
    /**
     * Actualizar el estado de un reporte
     * @param mixed $reporteId
     * @param mixed $estado
     * @throws \Exception
     * @return array{message: string, success: bool}
     */
     public function actualizarEstadoReporte($reporteId, $estado) {
        $estadosPermitidos = ['Pendiente', 'En proceso', 'Resuelto'];
        
        if (!in_array($estado, $estadosPermitidos)) {
            throw new Exception('Estado no válido');
        }
    
        $reporte = $this->reporteModel->obtenerReportePorId($reporteId);
        if (!$reporte) {
            throw new Exception('Reporte no encontrado');
        }
    
        $result = $this->reporteModel->actualizarEstadoReporte($reporteId, $estado);
        
        if (!$result) {
            throw new Exception('Error al actualizar el estado');
        }
        
        $mensaje = "El estado del reporte #{$reporteId} ha cambiado a: {$estado}";
        $this->notificacionesModel->crearNotificacionReporte(
            $reporteId, 
            $reporte['ID_Usuario_Emisor'], 
            $mensaje
        );
        
        if ($reporte['ID_Usuario_Emisor'] != $reporte['ID_Usuario_Destinatario']) {
            $this->notificacionesModel->crearNotificacionReporte(
                $reporteId, 
                $reporte['ID_Usuario_Destinatario'], 
                $mensaje
            );
        }
        
        return [
            'success' => true,
            'message' => 'Estado actualizado correctamente'
        ];
    }
    /**
     * obtenerChat
     * @param mixed $emisorId
     * @param mixed $destinatarioId
     * @return array{reportes: array, success: bool}
     */
    public function obtenerChat($emisorId, $destinatarioId) {
        $reportes = $this->reporteModel->obtenerChat($emisorId, $destinatarioId);
        return [
            'success' => true,
            'reportes' => $reportes
        ];
    }
    /**
     * Obtener usuarios por chat
     */
    public function obtenerUsuariosChat($userId) {
        $usuarios = $this->reporteModel->obtenerUsuariosChat($userId);
        
        return [
            'success' => true,
            'usuarios' => $usuarios
        ];
    }
    public function buscarChatsPorEmail($email) {
        $chats = $this->reporteModel->buscarChatsPorEmail($email);
        
        return [
            'success' => !empty($chats),
            'chats' => $chats,
            'message' => empty($chats) ? 'No se encontraron chats para este email' : ''
        ];
    }
}
?>