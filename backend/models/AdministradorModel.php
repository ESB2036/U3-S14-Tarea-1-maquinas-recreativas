<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helper/CifradoHelper.php';

class AdministradorModel {
    private $db;

    public function __construct() {
        $this->db = new Database();
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
            if (isset($usuario['ci']) && !empty($usuario['ci'])) {
                $usuario['ci'] = CifradoHelper::desencriptar($usuario['ci']);
            }
            return $usuario;
        }
        return false;
    }

    public function obtenerTodosUsuarios() {
        $conn = $this->db->getConnection();
        
        $sql = "CALL sp_obtener_todos_usuarios()";
        $result = $conn->query($sql);
        $usuarios = [];
        
        while ($row = $result->fetch_assoc()) {
            if (isset($row['email'])) {
                $row['email'] = CifradoHelper::desencriptar($row['email']);
            }
            if (isset($row['ci']) && !empty($row['ci'])) {
                $row['ci'] = CifradoHelper::desencriptar($row['ci']);
            }
            $usuarios[] = $row;
        }
        
        return $usuarios;
    }

    public function actualizarUsuario($data) {
    $conn = $this->db->getConnection();

    // Validación básica
    if (!isset($data['ID_Usuario'], $data['nombre'], $data['apellido'], $data['email'], $data['ci'], $data['tipo'], $data['estado'], $data['usuario_asignado'])) {
        return false;
    }

    $especialidad = $data['especialidad'] ?? null;
    $contrasena = $data['contrasena'] ?? null;

    $emailEncriptado = CifradoHelper::encriptar($data['email']);
    $ciEncriptado = CifradoHelper::encriptar($data['ci']);

    // 1. Si se proporciona la contraseña, actualízala hasheada
    if (!empty($contrasena)) {
        $hash = password_hash($contrasena, PASSWORD_DEFAULT);
        $sqlPass = "UPDATE usuario SET contrasena = ? WHERE ID_Usuario = ?";
        $stmtPass = $conn->prepare($sqlPass);
        $stmtPass->bind_param("ss", $hash, $data['ID_Usuario']);
        $stmtPass->execute();
    }

    // 2. Actualizar CI
    $sqlCi = "UPDATE usuario SET ci = ? WHERE ID_Usuario = ?";
    $stmtCi = $conn->prepare($sqlCi);
    $stmtCi->bind_param("ss", $ciEncriptado, $data['ID_Usuario']);
    $stmtCi->execute();

    // 3. Ejecutar SP
    $sql = "CALL sp_actualizar_usuario(?, ?, ?, ?, ?, ?, ?, ?)";
    $stmt = $conn->prepare($sql);

    if (!$stmt) {
        throw new Exception("Error al preparar la consulta: " . $conn->error);
    }

    $stmt->bind_param(
        "ssssssss",
        $data['ID_Usuario'],
        $data['nombre'],
        $data['apellido'],
        $emailEncriptado,
        $data['tipo'],
        $data['estado'],
        $data['usuario_asignado'],
        $especialidad
    );

    if ($stmt->execute()) {
        return true;
    } else {
        throw new Exception("Error al ejecutar la consulta: " . $stmt->error);
    }
}



    public function obtenerTipoUsuario($id) {
        $conn = $this->db->getConnection();

        $sql = "SELECT tipo FROM usuario WHERE ID_Usuario = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("s", $id); 
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result && $result->num_rows > 0) {
            return $result->fetch_assoc();
        }

        return false;
    }

    public function eliminarUsuario($id) {
        $conn = $this->db->getConnection();
        
        $sql = "CALL sp_eliminar_usuario(?)";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("s", $id); // Changed from "i" to "s"
        
        try {
            return $stmt->execute();
        } catch (Exception $e) {
            throw $e;
        }
    }

    public function registrarUsuarioAdmin($data) {
        $conn = $this->db->getConnection();
        
        $contrasenaHash = password_hash($data['contrasena'], PASSWORD_BCRYPT);
        $especialidad = $data['especialidad'] ?? null;
        $ciEncriptado = CifradoHelper::encriptar($data['ci']);
        $emailEncriptado = CifradoHelper::encriptar($data['email']);
        
        $sql = "CALL sp_registrar_usuario_admin(?, ?, ?, ?, ?, ?, ?, ?, ?, @id_usuario)";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param(
            "sssssssss", 
            $data['nombre'], 
            $data['apellido'], 
            $ciEncriptado, 
            $emailEncriptado, 
            $data['usuario_asignado'], 
            $data['tipo'], 
            $data['estado'], 
            $contrasenaHash, 
            $especialidad
        );
        
        if ($stmt->execute()) {
            $result = $conn->query("SELECT @id_usuario as id");
            return $result->fetch_assoc()['id'];
        }
        return false;
    }

    public function getUsuarios($f) {
        $conn = $this->db->getConnection();
        
        $ci = (isset($f['ci']) && !empty($f['ci'])) ? 
              CifradoHelper::encriptar($f['ci']) : null;
        $estado = $f['estado'] ?? null;
        $tipo = $f['tipo'] ?? null;
        $rango = $f['rango'] ?? null;
        
        $sql = "CALL sp_obtener_usuarios_filtrados(?, ?, ?, ?)";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("ssss", $ci, $estado, $tipo, $rango);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $usuarios = [];
        while ($row = $result->fetch_assoc()) {
            if (isset($row['email'])) {
                $row['email'] = CifradoHelper::desencriptar($row['email']);
            }
            if (isset($row['ci']) && !empty($row['ci'])) {
                $row['ci'] = CifradoHelper::desencriptar($row['ci']);
            }
            $usuarios[] = $row;
        }
        return $usuarios;
    }

    public function cambiarEstadoUsuario($id, $estado) {
        $conn = $this->db->getConnection();
        
        $sql = "CALL sp_cambiar_estado_usuario(?, ?)";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("ss", $id, $estado); // Changed first param from "i" to "s"
        
        return $stmt->execute();
    }
}
?>