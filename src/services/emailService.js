/**
 * =============================================================
 *  Služba pro odesílání formulářů (Podpora) PŘÍMO Z APLIKACE
 *  – BEZ použití mailového klienta (mailto:)
 * =============================================================
 *
 *  Aplikace pošle data pomocí HTTPS POST na serverový skript
 *  na pupen.org:
 *    POST https://www.pupen.org/apps/odesli-mail.php
 *
 *  Ten (PHP skript odesli-mail.php v rootu projektu) přepošle
 *  e-mail přes SMTP z adresy apps@pupen.org na tech@pupen.org.
 *
 *  Pokud HTTP požadavek selže (offline, chyba serveru) –
 *  automaticky se použije FALLBACK na původní mailto: odkaz,
 *  aby uživatel vůbec nic nepřišel o svůj dotaz.
 */

/** Kam se mají všechny formuláře doručit */
const EMAIL_PRIIMCE = "tech@pupen.org";
/** Kdo odesílá (zobrazí se jako From) */
const EMAIL_ODESILATELE = "apps@pupen.org";
/** Serverový endpoint, který e-mail přepošle přes SMTP */
const MAIL_ENDPOINT = "https://www.pupen.org/apps/odesli-mail.php";

/**
 * Sestaví HTTP payload pro serverový odesílací skript.
 * Zachová všechny pole, včetně 8 polí Návrhu nového kontaktu (#23).
 *
 * @param {object} data
 * @returns {object} Payload, co se pošle jako JSON
 */
export const sestavHTTPayload = (data) => {
  const {
    typZpravyNazev,
    jmeno,
    email,
    textZpravy,
    novyKontakt,
    zarizeniInfo
  } = data;

  // Předmět e-mailu (tak jak to přijde do doručené schránky)
  const subject = novyKontakt?.jmeno
    ? `[Linka] Návrh kontaktu: ${novyKontakt.jmeno}`
    : `[Linka] ${typZpravyNazev || "Nový dotaz"}${jmeno ? ` – ${jmeno}` : ""}`;

  // Tělo e-mailu – formátované řádky
  const bodyRadky = [];
  bodyRadky.push(`Typ dotazu: ${typZpravyNazev || "—"}`);
  bodyRadky.push(`Od uživatele: ${jmeno || "—"}`);
  bodyRadky.push(`E-mail na odpověď: ${email || "—"}`);
  bodyRadky.push("");

  if (novyKontakt) {
    bodyRadky.push("------ NÁVRH NOVÉHO KONTAKTU ------");
    bodyRadky.push(`Jméno a tituly:  ${novyKontakt.jmeno || "—"}`);
    bodyRadky.push(`Oddělení:       ${novyKontakt.oddeleni || "—"}`);
    bodyRadky.push(`Fakulta:         ${novyKontakt.fakulta || "—"}`);
    bodyRadky.push(`Linka (4 čísla): ${novyKontakt.linka || "—"}`);
    bodyRadky.push(`Telefon:         ${novyKontakt.cislo || "—"}`);
    bodyRadky.push(`E-mail:          ${novyKontakt.email || "—"}`);
    bodyRadky.push(`Budova/místnost: ${novyKontakt.budova || "—"}`);
    bodyRadky.push(`Zdroj (URL):     ${novyKontakt.zdroj || "—"}`);
    bodyRadky.push("---------------------------------");
    bodyRadky.push("");
  }

  if (textZpravy) {
    bodyRadky.push("------ TEXT DOTAZU ------");
    bodyRadky.push(textZpravy);
    bodyRadky.push("-------------------------");
    bodyRadky.push("");
  }

  if (zarizeniInfo) {
    bodyRadky.push("------ INFORMACE O ZAŘÍZENÍ (volitelně) ------");
    Object.entries(zarizeniInfo).forEach(([klic, hodnota]) => {
      if (hodnota !== null && hodnota !== undefined && hodnota !== "") {
        bodyRadky.push(`${klic}:  ${String(hodnota)}`);
      }
    });
    bodyRadky.push("----------------------------------------------");
  }

  const message = bodyRadky.join("\n");

  // Serverový PHP skript očekává JSON s těmito klíči:
  //   from, to, subject, message, replyTo
  return {
    from: EMAIL_ODESILATELE,
    to: EMAIL_PRIIMCE,
    subject,
    message,
    replyTo: email || "",
    // Příloha: strukturovaná data pro případné zpracování na serveru
    data: {
      typZpravy: typZpravyNazev || "—",
      jmeno: jmeno || "",
      email: email || "",
      textZpravy: textZpravy || "",
      novyKontakt: novyKontakt || null,
      zarizeniInfo: zarizeniInfo || null
    }
  };
};

/**
 * Vrátí mailto: URL – fallback pro selhání HTTP. Funguje na všech
 * platformách stejně.
 *
 * @param {object} data Formulářová data (stejná jako u sestavHTTPayload)
 * @returns {string} mailto:…. URL k otevření
 */
export const sestavMailtoURL = (data) => {
  const {
    typZpravyNazev,
    jmeno,
    email,
    textZpravy,
    novyKontakt
  } = data;

  const subject = novyKontakt?.jmeno
    ? `[Linka] Návrh kontaktu: ${novyKontakt.jmeno}`
    : `[Linka] ${typZpravyNazev || "Nový dotaz"}${jmeno ? ` – ${jmeno}` : ""}`;

  const bodyRadky = [];
  bodyRadky.push(`Typ dotazu: ${typZpravyNazev || "—"}`);
  bodyRadky.push(`Jméno: ${jmeno || "—"}`);
  bodyRadky.push(`E-mail na odpověď: ${email || "—"}`);
  bodyRadky.push("");

  if (novyKontakt) {
    bodyRadky.push("------ NÁVRH NOVÉHO KONTAKTU ------");
    bodyRadky.push(`Jméno a tituly:  ${novyKontakt.jmeno || "—"}`);
    bodyRadky.push(`Oddělení:       ${novyKontakt.oddeleni || "—"}`);
    bodyRadky.push(`Fakulta:         ${novyKontakt.fakulta || "—"}`);
    bodyRadky.push(`Linka (4 čísla): ${novyKontakt.linka || "—"}`);
    bodyRadky.push(`Telefon:         ${novyKontakt.cislo || "—"}`);
    bodyRadky.push(`E-mail:          ${novyKontakt.email || "—"}`);
    bodyRadky.push(`Budova/místnost: ${novyKontakt.budova || "—"}`);
    bodyRadky.push(`Zdroj (URL):     ${novyKontakt.zdroj || "—"}`);
    bodyRadky.push("---------------------------------");
    bodyRadky.push("");
  }

  if (textZpravy) bodyRadky.push(`Popis:\n\n${textZpravy}\n`);

  const subjectEncoded = encodeURIComponent(subject);
  const bodyEncoded = encodeURIComponent(bodyRadky.join("\n"));
  const ccEncoded = email ? `&cc=${encodeURIComponent(email)}` : "";

  return `mailto:${EMAIL_PRIIMCE}?subject=${subjectEncoded}&body=${bodyEncoded}${ccEncoded}`;
};

/**
 * Pokusí se ODESLAT FORMULÁŘ PŘES HTTP (serverový PHP skript na pupen.org).
 * Pokud to nejde, automaticky spustí FALLBACK (Linking.openURL
 * s mailto: odkazem, který otevře uživatelův mail klient).
 *
 * @param {object} data Formulářová data
 * @returns {Promise<{ uspech: boolean, pouzito: "HTTP" | "MAILTO", chyba?: string }>}
 */
export const odeslatFormular = async (data, { otevreMailto = (url) => {} } = {}) => {
  try {
    const payload = sestavHTTPayload(data);

    // 1. Nejdříve zkusíme HTTP POST na serverový skript.
    //    Ten přepošle e-mail přes SMTP z apps@pupen.org na tech@pupen.org
    //    BEZ jakéhokoliv mail klienta.
    const odpoved = await fetch(MAIL_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify(payload)
    });

    let odpovedJSON = null;
    try { odpovedJSON = await odpoved.json(); } catch (_) {}

    if (odpoved.ok && (odpovedJSON?.success === true || odpovedJSON?.ok === true)) {
      // Úspěch! 🎉 Dorazilo přímo na tech@pupen.org
      return { uspech: true, pouzito: "HTTP" };
    }

    // Server vrátil ne-2xx nebo chybu. Pokusíme se fallbacknout na mailto.
    const zpravaChyby = odpovedJSON?.message
      || odpovedJSON?.error
      || `HTTP ${odpoved.status} ${odpoved.statusText}`;
    throw new Error(zpravaChyby);

  } catch (chybaHTTP) {
    // 2. FALLBACK – otevřeme mail klienta uživatele.
    //    Uživatel tedy svoji zprávu vždy může odeslat, i když
    //    síť / server nefungují.
    try {
      const fallbackUrl = sestavMailtoURL(data);
      otevreMailto(fallbackUrl);
    } catch (_) {}
    return {
      uspech: false,
      pouzito: "MAILTO",
      chyba: chybaHTTP?.message || "Neznámá chyba"
    };
  }
};

export default {
  odeslatFormular,
  sestavHTTPayload,
  sestavMailtoURL,
  EMAIL_PRIIMCE,
  EMAIL_ODESILATELE,
  MAIL_ENDPOINT
};
