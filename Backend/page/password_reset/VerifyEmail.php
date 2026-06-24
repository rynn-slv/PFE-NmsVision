<?php
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../../config/dbconn.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require __DIR__ . '/PHPMailer/src/Exception.php';
require __DIR__ . '/PHPMailer/src/PHPMailer.php';
require __DIR__ . '/PHPMailer/src/SMTP.php';

$data = json_decode(file_get_contents("php://input"), true);
$email = isset($data['email']) ? trim($data['email']) : '';

if (empty($email)) {
    echo json_encode(['success' => false, 'message' => 'Email is required.']);
    exit();
}

try {
    $conn = Database::get();

    // 1. Verify User Exists
    $stmt = $conn->prepare("SELECT id FROM users WHERE email = ? LIMIT 1");
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        echo json_encode(['success' => false, 'message' => 'This email is not registered.']);
        exit();
    }

    // 2. Prepare Reset Data
    $code = random_int(100000, 999999);
    $expiresAt = date('Y-m-d H:i:s', strtotime('+2 minutes'));

    $conn->beginTransaction();
    $conn->prepare("DELETE FROM password_resets WHERE email = ?")->execute([$email]);
    $conn->prepare("INSERT INTO password_resets (email, code, expires_at) VALUES (?, ?, ?)")->execute([$email, $code, $expiresAt]);

    // 3. Setup PHPMailer (Using YOUR Personal Gmail)
    $mail = new PHPMailer(true);
    $mail->isSMTP();
    $mail->Host       = 'smtp.gmail.com';
    $mail->SMTPAuth   = true;
    $mail->Username   = 'nmsvisionesst@gmail.com'; 
    $mail->Password   = 'nhlmqcvizfuuiblb'; // Your generated App Password
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port       = 587;
    
    // SPEED FIXES
    $mail->Timeout = 15; 
    $mail->SMTPOptions = array(
        'ssl' => array(
            'verify_peer' => false,
            'verify_peer_name' => false,
            'allow_self_signed' => true
        )
    );

    $mail->setFrom('nmsvisionesst@gmail.com', 'NMS Vision Support');
    $mail->addAddress($email);

    $mail->isHTML(true);
    $mail->Subject = 'NMS Vision | Security Verification Code';
    
    // High-End Professional Branded Template (Responsive)
    $mail->Body = "
        <!DOCTYPE html>
        <html>
        <head>
            <meta name='viewport' content='width=device-width, initial-scale=1.0'>
            <style>
                @media only screen and (max-width: 600px) {
                    .container { width: 100% !important; padding: 20px !important; }
                    .code-box { font-size: 28px !important; letter-spacing: 6px !important; padding: 15px 20px !important; }
                    .header h1 { font-size: 24px !important; }
                }
            </style>
        </head>
        <body style='margin: 0; padding: 0; background-color: #020617; font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, Helvetica, Arial, sans-serif;'>
            <table width='100%' border='0' cellspacing='0' cellpadding='0' style='background-color: #020617;'>
                <tr>
                    <td align='center' style='padding: 40px 10px;'>
                        <!-- Main Container with Grid Aesthetic -->
                        <table class='container' width='500' border='0' cellspacing='0' cellpadding='0' style='background-color: #0f172a; border-radius: 24px; overflow: hidden; border: 1px solid rgba(255, 255, 255, 0.08); box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);'>
                            <!-- Header / Logo Section with Grid Background -->
                            <tr>
                                <td align='center' style='padding: 50px 40px 20px; background-color: #0f172a; background-image: radial-gradient(circle, rgba(56, 189, 248, 0.1) 1px, transparent 1px); background-size: 20px 20px;'>
                                    <!-- NMS Vision Brand Logo -->
                                    <div style='margin-bottom: 20px;'>
                                        <table border='0' cellspacing='0' cellpadding='0'>
                                            <tr>
                                                <td style='background: #1e293b; padding: 12px; border-radius: 16px; border: 1px solid rgba(56, 189, 248, 0.3);'>
                                                    <img src='https://img.icons8.com/fluency-systems-filled/96/38bdf8/wifi.png' alt='NMS Vision' width='40' height='40' style='display: block;'>
                                                </td>
                                            </tr>
                                        </table>
                                    </div>
                                    <h1 style='margin: 0; color: #38bdf8; font-size: 28px; font-weight: 800; letter-spacing: -1px;'>NMS <span style='color: #f8fafc;'>Vision</span></h1>
                                    <p style='margin: 8px 0 0; color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 3px; font-weight: 700;'>Security & Monitoring</p>
                                </td>
                            </tr>
                            
                            <!-- Content -->
                            <tr>
                                <td style='padding: 20px 40px 40px;'>
                                    <div style='background: rgba(255, 255, 255, 0.02); border-radius: 20px; padding: 35px; border: 1px solid rgba(255, 255, 255, 0.05); text-align: center;'>
                                        <p style='margin: 0 0 35px; color: #94a3b8; font-size: 14px; line-height: 1.6;'>A password reset was requested for your account. Use the unique security code below to authorize the change.</p>
                                        
                                        <!-- Code Box -->
                                        <div style='margin-bottom: 30px;'>
                                            <div class='code-box' style='display: inline-block; background: #1e293b; border: 1px solid rgba(56, 189, 248, 0.5); color: #38bdf8; padding: 18px 35px; border-radius: 16px; font-size: 38px; font-weight: 800; letter-spacing: 10px; font-family: \"Courier New\", Courier, monospace; box-shadow: 0 0 30px rgba(56, 189, 248, 0.15);'>
                                                $code
                                            </div>
                                        </div>
                                        
                                        <!-- Expiry Badge -->
                                        <table width='100%' border='0' cellspacing='0' cellpadding='0'>
                                            <tr>
                                                <td align='center'>
                                                    <div style='display: inline-block; background: rgba(244, 63, 94, 0.1); padding: 8px 16px; border-radius: 100px; border: 1px solid rgba(244, 63, 94, 0.2);'>
                                                        <p style='margin: 0; color: #f43f5e; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;'>
                                                            <img src='https://img.icons8.com/fluency-systems-filled/24/f43f5e/time.png' width='14' height='14' style='vertical-align: middle; margin-top: -2px; margin-right: 6px;'>
                                                            Expires in 2 minutes
                                                        </p>
                                                    </div>
                                                </td>
                                            </tr>
                                        </table>
                                    </div>
                                    
                                    <!-- Footer -->
                                    <div style='margin-top: 40px; text-align: center;'>
                                        <p style='margin: 0 0 20px; color: #475569; font-size: 12px; line-height: 1.6;'>
                                            If you did not request this, please ignore this email or <a href='#' style='color: #38bdf8; text-decoration: none; font-weight: 600;'>contact support</a>.
                                        </p>
                                        <div style='border-top: 1px solid rgba(255, 255, 255, 0.05); padding-top: 30px;'>
                                            <img src='https://img.icons8.com/fluency-systems-filled/48/334155/verified-badge.png' width='22' height='22' style='margin-bottom: 12px; opacity: 0.4;'>
                                            <p style='margin: 0; color: #334155; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px;'>
                                                &copy; " . date('Y') . " NMS Vision Security Labs
                                            </p>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
    ";

    $mail->send();
    $conn->commit();

    echo json_encode(['success' => true]);

} catch (Exception $e) {
    if (isset($conn) && $conn->inTransaction()) $conn->rollBack();
    echo json_encode(['success' => false, 'message' => 'Mailer Error: ' . $mail->ErrorInfo]);
}
