<?php
class Database {
    private static $connection = null;

    public static function get() {
        if (self::$connection === null) {
            $host = '127.0.0.1';
            $dbname = 'NmsVision';    // Changed from 'medicalapp' to 'NmsVision'
            $user = 'root';
            $pass = '';

            try {
                self::$connection = new PDO(
                    "mysql:host={$host};dbname={$dbname};charset=utf8mb4",
                    $user,
                    $pass,
                    [
                        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                        PDO::ATTR_EMULATE_PREPARES => false
                    ]
                );
                self::$connection->exec("SET time_zone = '+01:00'");
            } catch (PDOException $e) {
                http_response_code(500);
                die(json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]));
            }
        }
        return self::$connection;
    }
}
?>