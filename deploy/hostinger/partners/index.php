<?php
/**
 * MegaBachatMart Partners Subdomain Forwarder / Proxy
 * Location: /home/u369924234/domains/mymbmart.com/public_html/partners/index.php
 */

$requestUri = $_SERVER['REQUEST_URI'];
$cleanUri = ($requestUri === '/' || $requestUri === '') ? '' : $requestUri;

// If internal proxy via cURL / port 3000 is desired:
$nodePort = 3000;

if (preg_match('#^/(_next|api|images|static|favicon\.ico|manifest\.json|robots\.txt|llms\.txt)#', $cleanUri)) {
    $targetPath = $cleanUri;
} elseif (preg_match('#^/shop/#', $cleanUri)) {
    $targetPath = $cleanUri;
} elseif ($cleanUri === '/login') {
    $targetPath = '/shop/login';
} elseif ($cleanUri === '/portal') {
    $targetPath = '/shop/portal';
} elseif ($cleanUri === '/register' || $cleanUri === '/apply') {
    $targetPath = '/shop/register';
} else {
    $targetPath = "/partners{$cleanUri}";
}

$backendUrl = "http://127.0.0.1:{$nodePort}{$targetPath}";

$ch = curl_init($backendUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 3);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($response !== false && $httpCode >= 200 && $httpCode < 400) {
    header("Content-Type: text/html; charset=UTF-8");
    echo $response;
    exit;
}

// Fallback redirect to main domain partners route
header("Location: https://mymbmart.com" . $targetPath, true, 302);
exit;
