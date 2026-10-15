<?php
/**
 * =============================================================
 *  odesli-mail.php – serverový endpoint pro aplikaci Linka
 *  (Studentský spolek Pupen, z.s.)
 * =============================================================
 *
 *  Nahrát na: https://www.pupen.org/apps/odesli-mail.php
 *
 *  Aplikace posílá data přes HTTPS POST (JSON). Tento skript
 *  přepošle e-mail přes SMTP z adresy apps@pupen.org na
 *  tech@pupen.org (nebo jiného příjemce).
 *
 *  Požadavek (JSON):
 *  {
 *    "from":    "apps@pupen.org",
 *    "to":      "tech@pupen.org",
 *    "subject": "[Linka] ...",
 *    "message": "text e-mailu...",
 *    "replyTo": "uzivatel@email.cz"
 *  }
 *
 *  Odpověď (JSON):
 *    úspěch: {"success": true}
 *    chyba:  {"success": false, "error": "důvod"}
 *
 *  Nastavení SMTP (hostitel, uživatel, heslo):
 *    definujte je níže v konstantách SMTP_*  nebo přes
 *    proměnné prostředí.
 * =============================================================
 */

// ==== KONFIGURACE SMTP (uprav dle hostitele pupen.org) ====
// Pokud hostitel podporuje PHP mail(), ponechte SMTP_POUZIT = false.
// Pokud potřebujete autentizaci přes SMTP, nastavte SMTP_POUZIT = true
// a vyplňte přihlašovací údaje k schránce apps@pupen.org.

define('SMTP_POUZIT', true);                   // true = přes SMTP, false = přes mail()
define('SMTP_HOST', 'smtp.pupen.org');          // SMTP server (např. smtp.pupen.org nebo smtp.seznam.cz)
define('SMTP_PORT', 587);                       // 587 (STARTTLS) nebo 465 (SSL) nebo 25
define('SMTP_SECURE', 'tls');                   // 'tls' nebo 'ssl' nebo '' (prázdné pro žádné)
define('SMTP_USERNAME', 'apps@pupen.org');      // uživatel pro SMTP (e-mailová schránka)
define('SMTP_PASSWORD', 'ZDE_DOPLN_HESLO');    // heslo k e-mailové schránce
define('SMTP_FROM', 'apps@pupen.org');          // odesílatel (From:)
define('SMTP_FROM_NAME', 'Linka od Pupenu');    // jméno odesílatele

// ==== BEZPEČNOST: omezení příjemců (whitelist) ====
// E-maily mohou být odeslány pouze na následující adresy.
// Pokud by někdo poslal jiný "to", použije se výchozí.
define('POVOLENI_PRIIMCI', ['tech@pupen.org', 'info@pupen.org']);
define('VYCHOZI_PRIIMCE', 'tech@pupen.org');

// ==== BEZPEČNOST: omezení počtu požadavků (anti-spam) ====
// Tento endpoint je veřejný, proto omezujeme počet odeslání z jedné IP adresy.
define('RATE_LIMIT_MAX', 5);      // maximální počet požadavků
define('RATE_LIMIT_OKNO', 600);   // v časovém okně (sekundy); 600 s = 10 minut

/**
 * Jednoduchý file-based rate limiter podle IP adresy.
 * Uchovává časová razítka posledních požadavků v dočasném souboru.
 *
 * @return bool true = požadavek povolen, false = překročen limit
 */
function rateLimitPovolen() {
    $ip = isset($_SERVER['REMOTE_ADDR']) ? $_SERVER['REMOTE_ADDR'] : 'neznama';
    $soubor = sys_get_temp_dir() . '/linka-ratelimit-' . md5($ip) . '.json';
    $nyni = time();

    $zaznamy = [];
    if (is_file($soubor)) {
        $obsah = @file_get_contents($soubor);
        $zaznamy = $obsah ? (json_decode($obsah, true) ?: []) : [];
    }

    // Ponecháme pouze záznamy spadající do aktuálního okna
    $zaznamy = array_values(array_filter($zaznamy, function ($t) use ($nyni) {
        return ($nyni - (int) $t) < RATE_LIMIT_OKNO;
    }));

    if (count($zaznamy) >= RATE_LIMIT_MAX) {
        return false;
    }

    $zaznamy[] = $nyni;
    @file_put_contents($soubor, json_encode($zaznamy), LOCK_EX);
    return true;
}

// ==== HTTP hlavičky (CORS + JSON) ====
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Accept');

// Preflight (OPTIONS) – ukonči hned
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Přijímáme pouze POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Pouze POST je povoleno.']);
    exit;
}

// Anti-spam: omezení počtu požadavků z jedné IP adresy
if (!rateLimitPovolen()) {
    http_response_code(429);
    echo json_encode(['success' => false, 'error' => 'Příliš mnoho požadavků. Zkuste to prosím později.']);
    exit;
}

// Přečteme tělo požadavku (JSON)
$raw = file_get_contents('php://input');
$data = json_decode($raw, true);

if (!$data) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Neplatný JSON požadavek.']);
    exit;
}

// ==== Ověření a sanitace vstupů ====
$to      = isset($data['to'])      ? trim($data['to'])      : VYCHOZI_PRIIMCE;
$from    = isset($data['from'])    ? trim($data['from'])    : SMTP_FROM;
$subject = isset($data['subject']) ? trim($data['subject']) : '[Linka] Nový dotaz';
$message = isset($data['message']) ? (string) $data['message'] : '';
$replyTo = isset($data['replyTo']) ? trim($data['replyTo']) : '';

// Ověření příjemce (whitelist)
if (!in_array($to, POVOLENI_PRIIMCI, true)) {
    $to = VYCHOZI_PRIIMCE;
}

// Základní validace
if ($message === '') {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Prázdná zpráva.']);
    exit;
}

// Omezení velikosti (100 KB)
if (strlen($message) > 102400) {
    http_response_code(413);
    echo json_encode(['success' => false, 'error' => 'Zpráva je příliš dlouhá.']);
    exit;
}

// Sanitace – zabráníme header injection v předmětu a odpovědi
$subject = str_replace(["\r", "\n"], '', $subject);
$replyTo = filter_var($replyTo, FILTER_VALIDATE_EMAIL) ? $replyTo : '';

// ==== ODESLÁNÍ E-MAILU ====
$odeslano = false;
$chyba = '';

if (SMTP_POUZIT) {
    // Pokusíme se použít PHPMailer, pokud je dostupný.
    $phpmailerCesta = __DIR__ . '/PHPMailer/src/PHPMailer.php';
    if (file_exists($phpmailerCesta)) {
        try {
            require $phpmailerCesta;
            require __DIR__ . '/PHPMailer/src/SMTP.php';
            require __DIR__ . '/PHPMailer/src/Exception.php';

            $mail = new PHPMailer\PHPMailer\PHPMailer(true);
            $mail->isSMTP();
            $mail->Host       = SMTP_HOST;
            $mail->SMTPAuth   = true;
            $mail->Username   = SMTP_USERNAME;
            $mail->Password   = SMTP_PASSWORD;
            $mail->SMTPSecure = SMTP_SECURE;
            $mail->Port       = SMTP_PORT;
            $mail->CharSet    = 'UTF-8';

            $mail->setFrom(SMTP_FROM, SMTP_FROM_NAME);
            $mail->addAddress($to);
            if ($replyTo) {
                $mail->addReplyTo($replyTo);
            }
            $mail->Subject = $subject;
            $mail->Body    = $message;
            $mail->AltBody = $message; // čistý text

            $odeslano = $mail->send();
        } catch (Exception $e) {
            $chyba = $mail->ErrorInfo ?: $e->getMessage();
        }
    } else {
        // PHPMailer není k dispozici – zkusíme nativní PHP mail() se SMTP přes ini
        // (funguje pouze pokud je PHP nakonfigurováno s SMTP v php.ini)
        $headers = [
            'From: ' . SMTP_FROM_NAME . ' <' . SMTP_FROM . '>',
            'MIME-Version: 1.0',
            'Content-Type: text/plain; charset=UTF-8',
            'X-Mailer: PHP/' . phpversion()
        ];
        if ($replyTo) {
            $headers[] = 'Reply-To: ' . $replyTo;
        }
        $odeslano = @mail($to, $subject, $message, implode("\r\n", $headers));
        if (!$odeslano) {
            $chyba = 'PHP mail() selhal – pravděpodobně není nakonfigurováno SMTP v php.ini. Nainstalujte PHPMailer do složky odesli-mail.php/PHPMailer/.';
        }
    }
} else {
    // Pouze PHP mail() bez SMTP
    $headers = [
        'From: ' . SMTP_FROM_NAME . ' <' . SMTP_FROM . '>',
        'MIME-Version: 1.0',
        'Content-Type: text/plain; charset=UTF-8',
        'X-Mailer: PHP/' . phpversion()
    ];
    if ($replyTo) {
        $headers[] = 'Reply-To: ' . $replyTo;
    }
    $odeslano = @mail($to, $subject, $message, implode("\r\n", $headers));
    if (!$odeslano) {
        $chyba = 'PHP mail() selhal.';
    }
}

// ==== ODPOVĚĎ ====
if ($odeslano) {
    http_response_code(200);
    echo json_encode(['success' => true]);
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $chyba ?: 'Neznámá chyba při odesílání.']);
}
