<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle OPTIONS preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$debug = [
    'method' => $_SERVER['REQUEST_METHOD'],
    'content_type' => $_SERVER['CONTENT_TYPE'] ?? 'not set',
    'raw_input' => file_get_contents('php://input'),
    'post_array' => $_POST,
    'get_array' => $_GET,
    'all_headers' => getallheaders()
];

// Try to parse JSON input
$json_input = json_decode(file_get_contents('php://input'), true);
if ($json_input) {
    $debug['parsed_json'] = $json_input;
}

// Parse URL-encoded string if present
$raw_input = file_get_contents('php://input');
if (strpos($raw_input, '=') !== false) {
    parse_str($raw_input, $parsed_params);
    $debug['parsed_urlencoded'] = $parsed_params;
}

echo json_encode([
    'success' => true,
    'message' => 'Debug endpoint working',
    'debug' => $debug
]);
?>
