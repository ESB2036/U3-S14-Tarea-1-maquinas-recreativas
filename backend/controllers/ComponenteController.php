<?php
require_once __DIR__ . '/../services/ComponenteService.php';

class ComponenteController {
    private $service;

    public function __construct() {
        $this->service = new ComponenteService();
    }

    public function obtenerComponentes($tipo = null) {
        try {
            $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
            $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
            $offset = ($page - 1) * $limit;
            
            $result = $this->service->obtenerComponentes($tipo, $limit, $offset);
            echo json_encode($result);
        } catch (Exception $e) {
            error_log("Error en obtenerComponentes: " . $e->getMessage());
            echo json_encode([
                'success' => false,
                'message' => 'Error al obtener componentes'
            ]);
        }
    }

    public function obtenerComponentesDisponibles($tipo = null) {
        try {
            $result = $this->service->obtenerComponentesDisponibles($tipo);
            echo json_encode($result);
        } catch (Exception $e) {
            error_log("Error en obtenerComponentesDisponibles: " . $e->getMessage());
            echo json_encode([
                'success' => false,
                'message' => 'Error al obtener componentes disponibles'
            ]);
        }
    }

    public function usarComponente() {
        $data = json_decode(file_get_contents('php://input'), true);
        if (!isset($data['ID_Componente']) || !isset($data['ID_Usuario']) || !isset($data['ID_Maquina'])) {
            header('Content-Type: application/json');
            echo json_encode(['success' => false, 'message' => 'Datos incompletos']);
            return;
        }

        try {
            $result = $this->service->usarComponente(
                $data['ID_Componente'], 
                $data['ID_Usuario'],
                $data['ID_Maquina'] ?? null
            );
            
            if (!$result['success']) {
                http_response_code(400);
            }
            
            header('Content-Type: application/json');
            echo json_encode($result);
        } catch (Exception $e) {
            error_log("Error en usarComponente: " . $e->getMessage());
            header('Content-Type: application/json');
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error interno del servidor: ' . $e->getMessage()
            ]);
        }
    }

    public function liberarComponente() {
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($data['ID_Componente']) || !isset($data['ID_Usuario'])) {
            header('Content-Type: application/json');
            echo json_encode(['success' => false, 'message' => 'Datos incompletos']);
            return;
        }

        try {
            $result = $this->service->liberarComponente($data['ID_Componente'], $data['ID_Usuario']);
            
            header('Content-Type: application/json');
            if ($result['success']) {
                echo json_encode([
                    'success' => true,
                    'message' => $result['message'],
                    'idComponente' => $data['ID_Componente']
                ]);
            } else {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => $result['message']
                ]);
            }
        } catch (Exception $e) {
            error_log("Error en liberarComponente: " . $e->getMessage());
            header('Content-Type: application/json');
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error interno al liberar componente: ' . $e->getMessage()
            ]);
        }
    }

    public function obtenerComponentesEnUso($idUsuario) {
        try {
            $idMaquina = $_GET['id_maquina'] ?? null;
            $result = $this->service->obtenerComponentesEnUso($idUsuario, $idMaquina);
            
            header('Content-Type: application/json');
            echo json_encode([
                'success' => $result['success'],
                'componentes' => $result['componentes'],
                'message' => $result['message'] ?? null
            ]);
        } catch (Exception $e) {
            error_log("Error en obtenerComponentesEnUso: " . $e->getMessage());
            header('Content-Type: application/json');
            echo json_encode([
                'success' => false,
                'message' => 'Error al obtener componentes en uso',
                'componentes' => []
            ]);
        }
    }

    public function asignarCarcasa() {
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($data['ID_Componente']) || !isset($data['ID_Usuario'])) {
            header('Content-Type: application/json');
            echo json_encode(['success' => false, 'message' => 'Datos incompletos']);
            return;
        }

        try {
            $result = $this->service->asignarCarcasa(
                $data['ID_Componente'],
                $data['ID_Usuario']
            );
            
            header('Content-Type: application/json');
            echo json_encode($result);
        } catch (Exception $e) {
            error_log("Error en asignarCarcasa: " . $e->getMessage());
            header('Content-Type: application/json');
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => $e->getMessage()
            ]);
        }
    }

    public function liberarComponentesCancelacion() {
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($data['ID_Placa']) || !isset($data['ID_Carcasa']) || !isset($data['ID_Usuario'])) {
            header('Content-Type: application/json');
            echo json_encode(['success' => false, 'message' => 'Datos incompletos']);
            return;
        }

        try {
            $result = $this->service->liberarComponentesCancelacion(
                $data['ID_Placa'],
                $data['ID_Carcasa'],
                $data['ID_Usuario']
            );
            
            header('Content-Type: application/json');
            echo json_encode($result);
        } catch (Exception $e) {
            error_log("Error en liberarComponentesCancelacion: " . $e->getMessage());
            header('Content-Type: application/json');
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => $e->getMessage()
            ]);
        }
    }
}
?>