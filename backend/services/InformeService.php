<?php
require_once __DIR__ . '/../models/InformeModel.php';
require_once __DIR__ . '/../models/MaquinaModel.php';

class InformeService {
    private $model;
    private $maquinaModel;

    public function __construct() {
        $this->model = new InformeModel();
        $this->maquinaModel = new MaquinaModel();
    }

    public function registrarRecaudacion($data) {
        try {
            // Validar que la máquina existe y está en etapa de recaudación
            $maquina = $this->maquinaModel->obtenerMaquinaPorId($data['ID_Maquina']);
            if (!$maquina) {
                return ['success' => false, 'message' => 'Máquina no encontrada'];
            }
            
            if ($maquina['Etapa'] !== 'Recaudacion' || $maquina['Estado'] !== 'Operativa') {
                return ['success' => false, 'message' => 'La máquina no está disponible para recaudación'];
            }

            // Validar usuario existe
            $usuarioModel = new UsuarioModel();
            if (!$usuarioModel->obtenerUsuarioPorId($data['ID_Usuario'])) {
                return ['success' => false, 'message' => 'Usuario no válido'];
            }

            $idRecaudacion = $this->model->registrarRecaudacion($data);
            
            if ($idRecaudacion) {
                return [
                    'success' => true,
                    'message' => 'Recaudación registrada correctamente',
                    'idRecaudacion' => $idRecaudacion
                ];
            } else {
                error_log("Error al registrar recaudación - No se pudo insertar en BD");
                return ['success' => false, 'message' => 'Error al registrar la recaudación en la base de datos'];
            }
        } catch (Exception $e) {
            error_log("Error en registrarRecaudacion: " . $e->getMessage());
            return ['success' => false, 'message' => 'Error interno del servidor'];
        }
    }

    public function obtenerRecaudaciones($filters) {
        try {
            if (!is_array($filters)) {
                throw new Exception('Parámetros de filtro no válidos');
            }

            $recaudaciones = $this->model->obtenerRecaudaciones($filters);
            
            return [
                'success' => true,
                'recaudaciones' => $recaudaciones,
                'total' => count($recaudaciones),
                'message' => count($recaudaciones) > 0 
                    ? 'Recaudaciones encontradas' 
                    : 'No se encontraron recaudaciones con los filtros aplicados'
            ];
        } catch (Exception $e) {
            error_log("Error en obtenerRecaudaciones: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Error al obtener recaudaciones: ' . $e->getMessage()
            ];
        }
    }

    public function obtenerResumenRecaudacionesLimitado($limit) {
        try {
            $resumen = $this->model->obtenerResumenRecaudacionesLimitado($limit);
            return [
                'success' => true,
                'resumen' => $resumen
            ];
        } catch (Exception $e) {
            error_log("Error en obtenerResumenRecaudacionesLimitado: " . $e->getMessage());
            return ['success' => false, 'message' => 'Error al obtener resumen limitado'];
        }
    }

    public function actualizarRecaudacion($data) {
        try {
            if (!is_array($data)) {
                throw new Exception('Datos de entrada no válidos');
            }

            $requiredFields = [
                'ID_Recaudacion', 'ID_Maquina', 'Tipo_Comercio',
                'Monto_Total', 'Monto_Empresa', 'Monto_Comercio', 'fecha'
            ];
            
            foreach ($requiredFields as $field) {
                if (!isset($data[$field])) {
                    throw new Exception("El campo $field es requerido");
                }
            }

            if (!in_array($data['Tipo_Comercio'], ['Minorista', 'Mayorista'])) {
                throw new Exception('Tipo de comercio no válido');
            }

            if (!is_numeric($data['Monto_Total']) || $data['Monto_Total'] <= 0) {
                throw new Exception('Monto total debe ser positivo');
            }

            if (empty($data['fecha'])) {
                throw new Exception('Fecha no proporcionada');
            }

            $totalCalculado = floatval($data['Monto_Empresa']) + floatval($data['Monto_Comercio']);
            if (abs($totalCalculado - floatval($data['Monto_Total'])) > 0.01) {
                throw new Exception('La suma de montos no coincide con el total');
            }

            $data['detalle'] = $data['detalle'] ?? '';

            $result = $this->model->actualizarRecaudacion($data);
            
            if (!$result['success']) {
                throw new Exception($result['message'] ?? 'Error al actualizar recaudación');
            }

            return [
                'success' => true,
                'message' => 'Recaudación actualizada correctamente',
                'affected_rows' => $result['affected_rows']
            ];

        } catch (Exception $e) {
            error_log("Error en actualizarRecaudacion: " . $e->getMessage());
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }

    public function eliminarRecaudacion($id) {
        try {
            $success = $this->model->eliminarRecaudacion($id);
            return [
                'success' => $success,
                'message' => $success ? 'Recaudación eliminada correctamente' : 'Error al eliminar recaudación'
            ];
        } catch (Exception $e) {
            error_log("Error en eliminarRecaudacion: " . $e->getMessage());
            return ['success' => false, 'message' => 'Error interno del servidor'];
        }
    }

    public function obtenerMaquinasRecaudacion() {
        try {
            $maquinas = $this->maquinaModel->obtenerMaquinasPorEtapaYEstado('Recaudacion', 'Operativa');
            return [
                'success' => true,
                'maquinas' => $maquinas
            ];
        } catch (Exception $e) {
            error_log("Error en obtenerMaquinasRecaudacion: " . $e->getMessage());
            return ['success' => false, 'message' => 'Error al obtener máquinas'];
        }
    }

    public function obtenerMaquinasOperativasPorComercio($id_comercio) {
        try {
        if (!preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $id_comercio)) {
            return ['success' => false, 'message' => 'ID de comercio inválido'];
        }


            
            $maquinas = $this->maquinaModel->obtenerMaquinasOperativasPorComercio($id_comercio);
            
            if ($maquinas === false) {
                return ['success' => false, 'message' => 'Error en la consulta de máquinas'];
            }
            
            return [
                'success' => true,
                'maquinas' => $maquinas,
                'message' => empty($maquinas) 
                    ? 'No hay máquinas operativas en etapa de recaudación para este comercio' 
                    : 'Máquinas encontradas'
            ];
        } catch (Exception $e) {
            error_log("Error en obtenerMaquinasOperativasPorComercio: " . $e->getMessage());
            return [
                'success' => false, 
                'message' => 'Error al obtener máquinas por comercio',
                'error' => $e->getMessage()
            ];
        }
    }

     public function guardarInforme($data) {
        try {
            if (!isset($data['ID_Recaudacion']) || !preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $data['ID_Recaudacion'])) {
                return ['success' => false, 'message' => 'ID de recaudación inválido'];
            }

            if (!isset($data['ID_Comercio']) || !preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $data['ID_Comercio'])) {
                return ['success' => false, 'message' => 'ID de comercio inválido'];
            }

            $idInforme = $this->model->guardarInformePrincipal($data);
            
            if (!$idInforme) {
                return ['success' => false, 'message' => 'Error al guardar el informe principal'];
            }

            if (!empty($data['componentes'])) {
                foreach ($data['componentes'] as $componente) {
                    if (!isset($componente['ID_Componente']) || !preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $componente['ID_Componente'])) {
                        continue;
                    }

                    $detalleGuardado = $this->model->guardarDetalleComponente(
                        $idInforme,
                        $componente['ID_Componente']
                    );

                    if (!$detalleGuardado) {
                        error_log("Error al guardar componente ID: " . $componente['ID_Componente']);
                    }
                }
            }

            return [
                'success' => true,
                'message' => 'Informe guardado correctamente',
                'idInforme' => $idInforme
            ];

        } catch (Exception $e) {
            error_log("Error en guardarInforme: " . $e->getMessage());
            return ['success' => false, 'message' => 'Error al guardar el informe'];
        }
    }


      public function obtenerInformePorRecaudacion($idRecaudacion) {
        try {
            if (!preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $idRecaudacion)) {
                return ['success' => false, 'message' => 'ID de recaudación inválido'];
            }

            $informe = $this->model->obtenerInformePrincipal($idRecaudacion);
            
            if (!$informe) {
                return ['success' => false, 'message' => 'Informe no encontrado'];
            }

            $componentes = $this->model->obtenerComponentesInforme($informe['ID_Informe']);

            return [
                'success' => true,
                'informe' => $informe,
                'componentes' => $componentes
            ];

        } catch (Exception $e) {
            error_log("Error en obtenerInformePorRecaudacion: " . $e->getMessage());
            return ['success' => false, 'message' => 'Error al obtener el informe'];
        }
    }
    public function obtenerRecaudacion($idRecaudacion) {
        try {
            if (!preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $idRecaudacion))
            {
                return ['success' => false, 'message' => 'ID de recaudación inválido'];
            }

            $recaudacion = $this->model->obtenerRecaudacion($idRecaudacion);
            
            if (!$recaudacion) {
                return ['success' => false, 'message' => 'Recaudación no encontrada'];
            }

            return [
                'success' => true,
                'recaudacion' => $recaudacion
            ];
        } catch (Exception $e) {
            error_log("Error en obtenerRecaudacion: " . $e->getMessage());
            return ['success' => false, 'message' => 'Error al obtener recaudación'];
        }
    }

    public function obtenerMaquinaRecaudacion($idMaquina) {
        try {
if (!preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $idMaquina)) 
            {
            return ['success' => false, 'message' => 'ID de máquina inválido'];
            }

            $maquina = $this->maquinaModel->obtenerMaquinaPorId($idMaquina);
            
            if (!$maquina) {
                return ['success' => false, 'message' => 'Máquina no encontrada'];
            }

            return [
                'success' => true,
                'maquina' => $maquina
            ];
        } catch (Exception $e) {
            error_log("Error en obtenerMaquinaRecaudacion: " . $e->getMessage());
            return ['success' => false, 'message' => 'Error al obtener máquina'];
        }
    }

public function obtenerComercioRecaudacion($idComercio) {
    try {
        if (!preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $idComercio)) {
            return ['success' => false, 'message' => 'ID de comercio inválido'];
        }

        $comercio = $this->model->obtenerComercioPorId($idComercio);
        
        if (!$comercio) {
            return ['success' => false, 'message' => 'Comercio no encontrado'];
        }

        return [
            'success' => true,
            'comercio' => $comercio
        ];
    } catch (Exception $e) {
        error_log("Error en obtenerComercioRecaudacion: " . $e->getMessage());
        return ['success' => false, 'message' => 'Error al obtener comercio'];
    }
}
}
?>