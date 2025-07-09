<?php
require_once __DIR__ . '/../services/ReporteService.php';
/**
 * Controlador responsable de recibir las solicitudes HTTP relacionadas con reportes y comunicarlas con ReporteService. Administra funciones como crear reportes, obtenerlos por ID o usuario, y actualizar su estado.
 */
class ReporteController {
    private $service;

    public function __construct() {
        $this->service = new ReporteService();
    }
    /**
    * Recibe datos en formato JSON desde el cliente para crear un reporte.
     * @throws \Exception
     * @return void
     */
    public function create() {
        try {
            $data = json_decode(file_get_contents('php://input'), true);
            if (json_last_error() !== JSON_ERROR_NONE) {
                throw new Exception('Datos JSON inválidos');
            }
            
            $response = $this->service->crearReporte($data);
            header('Content-Type: application/json');
            echo json_encode($response);
        } catch (Exception $e) {
            header('Content-Type: application/json');
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => $e->getMessage()
            ]);
        }
    }
    /**
     * Obtiene los mensajes del chat entre dos usuarios.
     * @param mixed $emisorId ID del remitente.
     * @param mixed $destinatarioId  ID del destinatario.
     * @return void
     */
    public function getChat($emisorId, $destinatarioId) {
        $response = $this->service->obtenerChat($emisorId, $destinatarioId);
        $this->sendResponse($response);
    }   
    /**
     * Obtiene todos los reportes relacionados con un usuario.
     * @param mixed $userId ID del usuario.
     * @return void
     */
    public function getByUser($userId) {
        $response = $this->service->obtenerReportesPorUsuario($userId);
        $this->sendResponse($response);
    }
    /**
     * Devuelve la información detallada de un reporte.
     * @param mixed $reporteId ID del reporte.
     * @return void
     */
    public function getById($reporteId) {
        $response = $this->service->obtenerReportePorId($reporteId);
        $this->sendResponse($response);
    }
    /**
     * Cambia el estado de un reporte (por ejemplo, de "Pendiente" a "Resuelto").
     * @param mixed $reporteId
     * @return void
     */
    public function updateStatus($reporteId) {
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($data['estado'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Estado no proporcionado']);
            return;
        }
        
        $response = $this->service->actualizarEstadoReporte($reporteId, $data['estado']);
        $this->sendResponse($response);
    }
    /**
     * Obtiene la lista de usuarios con los que el usuario actual ha chateado.
     * 
     */
    public function getChatUsers() {
        try {
            session_start();
            $userId = $_SESSION['ID_Usuario'] ?? null;
            
            if (!$userId) {
                throw new Exception('Usuario no autenticado');
            }
            
            $response = $this->service->obtenerUsuariosChat($userId);
            
            if (!isset($response['usuarios'])) {
                throw new Exception('Formato de respuesta incorrecto');
            }
            
            $this->sendResponse($response);
        } catch (Exception $e) {
            $this->sendError($e);
        }
    }

    /**
     * Similar al anterior, pero se recibe el ID del usuario como parámetro explícito.
     * @param mixed $userId
     * @return void
     */
    public function getUsuariosChat($userId) {
        $response = $this->service->obtenerUsuariosChat($userId);
        $this->sendResponse($response);
    }

    /**
     * Devuelve el chat completo entre dos usuarios, opcionalmente filtrado por reporte.
     * @param mixed $emisorId
     * @param mixed $destinatarioId
     * @param mixed $reporteId
     * @throws \Exception
     * @return void
     */
    public function getCompleteChat($emisorId, $destinatarioId, $reporteId = null) {
        try {
            session_start();
            $currentUserId = $_SESSION['ID_Usuario'] ?? null;
            
            if (!$currentUserId || ($currentUserId != $emisorId && $currentUserId != $destinatarioId)) {
                throw new Exception('No autorizado para ver este chat');
            }
            
            $response = $this->service->obtenerChatCompleto($emisorId, $destinatarioId, $reporteId);
            $this->sendResponse($response);
        } catch (Exception $e) {
            $this->sendError($e);
        }
    }
    /**
     * Métodos internos para formatear la respuesta como JSON.
     * @param mixed $response
     * @return void
     */
    private function sendResponse($response) {
        header('Content-Type: application/json');
        echo json_encode($response);
    }
    /**
     * Métodos internos para formatear el error como JSON.
     * @param Exception $e
     * @return void
     */
    private function sendError(Exception $e) {
        header('Content-Type: application/json');
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => $e->getMessage()
        ]);
    }
    public function buscarChatsPorEmail() {
        try {
            $data = json_decode(file_get_contents('php://input'), true);
            if (json_last_error() !== JSON_ERROR_NONE) {
                throw new Exception('Datos JSON inválidos');
            }
            
            if (!isset($data['email'])) {
                throw new Exception('Email no proporcionado');
            }
            
            $response = $this->service->buscarChatsPorEmail($data['email']);
            $this->sendResponse($response);
        } catch (Exception $e) {
            $this->sendError($e);
        }
    }
}
?>