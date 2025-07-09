<?php
require_once __DIR__ . '/../models/ComercioModel.php';

class ComercioService {
    private $model;

    public function __construct() {
        $this->model = new ComercioModel();
    }
    
    /**
     * Registra un nuevo comercio con validación de campos requeridos.
     * @param array $data Datos del comercio.
     * @return array Resultado de la operación.
     */
    public function registrarComercio($data) {
        $required = ['nombre', 'tipo', 'direccion', 'telefono'];
        
        foreach ($required as $field) {
            if (!isset($data[$field])) {
                return ['success' => false, 'message' => "El campo $field es requerido"];
            }
        }
        
        $idComercio = $this->model->registrarComercio(
            $data['nombre'],
            $data['tipo'],
            $data['direccion'],
            $data['telefono']
        );
        
        if ($idComercio) {
            return ['success' => true, 'idComercio' => $idComercio];
        } else {
            return ['success' => false, 'message' => 'Error al registrar comercio'];
        }
    }

    /**
     * Obtiene todos los comercios
     * @return array Lista de comercios
     */
    public function obtenerComercios() {
        $comercios = $this->model->obtenerComercios();
        return ['success' => true, 'comercios' => $comercios];
    }
}
?>