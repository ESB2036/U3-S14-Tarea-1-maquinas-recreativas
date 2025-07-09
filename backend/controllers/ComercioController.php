<?php
require_once __DIR__ . '/../services/ComercioService.php';

class ComercioController {
    private $service;

    public function __construct() {
        $this->service = new ComercioService();
    }

    public function register() {
        $data = json_decode(file_get_contents('php://input'), true);
        $response = $this->service->registrarComercio($data);
        $this->sendResponse($response);
    }

    public function obtenerComercios() {
        $response = $this->service->obtenerComercios();
        $this->sendResponse($response);
    }

    private function sendResponse($response) {
        header('Content-Type: application/json');
        echo json_encode($response);
    }
}