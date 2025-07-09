<?php
require_once __DIR__ . '/../models/NotificacionModel.php';
/**
 * Este archivo implementa un servicio para gestionar las notificaciones entre usuarios. Se encarga de crear, obtener y marcar notificaciones como leídas o no leídas, conectándose al modelo NotificacionModel.
 */
class NotificacionService {
    private $model;

    public function __construct() {
        $this->model = new NotificacionModel();
    }

    /**
     * Obtiene notificaciones para un usuario.
     * @param int $idUsuario ID del usuario.
     * @return array Lista de notificaciones.
     */
    public function obtenerNotificaciones($idUsuario) {
        $notificaciones = $this->model->obtenerNotificacionesPorDestinatario($idUsuario);
        return ['success' => true, 'notificaciones' => $notificaciones];
    }

    /**
     * Crea una nueva notificación.
     * @param int $idRemitente ID del remitente.
     * @param int $idDestinatario ID del destinatario.
     * @param int $idMaquina ID de la máquina relacionada.
     * @param string $tipo Tipo de notificación.
     * @param string $mensaje Contenido de la notificación.
     * @return array Resultado de la operación.
     */
    public function crearNotificacion($idRemitente, $idDestinatario, $idMaquina, $tipo, $mensaje) {
        $result = $this->model->crearNotificacion($idRemitente, $idDestinatario, $idMaquina, $tipo, $mensaje);
        
        if ($result) {
            return ['success' => true];
        } else {
            return ['success' => false, 'message' => 'Error al crear notificacion'];
        }
    }
    /**
     * Summary of marcarComoLeida
     * @param mixed $idNotificacion
     * @return array{message: string, success: bool|array{success: bool}}
     */
    public function marcarComoLeida($idNotificacion) {
        $result = $this->model->marcarComoLeida($idNotificacion);
        return $result 
            ? ['success' => true] 
            : ['success' => false, 'message' => 'Error al actualizar notificación'];
    }
    /**
     * Devuelve el número total de notificaciones no leídas.
     * @param mixed $idUsuario  ID del usuario.
     * @return array{success: bool, total: mixed}
     */
    public function obtenerNoLeidas($idUsuario) {
        $total = $this->model->obtenerNoLeidas($idUsuario);
        return ['success' => true, 'total' => $total];
    }
    /**
     * Lista todas las notificaciones asociadas a un usuario, tanto leídas como no leídas.
     * @param mixed $userId ID del usuario.
     * @return array{count: int, notificaciones: array, success: bool|array{message: string, success: bool}}
     */
    public function obtenerNotificacionesPorUsuario($userId) {
        try {
            $notificaciones = $this->model->obtenerNotificacionesPorUsuario($userId);
            
            return [
                'success' => true,
                'notificaciones' => $notificaciones,
                'count' => count($notificaciones)
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'Error al obtener notificaciones: ' . $e->getMessage()
            ];
        }
    }
    /**
     * Devuelve solo la cantidad de notificaciones no leídas.
     * @param mixed $userId
     * @return array{cantidad: mixed, success: bool}
     */
    public function obtenerCantidadNoLeidas($userId) {
        $cantidad = $this->model->obtenerCantidadNoLeidas($userId);
        
        return ['success' => true, 'cantidad' => $cantidad];
    }
    /**
     * Marca una notificación como leída, considerando la validez de usuario.
     * @param mixed $notificacionId  ID de la notificación.
     * @param mixed $userId ID del usuario.
     * @return array{message: string, success: bool|array{success: bool}}
     */
    public function marcarComoLeidaNotificacion($notificacionId, $userId) {
        try {
            $success = $this->model->marcarComoLeidaNotificacion($notificacionId, $userId);
            
            if (!$success) {
                return [
                    'success' => false,
                    'message' => 'No se pudo marcar la notificación como leída'
                ];
            }
            
            return ['success' => true];
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'Error al actualizar notificación: ' . $e->getMessage()
            ];
        }
    }
    /**
     * Marca todas las notificaciones como leídas para un usuario específico.
     * @param mixed $userId
     * @return array{message: string, success: bool|array{success: bool}}
     */
    public function marcarTodasComoLeidas($userId) {
        try {
            $this->model->marcarTodasComoLeidas($userId);
            return ['success' => true];
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'Error al actualizar notificaciones: ' . $e->getMessage()
            ];
        }
    }
}
?>

