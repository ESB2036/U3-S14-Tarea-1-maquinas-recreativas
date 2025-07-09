<?php
require_once __DIR__ . '/../models/ComponenteModel.php';

class ComponenteService {
    private $model;

    public function __construct() {
        $this->model = new ComponenteModel();
    }

    public function obtenerComponentes($tipo = null, $limit = 10, $offset = 0) {
        try {
            $result = $this->model->obtenerComponentes($tipo, $limit, $offset);
            return [
                'success' => true,
                'componentes' => $result['componentes'],
                'total' => $result['total']
            ];
        } catch (Exception $e) {
            error_log("Error en obtenerComponentes: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Error al obtener componentes'
            ];
        }
    }

    public function obtenerComponentesDisponibles($tipo = null) {
        try {
            $componentes = $this->model->obtenerComponentesDisponibles($tipo);
            return [
                'success' => true,
                'componentes' => $componentes
            ];
        } catch (Exception $e) {
            error_log("Error en obtenerComponentesDisponibles: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Error al obtener componentes disponibles'
            ];
        }
    }

    public function usarComponente($idComponente, $idUsuario, $idMaquina = null) {
        try {
            $result = $this->model->usarComponente($idComponente, $idUsuario, $idMaquina);
            
            if ($result['success']) {
                return [
                    'success' => true,
                    'message' => $result['message'],
                    'idComponente' => $idComponente,
                    'idMaquina' => $idMaquina
                ];
            } else {
                return [
                    'success' => false,
                    'message' => $result['message'] ?? 'Error al usar componente'
                ];
            }
        } catch (Exception $e) {
            error_log("Error en usarComponente: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Error interno al usar componente'
            ];
        }
    }

    public function liberarComponente($idComponente, $idUsuario) {
        try {
            $result = $this->model->liberarComponente($idComponente, $idUsuario);
            
            if ($result['success']) {
                return [
                    'success' => true,
                    'message' => $result['message'],
                    'idComponente' => $idComponente
                ];
            } else {
                return [
                    'success' => false,
                    'message' => $result['message'] ?? 'Error al liberar componente'
                ];
            }
        } catch (Exception $e) {
            error_log("Error en liberarComponente: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Error interno al liberar componente'
            ];
        }
    }

    public function liberarComponentesCancelacion($idPlaca, $idCarcasa, $idUsuario) {
        try {
            $result = $this->model->liberarComponentesCancelacion($idPlaca, $idCarcasa, $idUsuario);
            
            if ($result['success']) {
                return [
                    'success' => true,
                    'message' => $result['message'],
                    'idPlaca' => $idPlaca,
                    'idCarcasa' => $idCarcasa
                ];
            } else {
                return [
                    'success' => false,
                    'message' => $result['message'] ?? 'Error al liberar componentes'
                ];
            }
        } catch (Exception $e) {
            error_log("Error en liberarComponentesCancelacion: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Error interno al liberar componentes'
            ];
        }
    }

    public function obtenerComponentesEnUso($idUsuario, $idMaquina = null) {
        try {
            $componentes = $this->model->obtenerComponentesEnUso($idUsuario, $idMaquina);
            
            return [
                'success' => true,
                'componentes' => $componentes
            ];
        } catch (Exception $e) {
            error_log("Error en obtenerComponentesEnUso: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Error al obtener componentes en uso',
                'componentes' => []
            ];
        }
    }

    public function asignarCarcasa($idComponente, $idUsuario) {
        try {
            $result = $this->model->asignarCarcasa($idComponente, $idUsuario);
            
            if ($result['success']) {
                return [
                    'success' => true,
                    'message' => $result['message'],
                    'idComponente' => $idComponente
                ];
            } else {
                return [
                    'success' => false,
                    'message' => $result['message'] ?? 'Error al asignar carcasa'
                ];
            }
        } catch (Exception $e) {
            error_log("Error en asignarCarcasa: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Error interno al asignar carcasa'
            ];
        }
    }
}
?>