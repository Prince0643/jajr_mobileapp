<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$debug = [
    'method' => $_SERVER['REQUEST_METHOD'],
    'content_type' => $_SERVER['CONTENT_TYPE'] ?? 'not set',
    'content_length' => $_SERVER['CONTENT_LENGTH'] ?? 'not set',
    'raw_input' => file_get_contents('php://input'),
    'post_array' => $_POST,
    'get_array' => $_GET,
    'files' => $_FILES,
    'all_headers' => getallheaders()
];

// Try different ways to get POST data
$post_data = [];

// Method 1: Standard $_POST
if (!empty($_POST)) {
    $post_data = $_POST;
}

// Method 2: Raw JSON input
$raw_input = file_get_contents('php://input');
if (!empty($raw_input)) {
    $json_data = json_decode($raw_input, true);
    if ($json_data) {
        $post_data = array_merge($post_data, $json_data);
    }
    
    // Method 3: URL-encoded string
    if (strpos($raw_input, '=') !== false) {
        parse_str($raw_input, $url_data);
        $post_data = array_merge($post_data, $url_data);
    }
}

$debug['final_post_data'] = $post_data;
$debug['parsed_json'] = isset($json_data) ? $json_data : null;
$debug['parsed_urlencoded'] = isset($url_data) ? $url_data : null;

echo json_encode([
    'success' => true,
    'message' => 'POST test endpoint',
    'debug' => $debug,
    'received_data' => $post_data
]);
?>
