<?php
require_once __DIR__ . '/../models/DistribucionModel.php';

class DistribucionController {
    private $model;

    public function __construct() {
        $this->model = new DistribucionModel();
    }

    public function obtenerInformesDistribucion() {
        try {
            $filters = [
                'fecha_inicio' => $_GET['fecha_inicio'] ?? null,
                'fecha_fin' => $_GET['fecha_fin'] ?? null,
                'ID_Maquina' => $_GET['ID_Maquina'] ?? null,
                'estado' => $_GET['estado'] ?? null,
                'ID_Comercio' => $_GET['ID_Comercio'] ?? null
            ];

            $informes = $this->model->obtenerInformesDistribucion($filters);
            
            echo json_encode([
                'success' => true,
                'informes' => $informes
            ]);
        } catch (Exception $e) {
            error_log("Error en obtenerInformesDistribucion: " . $e->getMessage());
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error al obtener informes de distribución',
                'error' => $e->getMessage()
            ]);
        }
    }
}
?>