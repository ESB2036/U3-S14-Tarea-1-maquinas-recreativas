<?php
require_once __DIR__ . '/../services/AdministradorService.php';

class AdministradorController {
    private $service;

    public function __construct() {
        $this->service = new AdministradorService();
    }

    public function getUser($id) {
        try {
            $usuario = $this->service->obtenerUsuario($id);
            $this->sendResponse(['success' => true, 'usuario' => $usuario]);
        } catch (Exception $e) {
            $this->sendResponse(['success' => false, 'message' => $e->getMessage()], 400);
        }
    }

    public function getAllUsers($filters = []) {
        try {
            $usuarios = $this->service->obtenerTodosUsuarios($filters);
            $this->sendResponse(['success' => true, 'usuarios' => $usuarios]);
        } catch (Exception $e) {
            $this->sendResponse(['success' => false, 'message' => $e->getMessage()], 400);
        }
    }

    public function updateUser($id, $data) {
        try {
            $data['ID_Usuario'] = $id;
            $result = $this->service->actualizarUsuario($data);
            $this->sendResponse($result);
        } catch (Exception $e) {
            $this->sendResponse(['success' => false, 'message' => $e->getMessage()], 400);
        }
    }

    public function partialUpdateUser($id, $data) {
        try {
            $data['ID_Usuario'] = $id;
            $result = $this->service->actualizarParcialUsuario($data);
            $this->sendResponse($result);
        } catch (Exception $e) {
            $this->sendResponse(['success' => false, 'message' => $e->getMessage()], 400);
        }
    }

    public function registerAdmin($data) {
        try {
            $result = $this->service->registrarUsuarioAdmin($data);
            $this->sendResponse($result);
        } catch (Exception $e) {
            $this->sendResponse(['success' => false, 'message' => $e->getMessage()], 400);
        }
    }

    public function deleteUser($id) {
        try {
            $result = $this->service->eliminarUsuario($id);
            $this->sendResponse($result);
        } catch (Exception $e) {
            error_log("Error al eliminar usuario: " . $e->getMessage());
            $this->sendResponse([
                'success' => false, 
                'message' => $e->getMessage()
            ], 500);
        }
    }

public function obtenerHistorialActividades($usuarioId) {
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
    
    // Verificar si el usuario es administrador
    if ($_SESSION['rol'] === 'Administrador') {
        $historial = $this->service->obtenerHistorialActividades($usuarioId);
        $this->sendResponse([
            'success' => true,
            'historial' => $historial
        ]);
    } else {
        // Para usuarios no administradores, validar que solo vean su propio historial
        if (!isset($_SESSION['ID_Usuario']) || $_SESSION['ID_Usuario'] != $usuarioId) {
            $this->sendResponse(['success' => false, 'message' => 'No autorizado'], 403);
            return;
        }
        
        $historial = $this->service->obtenerHistorialActividades($usuarioId);
        $this->sendResponse([
            'success' => true,
            'historial' => $historial
        ]);
    }
}


    private function sendResponse($response, $statusCode = 200) {
        http_response_code($statusCode);
        header('Content-Type: application/json');
        echo json_encode($response);
    }
}
?>