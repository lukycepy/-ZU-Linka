/**
 * =============================================================
 *  Služba pro odesílání formulářů (Podpora) PŘÍMO Z APLIKACE
 *  – BEZ použití mailového klienta (mailto:)
 * =============================================================
 *
 *  Implementace používá službu FORMSUBMIT.CO (dostupná zdarma
 *  pro nekomerční použití):
 *    POST https://formsubmit.co/ajax/{{ EMAIL PRÍJMCE }}
 *
 *  Při prvním úspěšném requestu FormSubmit pošle na adresu
 *  tech@pupen.org aktivační odkaz. Jakmile ho Lukáš v mailu
 *  1× potvrdí, následující formuláře chodí napřímo bez akce.
 *
 *  Pokud HTTP požadavek selže (CORS, offline, chyba serveru)
 *  – automaticky se použije FALLBACK na původní mailto: odkaz,
 *  aby uživatel vůbec nic nepřišel o svůj dotaz.
 */

/** Kam se mají všechny formuláře doručit */
const EMAIL_PRIIMCE = "tech@pupen.org";
/** Kdo odesílá (zobrazí se jako From ve FormSubmit) */
const EMAIL_ODESILATELE = "app@pupen.org";
/** Endpoint – FormSubmit JSON (AJAX varianta, ne přesměruje stránku) */
const FORMSUBMIT_ENDPOINT = `https://formsubmit.co/ajax/${EMAIL_PRIIMCE}`;

/**
 * Sestaví HTTP payload pro FormSubmit z formulářových dat.
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
    bodyRadky.push(`Linka (4 čísla): ${novyKontakt.klapka || "—"}`);
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

  // FormSubmit očekává: _subject (předmět), _replyTo (odpovědět na), _cc, _template a vlastní libovolná pole
  return {
    _subject: subject,
    _replyto: email || "",
    _cc: email ? email : undefined,      // uživateli pošleme kopii (pokud zadal email)
    _template: "table",                   // přehledné HTML formátování
    _sender: EMAIL_ODESILATELE,           // From: app@pupen.org

    // Lidsky čitelná pole (využijeme FormSubmit vlastní pole – zobrazí se
    // jak ve formátu e-mailu, tak v administraci FormSubmit)
    "📋 Typ dotazu": typZpravyNazev || "—",
    "👤 Jméno": jmeno || "—",
    "📧 E-mail": email || "—",
    ...(novyKontakt
      ? {
          "✨ NÁVRH NOVÉHO KONTAKTU": "--------",
          "  • Jméno a tituly": novyKontakt.jmeno || "—",
          "  • Oddělení": novyKontakt.oddeleni || "—",
          "  • Fakulta": novyKontakt.fakulta || "—",
          "  • Linka (4 čísla)": novyKontakt.klapka || "—",
          "  • Telefon": novyKontakt.cislo || "—",
          "  • E-mail": novyKontakt.email || "—",
          "  • Budova / místnost": novyKontakt.budova || "—",
          "  • Zdroj (URL)": novyKontakt.zdroj || "—"
        }
      : {}),
    "💬 Zpráva": textZpravy || "—",
    "ℹ️ Text celkem (formátovaný)": message,
    _message: message
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
    bodyRadky.push(`Linka (4 čísla): ${novyKontakt.klapka || "—"}`);
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
 * Pokusí se ODESLAT FORMULÁŘ PŘES HTTP (FormSubmit.co).
 * Pokud to nejde, automaticky spustí FALLBACK (Linking.openURL
 * s mailto: odkazem, který otevře uživatelův mail klient).
 *
 * @param {object} data Formulářová data
 * @returns {Promise<{ uspech: boolean, pouzito: "HTTP" | "MAILTO", chyba?: string }>}
 */
export const odeslatFormular = async (data, { otevreMailto = (url) => {} } = {}) => {
  try {
    const payload = sestavHTTPayload(data);

    // 1. Nejdříve zkusíme HTTP POST – pokud existuje síť a CORS je ok,
    //    e-mail dorazí z adresy app@pupen.org na tech@pupen.org
    //    BEZ jakéhokoliv mail klienta.
    const odpoved = await fetch(FORMSUBMIT_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify(payload)
    });

    let odpovedJSON = null;
    try { odpovedJSON = await odpoved.json(); } catch (_) {}

    if (odpoved.ok && odpovedJSON?.success === "true") {
      // Úspěch! 🎉 Dorazilo přímo na tech@pupen.org
      return { uspech: true, pouzito: "HTTP" };
    }

    // FormSubmit vrátil ne-2xx (např. e-mail ještě není potvrzený, nebo
    // rate-limit). Pokusíme se fallbacknout na mailto.
    const zpravaChyby = odpovedJSON?.message
      || `HTTP ${odpoved.status} ${odpoved.statusText}`;
    throw new Error(zpravaChyby);

  } catch (chybaHTTP) {
    // 2. FALLBACK – otevřeme mail klienta uživatele.
    //    Uživatel tedy svoji zprávu vždy může odeslat, i když
    //    síť / FormSubmit nefungují.
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
  FORMSUBMIT_ENDPOINT
};
