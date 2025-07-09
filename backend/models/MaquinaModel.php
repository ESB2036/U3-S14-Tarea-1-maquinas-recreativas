<?php
require_once __DIR__ . '/../config/database.php';

class MaquinaModel {
    private $db;

    public function __construct() {
        $this->db = new Database();
    }

    public function registrarMaquina($nombre, $tipo, $idEnsamblador, $idComprobador, $idComercio) {
        $conn = $this->db->getConnection();
        
        $this->verificarTecnico($idEnsamblador);
        $this->verificarTecnico($idComprobador);
        
        $sql = "CALL sp_registrar_maquina(?, ?, ?, ?, ?, @p_id_maquina)";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("sssss", $nombre, $tipo, $idEnsamblador, $idComprobador, $idComercio);

        if ($stmt->execute()) {
            $result = $conn->query("SELECT @p_id_maquina as id");
            $row = $result->fetch_assoc();
            return $row['id'];
        }
        return false;
    }

    private function verificarTecnico($idTecnico) {
        $conn = $this->db->getConnection();
        $sql = "SELECT COUNT(*) as count FROM Tecnico WHERE ID_Tecnico = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("s", $idTecnico);
        $stmt->execute();
        $result = $stmt->get_result();
        $row = $result->fetch_assoc();
        
        if ($row['count'] == 0) {
            throw new Exception("El técnico con ID $idTecnico no existe o no es un técnico válido");
        }
    }

    public function generarPlaca($idTecnico) {
        $conn = $this->db->getConnection();
        
        $checkSql = "SELECT COUNT(*) as count FROM usuario WHERE ID_Usuario = ?";
        $checkStmt = $conn->prepare($checkSql);
        $checkStmt->bind_param("s", $idTecnico);
        $checkStmt->execute();
        $result = $checkStmt->get_result();
        $row = $result->fetch_assoc();
        
        if ($row['count'] == 0) {
            throw new Exception("El técnico con ID $idTecnico no existe");
        }
        
        $sql = "CALL sp_Generar_Placa_Maquina_Recreativa(?, @numero_placa, @id_componente)";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("s", $idTecnico);
        
        if ($stmt->execute()) {
            $result = $conn->query("SELECT @numero_placa as placa, @id_componente as id_componente");
            return $result->fetch_assoc();
        }
        return null;
    }

    public function registrarMontajeComponente($idMaquina, $idComponente, $idTecnico, $detalle = '') {
        $conn = $this->db->getConnection();
        
        try {
            $sql = "INSERT INTO montaje (fecha, ID_Maquina, ID_Componente, ID_Tecnico, detalle) 
                    VALUES (NOW(), ?, ?, ?, ?)";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("ssss", $idMaquina, $idComponente, $idTecnico, $detalle);
            
            if (!$stmt->execute()) {
                error_log("Error al registrar montaje: " . $stmt->error);
                return false;
            }
            
            return true;
        } catch (Exception $e) {
            error_log("Excepción al registrar montaje: " . $e->getMessage());
            return false;
        }
    }

    public function actualizarEstadoMaquina($idMaquina, $estado, $etapa = null) {
        $conn = $this->db->getConnection();
        
        $sql = "CALL sp_actualizar_estado_maquina(?, ?, ?)";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("sss", $idMaquina, $estado, $etapa);
        
        return $stmt->execute();
    }

    public function asignarTecnicoMantenimiento($idMaquina, $idTecnico) {
        $conn = $this->db->getConnection();
        
        $sql = "CALL sp_asignar_tecnico_mantenimiento(?, ?)";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("ss", $idMaquina, $idTecnico);
        
        return $stmt->execute();
    }

    public function obtenerMaquinasPorTecnicoEnsamblador($idTecnico) {
        $conn = $this->db->getConnection();
        
        $sql = "CALL sp_obtener_maquinas_por_tecnico_ensamblador(?)";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("s", $idTecnico);
        $stmt->execute();
        
        $result = $stmt->get_result();
        $maquinas = [];
        
        while ($row = $result->fetch_assoc()) {
            $maquinas[] = $row;
        }
        
        return $maquinas;
    }

    public function obtenerMaquinasPorTecnicoComprobador($idTecnico) {
        $conn = $this->db->getConnection();
        
        $sql = "CALL sp_obtener_maquinas_por_tecnico_comprobador(?)";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("s", $idTecnico);
        $stmt->execute();
        
        $result = $stmt->get_result();
        $maquinas = [];
        
        while ($row = $result->fetch_assoc()) {
            $maquinas[] = $row;
        }
        
        return $maquinas;
    }

    public function obtenerMaquinasPorTecnicoMantenimiento($idTecnico) {
        $conn = $this->db->getConnection();
        
        $sql = "CALL sp_obtener_maquinas_por_tecnico_mantenimiento(?)";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("s", $idTecnico);
        $stmt->execute();
        
        $result = $stmt->get_result();
        $maquinas = [];
        
        while ($row = $result->fetch_assoc()) {
            $maquinas[] = $row;
        }
        
        return $maquinas;
    }

    public function obtenerMaquinasPorEstado($estado) {
        $conn = $this->db->getConnection();
        
        $sql = "CALL sp_obtener_maquinas_por_estado(?)";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("s", $estado);
        $stmt->execute();
        
        $result = $stmt->get_result();
        $maquinas = [];
        
        while ($row = $result->fetch_assoc()) {
            $maquinas[] = $row;
        }
        
        return $maquinas;
    }

    public function obtenerMaquinasPorEtapa($etapa) {
        $conn = $this->db->getConnection();
        
        $sql = "CALL sp_obtener_maquinas_por_etapa(?)";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("s", $etapa);
        $stmt->execute();
        
        $result = $stmt->get_result();
        $maquinas = [];
        
        while ($row = $result->fetch_assoc()) {
            $maquinas[] = $row;
        }
        
        return $maquinas;
    }

    public function obtenerMaquinaPorId($id) {
        $conn = $this->db->getConnection();
        
        $sql = "CALL sp_obtener_maquina_por_id(?)";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("s", $id);
        $stmt->execute();
        
        $result = $stmt->get_result();
        
        if ($result->num_rows > 0) {
            return $result->fetch_assoc();
        }
        
        return false;
    }

    public function obtenerMaquinasOperativasPorComercio($idComercio) {
        $conn = $this->db->getConnection();
        
        $sql = "CALL sp_obtener_maquinas_operativas_por_comercio(?)";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("s", $idComercio);
        $stmt->execute();
        
        $result = $stmt->get_result();
        $maquinas = [];
        
        while ($row = $result->fetch_assoc()) {
            $maquinas[] = $row;
        }
        
        return $maquinas;
    }

    public function obtenerMaquinasPorEtapaYEstado($etapa, $estado) {
        $conn = $this->db->getConnection();
        
        $sql = "CALL sp_obtener_maquinas_por_etapa_y_estado(?, ?)";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("ss", $etapa, $estado);
        $stmt->execute();
        
        $result = $stmt->get_result();
        $maquinas = [];
        
        while ($row = $result->fetch_assoc()) {
            $maquinas[] = $row;
        }
        
        return $maquinas;
    }

    public function obtenerComponentesMontaje($idMaquina) {
        $conn = $this->db->getConnection();
        
        $sql = "CALL sp_obtener_componentes_montaje(?)";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("s", $idMaquina);
        $stmt->execute();
        
        $result = $stmt->get_result();
        $componentes = [];
        
        while ($row = $result->fetch_assoc()) {
            $componentes[] = $row;
        }
        
        return $componentes;
    }
public function obtenerComponentesPorMaquina($idMaquina) {
    $conn = $this->db->getConnection();
    
    $sql = "CALL sp_obtener_componentes_por_maquina(?)";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("s", $idMaquina);
    $stmt->execute();
    
    $result = $stmt->get_result();
    $componentes = [];
    
    while ($row = $result->fetch_assoc()) {
        $componentes[] = $row;
    }
    
    return $componentes;
}
    public function obtenerComponentesMantenimiento($idMaquina) {
        $conn = $this->db->getConnection();
        
        $sql = "CALL sp_obtener_componentes_mantenimiento(?)";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("s", $idMaquina);
        $stmt->execute();
        
        $result = $stmt->get_result();
        $componentes = [];
        
        while ($row = $result->fetch_assoc()) {
            $componentes[] = $row;
        }
        
        return $componentes;
    }

    public function insertarMontaje($params) {
        $conn = $this->db->getConnection();
        
        $sql = "CALL sp_insertar_montaje(?, ?, ?, ?, @p_id_montaje)";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param(
            "ssss",
            $params['ID_Maquina'],
            $params['ID_Componente'],
            $params['ID_Tecnico'],
            $params['detalle']
        );

        if ($stmt->execute()) {
            $result = $conn->query("SELECT @p_id_montaje as id");
            $row = $result->fetch_assoc();
            return $row['id'];
        }
        
        return false;
    }
}
?>