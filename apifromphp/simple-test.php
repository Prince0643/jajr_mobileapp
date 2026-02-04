<?php
// Simple test to see how data is being received
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

echo json_encode([
    'success' => true,
    'debug_info' => [
        'method' => $_SERVER['REQUEST_METHOD'],
        'content_type' => $_SERVER['CONTENT_TYPE'] ?? 'not set',
        'post_data_raw' => file_get_contents('php://input'),
        'post_array' => $_POST,
        'get_array' => $_GET,
        'request_method' => $_SERVER['REQUEST_METHOD'],
        'all_server_vars' => [
            'CONTENT_TYPE' => $_SERVER['CONTENT_TYPE'] ?? 'not set',
            'CONTENT_LENGTH' => $_SERVER['CONTENT_LENGTH'] ?? 'not set',
            'REQUEST_METHOD' => $_SERVER['REQUEST_METHOD'],
        ]
    ],
    'message' => 'Data received successfully'
]);
?>
