<?php
require_once __DIR__ . '/../services/InformeService.php';

class InformeController {
    private $service;

    public function __construct() {
        $this->service = new InformeService();
    }

    public function registrarRecaudacion() {
        session_start();
        
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            http_response_code(405);
            echo json_encode(['success' => false, 'message' => 'Método no permitido']);
            return;
        }

        if (!isset($_SESSION['ID_Usuario'])) {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'No autorizado - Debe iniciar sesión']);
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Datos JSON inválidos']);
            return;
        }
        
        $requiredFields = ['ID_Maquina', 'Tipo_Comercio', 'Monto_Total', 'fecha'];
        foreach ($requiredFields as $field) {
            if (!isset($data[$field]) || empty($data[$field])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => "El campo $field es requerido"]);
                return;
            }
        }

        $data['ID_Usuario'] = $_SESSION['ID_Usuario'];

        $response = $this->service->registrarRecaudacion($data);
        $this->sendResponse($response);
    }

    public function obtenerRecaudaciones() {
        $filters = [
            'fecha_inicio' => $_GET['fecha_inicio'] ?? null,
            'fecha_fin' => $_GET['fecha_fin'] ?? null,
            'ID_Maquina' => $_GET['ID_Maquina'] ?? null,
            'Tipo_Comercio' => $_GET['Tipo_Comercio'] ?? null
        ];

        $response = $this->service->obtenerRecaudaciones($filters);
        $this->sendResponse($response);
    }

    public function obtenerResumenRecaudaciones($limit) {
        if (!is_numeric($limit) ) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'El parámetro limit debe ser numérico']);
            return;
        }
        
        $limit = (int)$limit;
        if ($limit <= 0) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'El parámetro limit debe ser mayor que 0']);
            return;
        }

        $response = $this->service->obtenerResumenRecaudacionesLimitado($limit);
        $this->sendResponse($response);
    }

    public function actualizarRecaudacion() {
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($data['ID_Recaudacion']) || empty($data['ID_Recaudacion'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => "ID de recaudación es requerido"]);
            return;
        }

        $response = $this->service->actualizarRecaudacion($data);
        $this->sendResponse($response);
    }

    public function eliminarRecaudacion($id) {
        if (empty($id)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => "ID de recaudación es requerido"]);
            return;
        }

        $response = $this->service->eliminarRecaudacion($id);
        $this->sendResponse($response);
    }

    public function obtenerMaquinasRecaudacion() {
        $response = $this->service->obtenerMaquinasRecaudacion();
        $this->sendResponse($response);
    }

    public function obtenerMaquinasOperativasPorComercio() {
        if (!isset($_GET['ID_Comercio'])) {
            $this->sendResponse(['success' => false, 'message' => 'ID_Comercio es requerido']);
            return;
        }
        
        $id_comercio = $_GET['ID_Comercio'];
        
if (empty($id_comercio) || strlen($id_comercio) != 36) {
    $this->sendResponse(['success' => false, 'message' => 'ID_Comercio inválido']);
    return;
}
        
        $response = $this->service->obtenerMaquinasOperativasPorComercio($id_comercio);
        $this->sendResponse($response);
    }

    public function guardarInforme() {
        session_start();
        
        if (!isset($_SESSION['ID_Usuario'])) {
            $this->sendResponse(['success' => false, 'message' => 'No autorizado']);
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            $this->sendResponse(['success' => false, 'message' => 'Datos JSON inválidos']);
            return;
        }

        $requiredFields = [
            'ID_Recaudacion', 
            'CI_Usuario', 
            'Nombre_Maquina', 
            'ID_Comercio',
            'Nombre_Comercio', 
            'Direccion_Comercio', 
            'Telefono_Comercio',
            'Monto_Total'
        ];
        
        foreach ($requiredFields as $field) {
            if (!isset($data[$field]) || empty($data[$field])) {
                $this->sendResponse(['success' => false, 'message' => "El campo $field es requerido"]);
                return;
            }
        }

        $data['Pago_Ensamblador'] = 400.00;
        $data['Pago_Comprobador'] = 400.00;
        $data['Pago_Mantenimiento'] = isset($data['Pago_Mantenimiento']) ? 400.00 : 0.00;
        $data['empresa_nombre'] = 'Recrea Sys S.A.';
        $data['empresa_descripcion'] = 'Una empresa encargada en el ciclo de vida de las maquinas recreativas';

        $response = $this->service->guardarInforme($data);
        $this->sendResponse($response);
    }

    public function obtenerInformePorRecaudacion($idRecaudacion) {
        $response = $this->service->obtenerInformePorRecaudacion($idRecaudacion);
        $this->sendResponse($response);
    }
    public function obtenerRecaudacion($idRecaudacion) {
        try {
            $response = $this->service->obtenerRecaudacion($idRecaudacion);
            $this->sendResponse($response);
        } catch (Exception $e) {
            $this->sendResponse([
                'success' => false,
                'message' => 'Error al obtener recaudación: ' . $e->getMessage()
            ]);
        }
    }

    public function obtenerMaquinaRecaudacion() {
        try {
            $idMaquina = $_GET['ID_Maquina'] ?? null;
            if (!$idMaquina) {
                $this->sendResponse(['success' => false, 'message' => 'ID_Maquina es requerido']);
                return;
            }

            $response = $this->service->obtenerMaquinaRecaudacion($idMaquina);
            $this->sendResponse($response);
        } catch (Exception $e) {
            $this->sendResponse([
                'success' => false,
                'message' => 'Error al obtener máquina: ' . $e->getMessage()
            ]);
        }
    }

public function obtenerComercioRecaudacion($idComercio) {
    try {
        $response = $this->service->obtenerComercioRecaudacion($idComercio);
        $this->sendResponse($response);
    } catch (Exception $e) {
        $this->sendResponse([
            'success' => false,
            'message' => 'Error al obtener comercio: ' . $e->getMessage()
        ]);
    }
}
    private function sendResponse($response) {
        header('Content-Type: application/json');
        echo json_encode($response);
    }
}
?>