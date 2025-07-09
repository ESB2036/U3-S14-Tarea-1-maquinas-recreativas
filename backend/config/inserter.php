<?php
require_once __DIR__ . '/../helper/CifradoHelper.php';

class Inserter {
    private $connection;

    public function __construct($connection) {
        $this->connection = $connection;
    }

    public function insertarUsuariosIniciales() {
        $usuarios = [
            // Administrador:
            [
                'nombre' => 'Jean',
                'apellido' => 'Castro',
                'ci' => '0911111111',
                'email' => 'jean@hotmail.com',
                'contrasena' => '12345678',
                'tipo' => 'Administrador',
                'usuario_asignado' => 'admin1',
                'estado' => 'Activo'
            ],
            // Contabilidad:
            [
                'nombre' => 'Sebastián',
                'apellido' => 'Ramírez',
                'ci' => '0987765499',
                'email' => 'sebas@hotmail.com',
                'contrasena' => '12345678',
                'tipo' => 'Contabilidad',
                'usuario_asignado' => 'sebas',
                'estado' => 'Activo'
            ],
            // Logística:
            [
                'nombre' => 'Edú',
                'apellido' => 'Sabando',
                'ci' => '0916789914',
                'email' => 'esb@gmail.com',
                'contrasena' => '12345678',
                'tipo' => 'Logistica',
                'usuario_asignado' => 'esb',
                'estado' => 'Activo'
            ],
            // Técnicos:
            [
                'nombre' => 'Joshúa',
                'apellido' => 'Castillo',
                'ci' => '0987654321',
                'email' => 'joshua@gmail.com',
                'contrasena' => '12345678',
                'tipo' => 'Tecnico',
                'usuario_asignado' => 'joshua',
                'especialidad' => 'Ensamblador',
                'estado' => 'Activo'
            ],
            [
                'nombre' => 'Euro',
                'apellido' => 'Quiroz',
                'ci' => '0987667890',
                'email' => 'euro@gmail.com',
                'contrasena' => '12345678',
                'tipo' => 'Tecnico',
                'usuario_asignado' => 'euro',
                'especialidad' => 'Comprobador',
                'estado' => 'Activo'
            ],
            [
                'nombre' => 'Joel',
                'apellido' => 'Gabino',
                'ci' => '0980980987',
                'email' => 'joel@gmail.com',
                'contrasena' => '12345678',
                'tipo' => 'Tecnico',
                'usuario_asignado' => 'joel',
                'especialidad' => 'Mantenimiento',
                'estado' => 'Activo'
            ]
        ];

        foreach ($usuarios as $usuario) {
            $this->insertarUsuarioSiNoExiste($usuario);
        }
    }

    private function insertarUsuarioSiNoExiste($datosUsuario) {
        // Verificar si el usuario ya existe por email o CI
        if (!$this->usuarioExiste($datosUsuario['email'], $datosUsuario['ci'])) {
            $this->insertarUsuario($datosUsuario);
            return true;
        }
        return false;
    }

    private function usuarioExiste($email, $ci) {
        $emailEnc = CifradoHelper::encriptar($email);
        $ciEnc = CifradoHelper::encriptar($ci);
        
        $query = "SELECT ID_Usuario FROM usuario WHERE email = ? OR ci = ?";
        $stmt = $this->connection->prepare($query);
        $stmt->bind_param("ss", $emailEnc, $ciEnc);
        $stmt->execute();
        $stmt->store_result();
        
        $existe = $stmt->num_rows > 0;
        $stmt->close();
        
        return $existe;
    }

    private function insertarUsuario($datos) {
        // Encriptar datos sensibles
        $ciEnc = CifradoHelper::encriptar($datos['ci']);
        $emailEnc = CifradoHelper::encriptar($datos['email']);
        $contrasenaHash = password_hash($datos['contrasena'], PASSWORD_BCRYPT);

        // Obtener UUID para el nuevo usuario
        $uuidResult = $this->connection->query("SELECT UUID() as uuid");
        $uuidRow = $uuidResult->fetch_assoc();
        $userId = $uuidRow['uuid'];
        $uuidResult->close();

        // Insertar en usuario
        $query = "INSERT INTO usuario (ID_Usuario, nombre, apellido, ci, email, contrasena, tipo, usuario_asignado, estado)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
        $stmt = $this->connection->prepare($query);
        $stmt->bind_param("sssssssss", 
            $userId,
            $datos['nombre'],
            $datos['apellido'],
            $ciEnc,
            $emailEnc,
            $contrasenaHash,
            $datos['tipo'],
            $datos['usuario_asignado'],
            $datos['estado']
        );
        
        if (!$stmt->execute()) {
            error_log("Error al insertar usuario: " . $stmt->error);
            $stmt->close();
            return false;
        }
        $stmt->close();

        switch ($datos['tipo']) {
            case 'Tecnico':
                if (isset($datos['especialidad'])) {
                    $this->insertarTecnico($userId, $datos['especialidad']);
                }
                break;
            case 'Logistica':
                $this->insertarLogistica($userId);
                break;
        }

        return $userId;
    }

    private function insertarTecnico($userId, $especialidad) {
        $query = "INSERT INTO Tecnico (ID_Tecnico, Especialidad) VALUES (?, ?)";
        $stmt = $this->connection->prepare($query);
        $stmt->bind_param("ss", $userId, $especialidad);
        if (!$stmt->execute()) {
            error_log("Error al insertar técnico: " . $stmt->error);
        }
        $stmt->close();
    }

    private function insertarLogistica($userId) {
        $query = "INSERT INTO Logistica (ID_Logistica) VALUES (?)";
        $stmt = $this->connection->prepare($query);
        $stmt->bind_param("s", $userId);
        if (!$stmt->execute()) {
            error_log("Error al insertar logística: " . $stmt->error);
        }
        $stmt->close();
    }
}