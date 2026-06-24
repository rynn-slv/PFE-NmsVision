<?php
date_default_timezone_set('Africa/Algiers');

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require_once __DIR__ . '/../page/password_reset/PHPMailer/src/Exception.php';
require_once __DIR__ . '/../page/password_reset/PHPMailer/src/PHPMailer.php';
require_once __DIR__ . '/../page/password_reset/PHPMailer/src/SMTP.php';

class NotificationUtil {
    public static function sendOfflineAlert($adminEmail, $deviceName, $deviceIp) {
        $mail = new PHPMailer(true);

        try {
            // Server settings
            $mail->isSMTP();
            $mail->Host       = 'smtp.gmail.com';
            $mail->SMTPAuth   = true;
            $mail->Username   = 'nmsvisionesst@gmail.com'; 
            $mail->Password   = 'nhlmqcvizfuuiblb'; // Your generated App Password
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
            $mail->Port       = 587;
            
            // Speed & Compatibility Fixes
            $mail->Timeout = 15; 
            $mail->SMTPOptions = array(
                'ssl' => array(
                    'verify_peer' => false,
                    'verify_peer_name' => false,
                    'allow_self_signed' => true
                )
            );

            // Recipients
            $mail->setFrom('nmsvisionesst@gmail.com', 'NMS Vision Monitoring');
            $mail->addAddress($adminEmail);

            // Content
            $mail->isHTML(true);
            $mail->Subject = "CRITICAL ALERT: Device Offline - $deviceName";
            
            // Professional Premium Design Template
            $timestamp = date('Y-m-d H:i:s');
            $mail->Body = "
                <!DOCTYPE html>
                <html>
                <head>
                    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
                    <style>
                        @media only screen and (max-width: 600px) {
                            .container { width: 100% !important; padding: 15px !important; }
                            .header h1 { font-size: 22px !important; }
                        }
                    </style>
                </head>
                <body style='margin: 0; padding: 0; background-color: #020617; font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, Helvetica, Arial, sans-serif;'>
                    <table width='100%' border='0' cellspacing='0' cellpadding='0' style='background-color: #020617;'>
                        <tr>
                            <td align='center' style='padding: 40px 10px;'>
                                <table class='container' width='550' border='0' cellspacing='0' cellpadding='0' style='background-color: #0f172a; border-radius: 20px; overflow: hidden; border: 1px solid rgba(244, 63, 94, 0.2); box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6);'>
                                    <!-- Header with Critical Glow -->
                                    <tr>
                                        <td align='center' style='padding: 40px 40px 20px; background: linear-gradient(to bottom, rgba(244, 63, 94, 0.05), transparent);'>
                                            <div style='background: rgba(244, 63, 94, 0.1); padding: 15px; border-radius: 50%; display: inline-block; border: 1px solid rgba(244, 63, 94, 0.3); margin-bottom: 20px;'>
                                                <img src='https://img.icons8.com/fluency-systems-filled/96/f43f5e/error.png' alt='Alert' width='48' height='48' style='display: block;'>
                                            </div>
                                            <h1 style='margin: 0; color: #f43f5e; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;'>Device <span style='color: #f8fafc;'>Offline</span></h1>
                                            <p style='margin: 8px 0 0; color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 3px; font-weight: 700;'>Network Interruption Detected</p>
                                        </td>
                                    </tr>
                                    
                                    <!-- Alert Content -->
                                    <tr>
                                        <td style='padding: 20px 40px 40px;'>
                                            <div style='background: rgba(255, 255, 255, 0.02); border-radius: 16px; padding: 30px; border: 1px solid rgba(255, 255, 255, 0.05);'>
                                                <p style='margin: 0 0 25px; color: #94a3b8; font-size: 14px; line-height: 1.6; text-align: center;'>Our monitoring system has detected that a critical device in your network is no longer reachable.</p>
                                                
                                                <!-- Device Info Table -->
                                                <table width='100%' border='0' cellspacing='0' cellpadding='0' style='background: #1e293b; border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.05);'>
                                                    <tr>
                                                        <td style='padding: 15px 20px; border-bottom: 1px solid rgba(255, 255, 255, 0.05);'>
                                                            <p style='margin: 0; color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;'>Device Name</p>
                                                            <p style='margin: 4px 0 0; color: #f8fafc; font-size: 16px; font-weight: 600;'>$deviceName</p>
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td style='padding: 15px 20px; border-bottom: 1px solid rgba(255, 255, 255, 0.05);'>
                                                            <p style='margin: 0; color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;'>IP Address</p>
                                                            <p style='margin: 4px 0 0; color: #38bdf8; font-family: monospace; font-size: 16px; font-weight: 700;'>$deviceIp</p>
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td style='padding: 15px 20px;'>
                                                            <p style='margin: 0; color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;'>Detection Time</p>
                                                            <p style='margin: 4px 0 0; color: #f8fafc; font-size: 14px;'>$timestamp</p>
                                                        </td>
                                                    </tr>
                                                </table>
                                            </div>
                                            
                                            <!-- Footer Footer -->
                                            <div style='margin-top: 35px; text-align: center; border-top: 1px solid rgba(255, 255, 255, 0.05); padding-top: 25px;'>
                                                <p style='margin: 0; color: #334155; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px;'>
                                                    &copy; " . date('Y') . " NMS Vision &bull; Automated Monitoring
                                                </p>
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
            return true;
        } catch (Exception $e) {
            error_log("Mailer Error: " . $mail->ErrorInfo);
            return false;
        }
    }
}
