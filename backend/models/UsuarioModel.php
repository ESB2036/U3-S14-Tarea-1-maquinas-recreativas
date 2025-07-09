<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helper/CifradoHelper.php';

class UsuarioModel {
    private $db;

    public function __construct() {
        $this->db = new Database();
    }

    public function registrarUsuario($data) {
        $conn = $this->db->getConnection();
        
        $required = ['nombre', 'apellido', 'ci', 'email', 'usuario_asignado', 'contrasena', 'tipo'];
        foreach ($required as $field) {
            if (empty($data[$field])) {
                return ['success' => false, 'message' => "El campo $field es requerido"];
            }
        }

        try {
            $especialidad = $data['especialidad'] ?? null;
            $hashedPassword = password_hash($data['contrasena'], PASSWORD_DEFAULT);
            $ciEncriptado = CifradoHelper::encriptar($data['ci']);
            $emailEncriptado = CifradoHelper::encriptar($data['email']);
            
            $sql = "CALL sp_registrar_usuario(?, ?, ?, ?, ?, ?, ?, ?, @p_id_usuario)";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param(
                "ssssssss", 
                $data['nombre'],
                $data['apellido'],
                $ciEncriptado,
                $emailEncriptado,
                $data['usuario_asignado'],
                $hashedPassword,
                $data['tipo'],
                $especialidad
            );

            if ($stmt->execute()) {
                $result = $conn->query("SELECT @p_id_usuario as id");
                $row = $result->fetch_assoc();
                
                if ($row['id']) {
                    return [
                        'success' => true,
                        'message' => 'Usuario registrado correctamente',
                        'userId' => $row['id']
                    ];
                }
            }
            
            return ['success' => false, 'message' => 'Error al registrar el usuario'];
        } catch (Exception $e) {
            if (strpos($e->getMessage(), 'Duplicate entry') !== false) {
                if (strpos($e->getMessage(), 'email') !== false) {
                    return ['success' => false, 'message' => 'El correo electrónico ya está registrado'];
                } elseif (strpos($e->getMessage(), 'ci') !== false) {
                    return ['success' => false, 'message' => 'La cédula ya está registrada'];
                } 
            }
            
            return ['success' => false, 'message' => 'Error en el servidor: ' . $e->getMessage()];
        }
    }

    public function login($usuario_asignado) {
        $conn = $this->db->getConnection();
        
        $sql = "CALL sp_login(?)";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("s", $usuario_asignado);
        $stmt->execute();
        
        $result = $stmt->get_result();
        
        if ($result->num_rows > 0) {
            $usuario = $result->fetch_assoc();
            if (isset($usuario['email'])) {
                $usuario['email'] = CifradoHelper::desencriptar($usuario['email']);
            }
            if (isset($usuario['ci'])) {
                $usuario['ci'] = CifradoHelper::desencriptar($usuario['ci']);
            }
            return $usuario;
        }
        
        return false;
    }

    public function registrarInicioSesion($userId, $usuarioAsignado, $contrasenaHash) {
        $conn = $this->db->getConnection();
        
        $sql = "CALL sp_registrar_inicio_sesion(?, ?, ?)";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("sss", $userId, $usuarioAsignado, $contrasenaHash);
        
        return $stmt->execute();
    }

    public function registrarLogout($userId) {
        $conn = $this->db->getConnection();
        
        $sql = "CALL sp_registrar_logout(?)";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("s", $userId);
        
        return $stmt->execute();
    }

    public function obtenerEstadoUsuario($userId) {
        $conn = $this->db->getConnection();
        
        $sql = "CALL sp_obtener_estado_usuario(?, @p_estado)";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("s", $userId);
        $stmt->execute();
        
        $result = $conn->query("SELECT @p_estado as estado");
        $row = $result->fetch_assoc();
        return $row['estado'];
    }

    public function incrementarActividadesTecnico($idTecnico) {
        $conn = $this->db->getConnection();
        
        $sql = "CALL sp_incrementar_actividades_tecnico(?)";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("s", $idTecnico);
        
        return $stmt->execute();
    }

    public function obtenerUsuarioPorId($id) {
        $conn = $this->db->getConnection();
        
        $sql = "CALL sp_obtener_usuario_por_id(?)";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("s", $id);
        $stmt->execute();
        
        $result = $stmt->get_result();
        
        if ($result->num_rows > 0) {
            $usuario = $result->fetch_assoc();
            if (isset($usuario['email'])) {
                $usuario['email'] = CifradoHelper::desencriptar($usuario['email']);
            }
            if (isset($usuario['ci'])) {
                $usuario['ci'] = CifradoHelper::desencriptar($usuario['ci']);
            }
            return $usuario;
        }
        
        return false;
    }
public function actualizarPerfil($data) {
    $conn = $this->db->getConnection();

    // Usar ID_Usuario como en el resto del sistema
    $idUsuario = $data['ID_Usuario'] ?? $data['id'] ?? null;

    if (!isset($idUsuario, $data['nombre'], $data['apellido'], $data['email'], $data['ci'], $data['tipo'], $data['estado'])) {
        error_log("Datos faltantes en actualizarPerfil: " . print_r($data, true));
        return false;
    }

    $especialidad = $data['especialidad'] ?? null;
    $contrasena = $data['contrasena'] ?? null;

    $emailEncriptado = CifradoHelper::encriptar($data['email']);
    $ciEncriptado = CifradoHelper::encriptar($data['ci']);

    try {
        $conn->begin_transaction();

        // 1. Actualizar contraseña si se proporciona
        if (!empty($contrasena)) {
            $contrasenaHash = password_hash($contrasena, PASSWORD_DEFAULT);
            $sql = "UPDATE usuario SET contrasena = ? WHERE ID_Usuario = ?";
            $stmt = $conn->prepare($sql);
            if (!$stmt) throw new Exception("Error preparando contraseña: " . $conn->error);
            $stmt->bind_param("ss", $contrasenaHash, $idUsuario);
            if (!$stmt->execute()) {
                throw new Exception("Error al actualizar contraseña: " . $stmt->error);
            }
        }

        // 2. Actualizar CI (siempre)
        $sqlCi = "UPDATE usuario SET ci = ? WHERE ID_Usuario = ?";
        $stmtCi = $conn->prepare($sqlCi);
        if (!$stmtCi) throw new Exception("Error preparando CI: " . $conn->error);
        $stmtCi->bind_param("ss", $ciEncriptado, $idUsuario);
        if (!$stmtCi->execute()) {
            throw new Exception("Error al actualizar CI: " . $stmtCi->error);
        }

        // 3. Llamar al procedimiento para los demás campos
        $sql = "CALL sp_actualizar_perfil(?, ?, ?, ?, ?, ?, ?, ?, @p_resultado)";
        $stmt = $conn->prepare($sql);
        if (!$stmt) throw new Exception("Error preparando SP: " . $conn->error);
        
        if (!$stmt->bind_param("ssssssss", 
            $idUsuario,
            $data['nombre'],
            $data['apellido'],
            $emailEncriptado,
            $ciEncriptado,
            $data['tipo'],
            $data['estado'],
            $especialidad
        )) {
            throw new Exception("Error en bind_param: " . $stmt->error);
        }

        if (!$stmt->execute()) {
            throw new Exception("Error al ejecutar SP: " . $stmt->error);
        }

        $result = $conn->query("SELECT @p_resultado as resultado");
        $row = $result->fetch_assoc();
        
        $conn->commit();
        return (bool)$row['resultado'];

    } catch (Exception $e) {
        $conn->rollback();
        error_log("Error en actualizarPerfil: " . $e->getMessage());
        return false;
    }
}

    public function actualizarUsuarioAsignado($data) {
        $conn = $this->db->getConnection();
        
        if (!isset($data['email'], $data['usuario_asignado'])) {
            return ['success' => false, 'message' => 'Datos incompletos'];
        }

        try {
            $emailEncriptado = CifradoHelper::encriptar($data['email']);
            $sql = "SELECT ID_Usuario FROM usuario WHERE email = ?";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("s", $emailEncriptado);
            $stmt->execute();
            $result = $stmt->get_result();
            
            if ($result->num_rows === 0) {
                return ['success' => false, 'message' => 'Correo electrónico no encontrado'];
            }
            
            $user = $result->fetch_assoc();
            $userId = $user['ID_Usuario'];

            $sql = "CALL sp_actualizar_usuario_asignado(?, ?, @p_resultado)";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("ss", $userId, $data['usuario_asignado']);
            
            if ($stmt->execute()) {
                $result = $conn->query("SELECT @p_resultado as resultado");
                $row = $result->fetch_assoc();
                
                return [
                    'success' => (bool)$row['resultado'],
                    'message' => $row['resultado'] ? 'Usuario actualizado correctamente' : 'No se pudo actualizar el usuario'
                ];
            }
            
            return ['success' => false, 'message' => 'Error al ejecutar la consulta'];
        } catch (Exception $e) {
            return ['success' => false, 'message' => 'Error en el servidor: ' . $e->getMessage()];
        }
    }

    public function recuperarContrasena($data) {
        $conn = $this->db->getConnection();
        
        if (!isset($data['email'], $data['nueva_contrasena'])) {
            return ['success' => false, 'message' => 'Datos incompletos'];
        }

        try {
            $contrasenaHash = password_hash($data['nueva_contrasena'], PASSWORD_DEFAULT);
            $emailEncriptado = CifradoHelper::encriptar($data['email']);
            
            $sql = "CALL sp_recuperar_contrasena(?, ?, @p_resultado)";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("ss", $emailEncriptado, $contrasenaHash);
            
            if ($stmt->execute()) {
                $result = $conn->query("SELECT @p_resultado as resultado");
                $row = $result->fetch_assoc();
                
                return [
                    'success' => (bool)$row['resultado'],
                    'message' => $row['resultado'] ? 'Contraseña actualizada correctamente' : 'No se pudo actualizar la contraseña'
                ];
            }
            
            return ['success' => false, 'message' => 'Error al ejecutar la consulta'];
        } catch (Exception $e) {
            return ['success' => false, 'message' => 'Error en el servidor: ' . $e->getMessage()];
        }
    }

    public function obtenerTecnicosPorEspecialidad($especialidad, $soloActivos = true) {
        $conn = $this->db->getConnection();
        
        $sql = "CALL sp_obtener_tecnicos_por_especialidad(?, ?)";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("si", $especialidad, $soloActivos);
        $stmt->execute();
        
        $result = $stmt->get_result();
        $tecnicos = [];
        
        while ($row = $result->fetch_assoc()) {
            if (isset($row['email'])) {
                $row['email'] = CifradoHelper::desencriptar($row['email']);
            }
            if (isset($row['ci'])) {
                $row['ci'] = CifradoHelper::desencriptar($row['ci']);
            }
            $tecnicos[] = $row;
        }
        
        return $tecnicos;
    }

    public function obtenerUsuariosPorTipo($tipo, $excluirId = null) {
        $conn = $this->db->getConnection();

        $sql = "CALL sp_obtener_usuarios_por_tipo(?, ?)";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("ss", $tipo, $excluirId);
        $stmt->execute();

        $result = $stmt->get_result();
        $usuarios = [];

        while ($row = $result->fetch_assoc()) {
            if (isset($row['email'])) {
                $row['email'] = CifradoHelper::desencriptar($row['email']);
            }
            if (isset($row['ci'])) {
                $row['ci'] = CifradoHelper::desencriptar($row['ci']);
            }
            $usuarios[] = $row;
        }

        return $usuarios;
    }

    public function registrarActividad($idUsuario, $descripcion) {
        $conn = $this->db->getConnection();
        
        $sql = "CALL sp_registrar_actividad(?, ?, @p_resultado)";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("ss", $idUsuario, $descripcion);
        
        if ($stmt->execute()) {
            $result = $conn->query("SELECT @p_resultado as resultado");
            $row = $result->fetch_assoc();
            return (bool)$row['resultado'];
        }
        
        return false;
    }

    public function obtenerHistorialActividades($usuarioId) {
        $conn = $this->db->getConnection();
        $sql = "CALL sp_obtener_historial_actividades(?)";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("s", $usuarioId);
        $stmt->execute();
        
        $result = $stmt->get_result();
        $actividades = [];

        while ($row = $result->fetch_assoc()) {
            $actividades[] = $row;
        }

        return $actividades;
    }
    public function buscarPorEmail($email) {
        $conn = $this->db->getConnection();
        $emailEncriptado = CifradoHelper::encriptar($email);

        $sql = "CALL sp_buscar_usuario_por_email(?)";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("s", $emailEncriptado);
        $stmt->execute();

        $result = $stmt->get_result();
        if ($result->num_rows > 0) {
            $usuario = $result->fetch_assoc();
            $usuario['email'] = CifradoHelper::desencriptar($usuario['email']);
            $usuario['ci'] = CifradoHelper::desencriptar($usuario['ci']);
            return ['success' => true, 'usuario' => $usuario];
        }

        return ['success' => false, 'message' => 'Usuario no encontrado'];
    }

}
?>