<?php
require_once __DIR__ . '/../services/UsuarioService.php';

class UsuarioController {
    private $service;

    public function __construct() {
        $this->service = new UsuarioService();
    }

    public function register() {
        $data = json_decode(file_get_contents('php://input'), true);
        $response = $this->service->registrarUsuario($data);
        $this->sendResponse($response);
    }

    public function login() {
    try {
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($data['usuario_asignado']) || !isset($data['contrasena'])) {
            $this->sendResponse(['success' => false, 'message' => 'Usuario y contraseña son requeridos']);
            return;
        }
        
        $response = $this->service->login($data['usuario_asignado'], $data['contrasena']);
        
        if ($response['success']) {
            // Asegurarse de incluir el ID_Usuario en la respuesta
            $response['usuario']['uuid'] = $response['usuario']['ID_Usuario'];
            session_start();
            session_regenerate_id(true);
            
            $_SESSION['ID_Usuario'] = $response['usuario']['ID_Usuario'];
            $_SESSION['usuario_asignado'] = $response['usuario']['usuario_asignado'];
            $_SESSION['rol'] = $response['usuario']['tipo'];
        }
        
        $this->sendResponse($response);
    } catch (Exception $e) {
        error_log("ERROR LOGIN: " . $e->getMessage());
        $this->sendResponse([
            'success' => false,
            'message' => 'Error interno del servidor'
        ]);
    }
}
    public function logout() {
        try {
            if (session_status() === PHP_SESSION_NONE) {
                session_start();
            }
            
            $response = ['success' => false, 'message' => 'No hay sesión activa'];
            
            if (isset($_SESSION['ID_Usuario'])) {
                $userId = $_SESSION['ID_Usuario'];
                
                $response = $this->service->logout($userId);
                
                $_SESSION = array();
                
                if (ini_get("session.use_cookies")) {
                    $params = session_get_cookie_params();
                    setcookie(
                        session_name(), 
                        '', 
                        time() - 42000,
                        $params["path"], 
                        $params["domain"],
                        $params["secure"], 
                        $params["httponly"]
                    );
                }
                
                session_destroy();
            }
            
            $this->sendResponse($response);
        } catch (Exception $e) {
            error_log("ERROR LOGOUT: " . $e->getMessage());
            $this->sendResponse([
                'success' => false,
                'message' => 'Error al cerrar sesión'
            ]);
        }
    }

    public function obtenerTecnicos($especialidad) {
        $response = $this->service->obtenerTecnicosPorEspecialidad($especialidad);
        $this->sendResponse($response);
    }

    public function getProfile($id = null) {
        try {
            if ($id === null && isset($_GET['id'])) {
                $id = $_GET['id'];
            }
            
            if (!$id) {
                $this->sendResponse(['success' => false, 'message' => 'ID de usuario no proporcionado']);
                return;
            }
            session_start();
            if (!isset($_SESSION['ID_Usuario'])) {
                $this->sendResponse(['success' => false, 'message' => 'No autorizado']);
                return;
            }

            // Permitir si es su propio perfil o si es Contabilidad
            if ($_SESSION['ID_Usuario'] != $id) {
                // Aquí puedes usar el modelo para comprobar el tipo
$tipo = $_SESSION['rol'] ?? null;
                if ($tipo !== 'Contabilidad') {
                    $this->sendResponse(['success' => false, 'message' => 'No autorizado']);
                    return;
                }
            }
            
            $response = $this->service->obtenerUsuario($id);
            
            if ($response['success']) {
                $response['usuario']['ID_Usuario'] = $id;
                unset($response['usuario']['contrasena']);
            }
            
            $this->sendResponse($response);
        } catch (Exception $e) {
            error_log("Error en getProfile: " . $e->getMessage());
            $this->sendResponse(['success' => false, 'message' => 'Error al obtener perfil']);
        }
    }

public function updateProfile() {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!$data || !isset($data['id'])) {
        $this->sendResponse(['success' => false, 'message' => 'Datos inválidos']);
        return;
    }
    
    session_start();
    if (!isset($_SESSION['ID_Usuario']) || $_SESSION['ID_Usuario'] != $data['id']) {
        $this->sendResponse(['success' => false, 'message' => 'No autorizado']);
        return;
    }
    
    // Validar UUID
    if (!preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $data['id'])) {
        $this->sendResponse(['success' => false, 'message' => 'ID de usuario no válido']);
        return;
    }

    $response = $this->service->actualizarPerfil($data);
    $this->sendResponse($response);
}

    public function updateUsername() {
        $data = json_decode(file_get_contents('php://input'), true);
        error_log(print_r($data, true));
        $response = $this->service->actualizarUsuarioAsignado($data);
        $this->sendResponse($response);
    }

    public function resetPassword() {
        $data = json_decode(file_get_contents('php://input'), true);
        $response = $this->service->recuperarContrasena($data);
        $this->sendResponse($response);
    }

    public function getTecnicos($especialidad) {
        $response = $this->service->obtenerTecnicosPorEspecialidad($especialidad);
        $this->sendResponse($response);
    }

    public function getByTipo($tipo) {
        $emisorId = isset($_GET['emisorId']) ? $_GET['emisorId'] : null;
    
        if (!$tipo) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Tipo de usuario requerido']);
            return;
        }
    
        $model = new UsuarioModel();
        $usuarios = $model->obtenerUsuariosPorTipo($tipo, $emisorId);
    
        echo json_encode(['success' => true, 'usuarios' => $usuarios]);
    }

    public function registrarActividad() {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        if (!isset($_SESSION['ID_Usuario'])) {
            $this->sendResponse(['success' => false, 'message' => 'No autorizado']);
            return;
        }
    
        $data = json_decode(file_get_contents('php://input'), true);
        $descripcion = $data['descripcion'] ?? 'Actividad no especificada';
    
        $response = $this->service->registrarActividad($_SESSION['ID_Usuario'], $descripcion);
        $this->sendResponse($response);
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
public function buscarPorEmail() {
    $data = json_decode(file_get_contents('php://input'), true);
    if (!isset($data['email'])) {
        $this->sendResponse(['success' => false, 'message' => 'Correo requerido']);
        return;
    }
    $response = $this->service->buscarPorEmail($data['email']);
    $this->sendResponse($response);
}

    private function sendResponse($response, $statusCode = 200) {
        http_response_code($statusCode);
        header('Content-Type: application/json');
        echo json_encode($response);
    }
}
?>