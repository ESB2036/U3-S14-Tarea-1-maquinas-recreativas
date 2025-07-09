<?php
require_once __DIR__ . '/../services/ComentarioService.php';
/**
 * Es el controlador que maneja las peticiones HTTP relacionadas con los comentarios. Usa ComentarioService para realizar operaciones y devuelve respuestas en formato JSON.
 */
class ComentarioController {
    private $service;
    /**
     * Crea una instancia del servicio de comentarios.
     */
    public function __construct() {
        $this->service = new ComentarioService();
    }
    /**
     * Crea un nuevo comentario desde una solicitud JSON.
     * Parámetro (interno): $data extraído de php://input.
     * @return void 
     */
 public function create() {
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (empty($data['ID_Reporte']) || empty($data['comentario'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Datos incompletos']);
            return;
        }

        session_start();
        $data['ID_Usuario_Emisor'] = $_SESSION['ID_Usuario'] ?? null;
        
        if (!$data['ID_Usuario_Emisor']) {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'No autorizado']);
            return;
        }

        $response = $this->service->crearComentario($data);
        $this->sendResponse($response);
    }
    /**
     * Obtiene comentarios asociados a un reporte si el usuario tiene permiso.
     * @param mixed $reporteId - ID del reporte.
     * @return void
     */
    public function getByReporte($reporteId) {
        session_start();
        $userId = $_SESSION['ID_Usuario'] ?? null;
        
        if (!$userId) {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'No autorizado']);
            return;
        }

        $response = $this->service->obtenerComentariosPorReporte($reporteId, $userId);
        $this->sendResponse($response);
    }
    /**
     * Envía una respuesta en formato JSON al cliente.
     * @param mixed $response
     * @return void
     */
    private function sendResponse($response) {
        header('Content-Type: application/json');
        echo json_encode($response);
    }
}
?>