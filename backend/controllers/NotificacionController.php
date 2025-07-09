<?php
require_once __DIR__ . '/../services/NotificacionService.php';
/**
 * Controlador que expone puntos de acceso HTTP para gestionar notificaciones. Valida solicitudes y se comunica con NotificacionService.
 */
class NotificacionController {
    private $service;

    public function __construct() {
        $this->service = new NotificacionService();
    }
    
    /**
     * Obtiene notificaciones por usuario.
     * @param int $idUsuario ID del usuario destinatario.
     */
    public function obtenerPorUsuario($idUsuario) {
        $response = $this->service->obtenerNotificaciones($idUsuario);
        $this->sendResponse($response);
    }

    /**
     * Crea una nueva notificación.
     * Valida todos los campos requeridos para una notificación.
     */
  public function create() {
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($data['idRemitente']) || !isset($data['idDestinatario']) || 
            !isset($data['idMaquina']) || !isset($data['tipo']) || !isset($data['mensaje'])) {
            $this->sendResponse(['success' => false, 'message' => 'Datos incompletos']);
            return;
        }
        
        $response = $this->service->crearNotificacion(
            $data['idRemitente'],
            $data['idDestinatario'],
            $data['idMaquina'],
            $data['tipo'],
            $data['mensaje']
        );
        $this->sendResponse($response);
    }
    /**
     * Marca una notificación como leída.
     * @return void
     */
    public function marcarComoLeida() {
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($data['idNotificacion'])) {
            $this->sendResponse(['success' => false, 'message' => 'ID de notificación requerido']);
            return;
        }
        
        $response = $this->service->marcarComoLeida($data['idNotificacion']);
        $this->sendResponse($response);
    }


    /**
     * Retorna las notificaciones no leídas de un usuario.
     * @param mixed $idUsuario
     * @return void
     */
    public function obtenerNoLeidas($idUsuario) {
        $response = $this->service->obtenerNoLeidas($idUsuario);
        $this->sendResponse($response);
    }
    /**
    * Retorna notificaciones solo si el usuario de sesión coincide con $userId.   
    */

    public function getByUser($userId) {
        session_start();
        if ($_SESSION['ID_Usuario'] != $userId) {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'No autorizado']);
            return;
        }

        $response = $this->service->obtenerNotificacionesPorUsuario($userId);
        $this->sendResponse($response);
    }
    /**
     * Obtiene todas las notificaciones de un usuario.
     * @param mixed $userId
     * @return void
     */
    public function getNotificaciones($userId) {
        try {
            $response = $this->service->obtenerNotificacionesPorUsuario($userId);
            
            if (empty($response['notificaciones'])) {
                echo json_encode(['success' => true, 'notificaciones' => []]);
                return;
            }
            
            header('Content-Type: application/json');
            echo json_encode($response);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }
    /**
     * Marca como leída una notificación específica, verificando al usuario autenticado.
     * @param mixed $notificacionId
     * @throws \Exception
     * @return void
     */

    public function marcarComoLeidaNotificacion($notificacionId) {
        try {
            session_start();
            $userId = $_SESSION['ID_Usuario'] ?? null;
            
            if (!$userId) {
                throw new Exception('No autorizado');
            }

            $response = $this->service->marcarComoLeidaNotificacion($notificacionId, $userId);
            header('Content-Type: application/json');
            echo json_encode($response);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }
    /**
     * Marca todas las notificaciones del usuario autenticado como leídas.
     * @throws \Exception
     * @return void
     */
    public function marcarTodasComoLeidas() {
        try {
            session_start();
            $userId = $_SESSION['ID_Usuario'] ?? null;
            
            if (!$userId) {
                throw new Exception('No autorizado');
            }

            $response = $this->service->marcarTodasComoLeidas($userId);
            header('Content-Type: application/json');
            echo json_encode($response);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    /**
     * Devuelve el número de notificaciones no leídas de un usuario autenticado.
     * @param mixed $userId
     * @return void
     */
    public function getUnreadCount($userId) {
        session_start();
        if ($_SESSION['ID_Usuario'] != $userId) {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'No autorizado']);
            return;
        }

        $response = $this->service->obtenerCantidadNoLeidas($userId);
        $this->sendResponse($response);
    }
    /**
     * Método privado para enviar respuestas en formato JSON.
     * @param mixed $response
     * @return void
     */
    private function sendResponse($response) {
        header('Content-Type: application/json');
        echo json_encode($response);
    }
}
?>