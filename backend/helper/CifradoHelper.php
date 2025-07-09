<?php
    define('ENCRYPT_METHOD', 'AES-256-CBC');
    define('SECRET_KEY', 'clave_super_segura');
    define('SECRET_IV', 'vector_inicial_seguro'); // 16 bytes al final.

    class CifradoHelper {
        public static function encriptar($cadena) {
            $key = hash('sha256', SECRET_KEY);
            $iv = substr(hash('sha256', SECRET_IV), 0, 16);
            return base64_encode(openssl_encrypt($cadena, ENCRYPT_METHOD, $key, 0, $iv));
        }

        public static function desencriptar($cadenaCifrada) {
            $key = hash('sha256', SECRET_KEY);
            $iv = substr(hash('sha256', SECRET_IV), 0, 16);
            return openssl_decrypt(base64_decode($cadenaCifrada), ENCRYPT_METHOD, $key, 0, $iv);
        }
    }
?>
