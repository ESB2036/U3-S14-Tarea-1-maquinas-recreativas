<?php
// Configuración de cabeceras CORS (Cross-Origin Resource Sharing):
header("Access-Control-Allow-Origin: *"); // Permite solicitudes desde cualquier origen.
header("Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS"); // Métodos HTTP permitidos.
header("Content-Type: application/json"); // Indica que todas las respuestas serán JSON.

/**
 * Procesamiento de la URL solicitada:
 * 1. Obtiene la ruta completa de la solicitud.
 * 2. Elimina el path base y 'index.php' para obtener la ruta limpia de la API
 */
$requestUri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH); // Ej: '/maquinas-recreativas/backend/public/api/usuario/login'
$basePath = '/maquinas-recreativas/backend/public'; // Ruta base de tu aplicación
$apiRoute = str_replace("$basePath/index.php", '', $requestUri); // Elimina el path base

// Incluye el archivo de rutas y pasa el control al enrutador principal:
require __DIR__.'/../api/routes.php'; // Carga el archivo de definición de rutas (routes.php).
routeRequest($apiRoute, $_SERVER['REQUEST_METHOD']); // Llama a la función de enrutamiento.
?>