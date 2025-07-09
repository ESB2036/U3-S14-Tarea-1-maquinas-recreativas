<?php
require_once __DIR__ . '/../models/AdministradorModel.php';
require_once __DIR__ . '/../models/UsuarioModel.php';
class AdministradorService {
    private $model;
    private $usuarioModel;
    public function __construct() {
        $this->model = new AdministradorModel();
        $this->usuarioModel = new UsuarioModel(); 
    }

    public function obtenerUsuario($id) {
        $usuario = $this->model->obtenerUsuarioPorId($id);
        if (!$usuario) {
            throw new Exception('Usuario no encontrado');
        }
        return $usuario;
    }

    public function obtenerTodosUsuarios($filters = []) {
        if (!empty($filters)) {
            return $this->model->getUsuarios($filters);
        }
        return $this->model->obtenerTodosUsuarios();
    }

    public function actualizarUsuario($data) {
        $this->validarDatosUsuario($data, true);
        $success = $this->model->actualizarUsuario($data);
        
        if (!$success) {
            throw new Exception('Error al actualizar en la base de datos');
        }
        
        return ['success' => true, 'message' => 'Usuario actualizado correctamente'];
    }

    public function actualizarParcialUsuario($data) {
        if (!isset($data['estado'])) {
            throw new Exception('Estado no proporcionado');
        }
        
        $success = $this->model->cambiarEstadoUsuario($data['ID_Usuario'], $data['estado']);
        
        if (!$success) {
            throw new Exception('Error al actualizar el estado en la base de datos');
        }
        
        return ['success' => true, 'message' => 'Estado de usuario actualizado correctamente'];
    }

    public function eliminarUsuario($id) {
        if (empty($id)) {
            throw new Exception('ID de usuario no proporcionado');
        }

        $usuario = $this->model->obtenerTipoUsuario($id);
        if (!$usuario) {
            throw new Exception('Usuario no encontrado');
        }

        if ($usuario['tipo'] === 'Administrador') {
            throw new Exception('No puedes eliminar a otro administrador del sistema');
        }

        $success = $this->model->eliminarUsuario($id);

        if (!$success) {
            throw new Exception('Error al eliminar el usuario en la base de datos');
        }

        return ['success' => true, 'message' => 'Usuario eliminado correctamente'];
    }

    public function registrarUsuarioAdmin($data) {
        if (empty($data['usuario_asignado']) || trim($data['usuario_asignado']) === '') {
            throw new Exception("El campo usuario_asignado es requerido y no puede estar vacío");
        }
        
        if (strlen($data['contrasena']) < 8) {
            throw new Exception("La contraseña debe tener al menos 8 caracteres");
        }
        
        $this->validarDatosUsuario($data);
        
        try {
            $id = $this->model->registrarUsuarioAdmin($data);
            
            if (!$id) {
                throw new Exception('Error al registrar el usuario');
            }
            
            return ['success' => true, 'message' => 'Usuario registrado correctamente', 'id' => $id];
        } catch (Exception $e) {
            error_log("Error en registrarUsuarioAdmin: " . $e->getMessage());
            throw new Exception('Error al procesar el registro del usuario');
        }
    }

    private function validarDatosUsuario($data, $isUpdate = false) {
        $required = $isUpdate ? 
            ['ID_Usuario', 'nombre', 'apellido', 'email', 'tipo', 'estado'] : 
            ['nombre', 'apellido', 'ci', 'email', 'usuario_asignado', 'contrasena', 'tipo'];
        
        foreach ($required as $field) {
            if (empty($data[$field])) {
                throw new Exception("El campo $field es requerido");
            }
        }
    
        if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            throw new Exception("El formato del email no es válido");
        }
    
        $tiposPermitidos = ['Tecnico', 'Logistica', 'Contabilidad', 'Administrador', 'Usuario'];
        if (!in_array($data['tipo'], $tiposPermitidos)) {
            throw new Exception("Tipo de usuario no válido");
        }
    
        if ($data['tipo'] === 'Tecnico' && empty($data['especialidad'])) {
            throw new Exception("La especialidad es requerida para técnicos");
        }
    }

    public function obtenerHistorialActividades($usuarioId) {
        return $this->usuarioModel->obtenerHistorialActividades($usuarioId);
    }
}
?>