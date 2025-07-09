<?php
// Definición de constantes para la configuración de la base de datos
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'bd_recrea_sys');

require_once __DIR__ . '/../helper/CifradoHelper.php';
require_once __DIR__ . '/Inserter.php'; // Asegúrate de que la ruta sea correcta

class Database {
    private $connection;

    public function __construct() {
        $this->connection = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
        
        if ($this->connection->connect_error) {
            die("Connection failed: " . $this->connection->connect_error);
        }

        $this->connection->set_charset("utf8mb4");

        // Insertar usuarios iniciales con validación
        $this->insertarUsuariosIniciales();
    }

    private function insertarUsuariosIniciales() {
        $lockFile = __DIR__ . '/.usuarios_iniciales.lock';
        
        // Verificar si ya se ejecutó
        if (!file_exists($lockFile)) {
            $inserter = new Inserter($this->connection);
            
            try {
                $inserter->insertarUsuariosIniciales();
                file_put_contents($lockFile, "Usuarios iniciales creados el " . date("Y-m-d H:i:s"));
            } catch (Exception $e) {
                error_log("Error al insertar usuarios iniciales: " . $e->getMessage());
            }
        }
    }

    public function getConnection() {
        return $this->connection;
    }

    public function closeConnection() {
        if ($this->connection) {
            $this->connection->close();
        }
    }

    public function query($sql) {
        $result = $this->connection->query($sql);
        if (!$result) {
            error_log("Error en consulta SQL: " . $this->connection->error);
            error_log("Consulta: " . $sql);
        }
        return $result;
    }

    public function escapeString($string) {
        return $this->connection->real_escape_string($string);
    }

    public function getLastInsertId() {
        return $this->connection->insert_id;
    }
}
?>