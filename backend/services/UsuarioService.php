<?php
require_once __DIR__ . '/../models/UsuarioModel.php';

class UsuarioService {
    private $model;

    public function __construct() {
        $this->model = new UsuarioModel();
    }

    public function registrarUsuario($data) {
        $required = ['nombre', 'apellido', 'ci', 'email', 'usuario_asignado', 'contrasena', 'tipo'];
        
        foreach ($required as $field) {
            if (!isset($data[$field]) || empty($data[$field])) {
                return ['success' => false, 'message' => "El campo $field es requerido"];
            }
        }
        
        if (strlen($data['contrasena']) < 8) {
            return ['success' => false, 'message' => 'La contraseña debe tener al menos 8 caracteres'];
        }
        
        $tiposPermitidos = ['Tecnico', 'Logistica', 'Contabilidad', 'Administrador', 'Usuario'];
        if (!in_array($data['tipo'], $tiposPermitidos)) {
            return ['success' => false, 'message' => 'Tipo de usuario no válido'];
        }
        
        if ($data['tipo'] === 'Tecnico' && empty($data['especialidad'])) {
            return ['success' => false, 'message' => 'La especialidad es requerida para técnicos'];
        }
        
        $result = $this->model->registrarUsuario($data);
        
        if ($result['success']) {
            return ['success' => true, 'idUsuario' => $result['userId'], 'message' => $result['message']];
        } else {
            return ['success' => false, 'message' => $result['message']];
        }
    }
        
    public function login($usuario_asignado, $contrasena) {
        try {
            $usuario = $this->model->login($usuario_asignado);
            
            if (!$usuario) {
                return ['success' => false, 'message' => 'Credenciales inválidas'];
            }
            
            if (!password_verify($contrasena, $usuario['contrasena'])) {
                return ['success' => false, 'message' => 'Credenciales inválidas'];
            }
             
            $this->model->registrarInicioSesion(
                $usuario['ID_Usuario'],
                $usuario['usuario_asignado'],
                $usuario['contrasena']
            );
            
            return [
                'success' => true,
                'message' => 'Inicio de sesión exitoso',
                'usuario' => $usuario
            ];
        } catch (Exception $e) {
            error_log("Error en login: " . $e->getMessage());
            return ['success' => false, 'message' => 'Error al iniciar sesión'];
        }
    }

    public function logout($userId) {
        try {
            $result = $this->model->registrarLogout($userId);
            
            if ($result) {
                return ['success' => true, 'message' => 'Sesión cerrada correctamente'];
            } else {
                return ['success' => false, 'message' => 'Error al registrar cierre de sesión'];
            }
        } catch (Exception $e) {
            error_log("Error en logout: " . $e->getMessage());
            return ['success' => false, 'message' => 'Error al cerrar sesión'];
        }
    }

    public function registrarInicioSesion($userId, $usuarioAsignado, $contrasenaHash) {
        return $this->model->registrarInicioSesion($userId, $usuarioAsignado, $contrasenaHash);
    }

    public function obtenerEstadoUsuario($userId) {
        return $this->model->obtenerEstadoUsuario($userId);
    }

    public function obtenerUsuario($id) {
        $usuario = $this->model->obtenerUsuarioPorId($id);
        
        if ($usuario) {
            unset($usuario['contrasena']);
            return ['success' => true, 'usuario' => $usuario];
        } else {
            return ['success' => false, 'message' => 'Usuario no encontrado'];
        }
    }

    public function obtenerTecnicosPorEspecialidad($especialidad) {
        $tecnicos = $this->model->obtenerTecnicosPorEspecialidad($especialidad);
        return ['success' => true, 'tecnicos' => $tecnicos];
    }

    public function actualizarPerfil($data) {
    try {
        // Validación básica de campos requeridos
        $required = ['id', 'nombre', 'apellido', 'email', 'ci', 'tipo', 'estado'];
        foreach ($required as $field) {
            if (!isset($data[$field])) {
                return ['success' => false, 'message' => "El campo $field es requerido"];
            }
        }

        if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            return ['success' => false, 'message' => 'El formato del email es inválido'];
        }
        
        if (strlen($data['ci']) < 6) {
            return ['success' => false, 'message' => 'La cédula debe tener al menos 6 caracteres'];
        }
        
        if (!empty($data['contrasena'])) {
            if (strlen($data['contrasena']) < 8) {
                return ['success' => false, 'message' => 'La contraseña debe tener al menos 8 caracteres'];
            }
        }

        // Asegurarse de que el ID se envía como ID_Usuario también
        $data['ID_Usuario'] = $data['id'];
        
        $result = $this->model->actualizarPerfil($data);
        
        if ($result) {
            return ['success' => true, 'message' => 'Perfil actualizado correctamente'];
        } else {
            return ['success' => false, 'message' => 'Error al actualizar el perfil en la base de datos'];
        }
    } catch (Exception $e) {
        error_log("Error en actualizarPerfil: " . $e->getMessage());
        return ['success' => false, 'message' => 'Error interno al actualizar el perfil'];
    }
}
    public function actualizarUsuarioAsignado($data) {
        if (!isset($data['email']) || !isset($data['usuario_asignado'])) {
            return ['success' => false, 'message' => 'Email y nuevo usuario son requeridos'];
        }

        $result = $this->model->actualizarUsuarioAsignado($data);
        
        if ($result) {
            return ['success' => true, 'message' => 'Usuario actualizado correctamente'];
        } else {
            return ['success' => false, 'message' => 'Error al actualizar el usuario'];
        }
    }

    public function recuperarContrasena($data) {
        $result = $this->model->recuperarContrasena($data);
        return ['success' => $result];
    }
 
    public function obtenerUsuariosPorTipo($tipo) {
        if (empty($tipo)) {
            throw new InvalidArgumentException("Tipo de usuario no proporcionado.");
        }
        return $this->model->obtenerUsuariosPorTipo($tipo);
    }

    public function registrarActividad($idUsuario, $descripcion) {
        return $this->model->registrarActividad($idUsuario, $descripcion);
    }

    public function obtenerHistorialActividades($usuarioId) {
        return $this->model->obtenerHistorialActividades($usuarioId);
    }
    public function buscarPorEmail($email) {
        return $this->model->buscarPorEmail($email);
    }
}
?>