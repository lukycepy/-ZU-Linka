import { nactiKontakty, ulozKontakty } from "./storageService";
import { CONTACTS_URL } from "../data/defaultContacts";

// ============================================================================
// NORMALIZACE KONTAKTŮ Z WEBU
//
// Web může publikovat kontakty ve dvou formátech:
//   A) interní obálka { version, lastUpdated, contacts: [{ jmeno, linka, … }] }
//   B) ploché pole v českém exportu (czu_kontakty.json) s klíči jako
//      „Jméno (s tituly)", „Katedra / Pracoviště", „Pevná linka", „Linka"…
// Obě varianty převedeme na jednotné interní klíče, se kterými pracuje zbytek
// aplikace (jmeno, oddeleni, fakulta, mistnost, linka, telefon, mobil, email, id).
// ============================================================================

/**
 * Server odděluje více hodnot v jednom poli znakem „|".
 * @param {string} hodnota - Hodnota z JSONu
 * @returns {string[]} Jednotlivé hodnoty bez mezer navíc
 */
const rozdelHodnoty = (hodnota) =>
  String(hodnota ?? "")
    .split("|")
    .map((cast) => cast.replace(/\s+/g, " ").trim())
    .filter((cast) => cast !== "");

/**
 * Vrátí první hodnotu z pole oddělovaného „|".
 * @param {string} hodnota - Hodnota z JSONu
 * @returns {string} První hodnota nebo prázdný řetězec
 */
const prvniHodnota = (hodnota) => rozdelHodnoty(hodnota)[0] || "";

/**
 * Zjistí, zda má kontakt platnou (neprázdnou) hodnotu daného pole.
 * @param {*} hodnota - Kontrolovaná hodnota
 * @returns {boolean} Zda je hodnota vyplněná
 */
const jeVyplneno = (hodnota) =>
  hodnota !== undefined && hodnota !== null && String(hodnota).trim() !== "";

// Popisky, které do jmen pronikly při sběru dat z webových stránek
const SLOVA_NAVIC = /\b(Address|Adress|About|Adresa)\b/gi;

/**
 * Očistí jméno osoby od zbytků popisků ze scrapovaných stránek.
 * @param {string} hodnota - Jméno včetně titulů
 * @returns {string} Očištěné jméno
 */
const ocistiJmeno = (hodnota) =>
  String(hodnota || "")
    .replace(SLOVA_NAVIC, " ")
    .replace(/\s+/g, " ")
    // Odstraní slovo, které se po vyčištění zopakovalo (např. „Jana Jana")
    .replace(/\b(\S+)\s+\1\b/gi, "$1")
    .trim();

/**
 * Sjednotí telefonní číslo do tvaru bez mezer, který zvládne tel: odkaz.
 * @param {string} hodnota - Telefon z JSONu (např. „+420 224 382 593")
 * @returns {string} Telefon ve tvaru „+420224382593" nebo prázdný řetězec
 */
const normalizujTelefon = (hodnota) => {
  const surove = String(hodnota || "").trim();
  const cislice = surove.replace(/\D/g, "");
  if (!cislice) return "";
  // Čísla bez mezinárodní předvolby ponecháme tak, jak jsou
  if (!/^(\+|00)/.test(surove)) return cislice;
  return `+${cislice.replace(/^00/, "")}`;
};

/**
 * Získá 4místnou linku z hodnoty pole „Linka".
 * Server uvádí buď samotnou linku, víc linek oddělených „|",
 * nebo celé telefonní číslo – z něj použijeme poslední čtyři číslice.
 * @param {string} hodnota - Hodnota pole „Linka"
 * @returns {string} 4místná linka nebo prázdný řetězec
 */
const vytahniLinku = (hodnota) => {
  const hodnoty = rozdelHodnoty(hodnota);

  const presna = hodnoty.find((h) => /^\d{4}$/.test(h));
  if (presna) return presna;

  const delsi = hodnoty.find((h) => h.replace(/\D/g, "").length > 4);
  return delsi ? delsi.replace(/\D/g, "").slice(-4) : "";
};

// Pevné linky školy mají tvar +420 224 38X XXX, kde poslední čtyři číslice
// tvoří 4místnou linku. Z mobilních čísel linku nikdy neodvozujeme.
const PREVOD_PEVNE_LINKY = /^(?:\+?420)?22438(\d{4})$/;

/**
 * Odvodí 4místnou linku z pevné linky (když v datech chybí pole „Linka").
 * @param {string} telefon - Pevná linka
 * @returns {string} 4místná linka nebo prázdný řetězec
 */
const odvodLinkuZTelefonu = (telefon) => {
  const cislice = String(telefon || "").replace(/\D/g, "");
  const shoda = cislice.match(PREVOD_PEVNE_LINKY);
  return shoda ? shoda[1] : "";
};

// Zdroj uvádí katedru tělesné výchovy u většiny zaměstnanců (jde o doplňkovou
// výuku napříč fakultami). Jako pracoviště ji proto použijeme jen tehdy, když
// jiný údaj není k dispozici nebo kontakt na katedru tělesné výchovy skutečně patří.
const KATEDRA_TELESNE_VYCHOVY = "Katedra tělesné výchovy";
const FAKULTA_TELESNE_VYCHOVY = "KTV";

/**
 * Z hodnoty „Katedra / Pracoviště" vytáhne název pracoviště.
 * Server vrací víc kandidátů oddělených „|" a hierarchii oddělenou „ > ".
 * Proto upřednostňujeme kandidáta zařazeného pod fakultou kontaktu.
 * @param {string} hodnota - Hodnota pole „Katedra / Pracoviště"
 * @param {string} fakulta - Fakulta kontaktu (pole „Fakulta / Útvar")
 * @returns {string} Název pracoviště (katedry)
 */
const nazevPracoviste = (hodnota, fakulta) => {
  const kandidati = rozdelHodnoty(hodnota);
  if (kandidati.length === 0) return "";

  const naUrovne = (kandidat) =>
    kandidat
      .split(">")
      .map((cast) => cast.trim())
      .filter(Boolean);

  const dleFakulty = kandidati.find((k) => naUrovne(k)[0] === fakulta);
  const jineNezTelesna =
    fakulta === FAKULTA_TELESNE_VYCHOVY
      ? undefined
      : kandidati.find((k) => naUrovne(k)[0] !== KATEDRA_TELESNE_VYCHOVY);

  const uroven = naUrovne(dleFakulty || jineNezTelesna || kandidati[0]);

  // Odstraníme úvodní zkratku útvaru (např. „FAPPZ >")
  if (uroven.length > 1 && !uroven[0].includes(" ")) uroven.shift();

  // Hlubší úroveň, která jen rozvíjí předchozí (např. „Katedra X Sekretariát"),
  // není název pracoviště – v takovém případě vrátíme úroveň předchozí.
  for (let i = 0; i < uroven.length - 1; i += 1) {
    if (uroven[i + 1].startsWith(uroven[i])) return uroven[i];
  }
  return uroven[uroven.length - 1];
};

/**
 * Vypočítá číselný otisk textu (FNV-1a).
 * @param {string} text - Vstupní text
 * @returns {number} Otisk v rozsahu 0 – 4 294 967 295
 */
const vytvorHash = (text) => {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
};

/**
 * Vypočítá otisk seznamu kontaktů.
 * Slouží k rozpoznání změny dat i u souboru, který nemá vlastní číslo verze.
 * @param {Array<Object>} kontakty - Seznam kontaktů
 * @returns {number} Otisk obsahu
 */
const vytvorOtisk = (kontakty) => vytvorHash(JSON.stringify(kontakty || []));

/**
 * Vytvoří stabilní ID kontaktu.
 * Zdrojová data ID neobsahují, proto ho odvozujeme z klíčových údajů –
 * díky tomu zůstanou oblíbené kontakty přiřazené správné osobě i po synchronizaci.
 * @param {Object} kontakt - Kontakt s vyplněnými interními klíči
 * @returns {number} Číselné ID kontaktu
 */
const vytvorId = (kontakt) =>
  vytvorHash(
    [kontakt.email, kontakt.jmeno, kontakt.linka, kontakt.telefon]
      .filter(Boolean)
      .join("|")
  );

/**
 * Zjistí, zda jde o záznam v českém exportu (czu_kontakty.json).
 * @param {Object} kontakt - Záznam z JSONu
 * @returns {boolean} Zda má záznam české názvy polí
 */
const jeCeskyExport = (kontakt) =>
  kontakt["Jméno (s tituly)"] !== undefined ||
  kontakt["Hlavní email"] !== undefined ||
  kontakt["Katedra / Pracoviště"] !== undefined;

/**
 * Převede kontakt v českém exportu na interní formát aplikace.
 * @param {Object} k - Záznam s českými názvy polí
 * @returns {Object} Kontakt s interními klíči
 */
const prevedCeskyExport = (k) => {
  const pevnaLinka = normalizujTelefon(prvniHodnota(k["Pevná linka"]));
  const mobil = normalizujTelefon(prvniHodnota(k["Mobil"]));

  // 4místná linka je klíčová pro rychlé vytáčení – hledáme ji v poli „Linka",
  // případně ji odvodíme z pevné linky.
  const linka = vytahniLinku(k["Linka"]) || odvodLinkuZTelefonu(pevnaLinka);

  // V poli „telefon" držíme primární volatelné číslo kvůli zpětné kompatibilitě.
  // Pokud existuje pevná linka, zůstane v „telefon"; mobil ukládáme zvlášť.
  // Když pevná linka chybí, jako primární číslo použijeme mobil.
  const telefon = pevnaLinka || mobil;

  const jmeno = ocistiJmeno(
    prvniHodnota(k["Jméno (s tituly)"]) ||
      [
        k["Tituly před"],
        k["Jméno"],
        k["Příjmení"],
        k["Tituly za"]
      ]
        .map((cast) => String(cast || "").trim())
        .filter(Boolean)
        .join(" ")
  );

  const email = prvniHodnota(k["Hlavní email"]);
  const fakulta = prvniHodnota(k["Fakulta / Útvar"]);

  return {
    id: vytvorId({ email, jmeno, linka, telefon }),
    jmeno,
    oddeleni: nazevPracoviste(k["Katedra / Pracoviště"], fakulta),
    fakulta,
    mistnost: prvniHodnota(k["Číslo dveří / kanceláře"]),
    linka,
    telefon,
    mobil,
    email
  };
};

/**
 * Převede kontakt v interním formátu – řeší pouze zastaralý klíč „klapka".
 * @param {Object} kontakt - Záznam v interním formátu
 * @returns {Object} Kontakt s jednotným klíčem „linka"
 */
const prevedInterniKontakt = (kontakt) => {
  // Platná „linka" má vždy přednost, nic nepřepisujeme
  if (jeVyplneno(kontakt.linka) || !jeVyplneno(kontakt.klapka)) return kontakt;

  const { klapka, ...zbytek } = kontakt;
  return { ...zbytek, linka: String(klapka).trim() };
};

/**
 * Sjednotí seznam kontaktů ze serveru do interního formátu aplikace.
 * Podporuje obě varianty zdrojového JSONu (interní obálka i český export).
 * @param {Array<Object>} kontakty - Pole kontaktů ze serveru
 * @returns {Array<Object>} Pole kontaktů s interními klíči
 */
export const normalizujKontakty = (kontakty) =>
  (kontakty || [])
    .map((kontakt) => {
      if (!kontakt || typeof kontakt !== "object") return null;

      const prevedeny = jeCeskyExport(kontakt)
        ? prevedCeskyExport(kontakt)
        : prevedInterniKontakt(kontakt);
      const sjednoceny = {
        ...prevedeny,
        telefon: jeVyplneno(prevedeny.telefon)
          ? String(prevedeny.telefon).trim()
          : jeVyplneno(prevedeny.mobil)
            ? String(prevedeny.mobil).trim()
            : "",
        mobil: jeVyplneno(prevedeny.mobil) ? String(prevedeny.mobil).trim() : ""
      };

      // Kontakt bez jména nemá v seznamu co zobrazit
      if (!jeVyplneno(sjednoceny.jmeno)) return null;

      if (typeof sjednoceny.id !== "number") {
        return { ...sjednoceny, id: vytvorId(sjednoceny) };
      }
      return sjednoceny;
    })
    .filter(Boolean);

/**
 * Stáhne aktuální kontaktní data ze vzdáleného serveru.
 * Podporuje dva formáty publikovaného JSONu:
 *   A) obálku { version, lastUpdated, contacts: [...] }
 *   B) ploché pole kontaktů v českém exportu (czu_kontakty.json)
 * @returns {Promise<Object|null>} Normalizovaná data nebo null při selhání
 * @property {number|null} verzeZeServeru - Verze z obálky, jinak null
 * @property {string} lastUpdated - Datum aktualizace zdroje
 * @property {number} otisk - Otisk obsahu (rozpoznání změn bez verzování)
 * @property {Array<Object>} contacts - Kontakty v interním formátu
 */
export const stahniKontaktyZeServeru = async () => {
  try {
    const odpoved = await fetch(CONTACTS_URL, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "Cache-Control": "no-cache"
      },
      timeout: 10000
    });

    if (!odpoved.ok) {
      throw new Error(`HTTP chyba: ${odpoved.status}`);
    }

    const data = await odpoved.json();

    const jeObal = !!data && !Array.isArray(data) && Array.isArray(data.contacts);
    const suroveKontakty = Array.isArray(data) ? data : jeObal ? data.contacts : null;

    // Validace přijatých dat
    if (!suroveKontakty || suroveKontakty.length === 0) {
      throw new Error("Neplatná struktura přijatých dat");
    }

    const kontakty = normalizujKontakty(suroveKontakty);
    if (kontakty.length === 0) {
      throw new Error("Soubor neobsahuje žádné použitelné kontakty");
    }

    return {
      verzeZeServeru:
        jeObal && typeof data.version === "number" ? data.version : null,
      lastUpdated:
        (jeObal && typeof data.lastUpdated === "string" && data.lastUpdated) ||
        new Date().toISOString(),
      otisk: vytvorOtisk(kontakty),
      contacts: kontakty
    };
  } catch (chyba) {
    console.error("Chyba při stahování kontaktů:", chyba.message);
    return null;
  }
};

/**
 * Provede synchronizaci kontaktů.
 * Data se ukládají pouze tehdy, když se obsah souboru na webu změnil.
 * Soubor bez vlastního čísla verze (plochý export) se ukládá s počitadlem
 * odvozeným od předchozí verze, soubor s verzí si drží verzi ze serveru.
 * @returns {Promise<Object>} Výsledek synchronizace
 * @property {boolean} uspesna - Zda byla synchronizace úspěšná
 * @property {boolean} aktualizovano - Zda byla data aktualizována
 * @property {number} novaVerze - Verze dat po synchronizaci
 * @property {string} zprava - Popis výsledku operace
 */
export const synchronizujKontakty = async () => {
  try {
    // Lokální data – z nich odvodíme otisk pro rozpoznání změn
    const lokalniData = await nactiKontakty();
    const lokalniKontakty = lokalniData?.contacts || [];
    const lokalniVerze = Number(lokalniData?.version) || 0;
    const lokalniOtisk = vytvorOtisk(lokalniKontakty);

    // Pokusíme se stáhnout data ze serveru
    const vzdalenaData = await stahniKontaktyZeServeru();

    if (!vzdalenaData) {
      return {
        uspesna: false,
        aktualizovano: false,
        novaVerze: lokalniVerze,
        zprava: "Nepodařilo se připojit k serveru, používají se lokální data."
      };
    }

    // Obsah se nezměnil – není co ukládat
    if (vzdalenaData.otisk === lokalniOtisk) {
      return {
        uspesna: true,
        aktualizovano: false,
        novaVerze: lokalniVerze,
        zprava: "Lokální data jsou již aktuální."
      };
    }

    // Soubor bez vlastní verze dostane počitadlo navazující na lokální verzi
    const novaVerze =
      vzdalenaData.verzeZeServeru !== null
        ? vzdalenaData.verzeZeServeru
        : lokalniVerze + 1;

    const ulozeno = await ulozKontakty({
      version: novaVerze,
      lastUpdated: vzdalenaData.lastUpdated,
      contacts: vzdalenaData.contacts
    });

    if (!ulozeno) {
      return {
        uspesna: false,
        aktualizovano: false,
        novaVerze: lokalniVerze,
        zprava: "Chyba při ukládání nových dat."
      };
    }

    return {
      uspesna: true,
      aktualizovano: true,
      novaVerze,
      zprava:
        vzdalenaData.verzeZeServeru !== null
          ? `Data byla aktualizována na verzi ${novaVerze}.`
          : `Staženo ${vzdalenaData.contacts.length} kontaktů z webu.`
    };
  } catch (chyba) {
    console.error("Chyba při synchronizaci:", chyba);
    return {
      uspesna: false,
      aktualizovano: false,
      novaVerze: 0,
      zprava: `Chyba synchronizace: ${chyba.message}`
    };
  }
};

/**
 * Načte data pro první zobrazení - vždy používá lokální data pro okamžitý start
 * Synchronizace na pozadí se provádí odděleně
 * @returns {Promise<Object>} Načtená kontaktní data
 */
export const nactiPocatecniData = async () => {
  // Nejprve se pokusíme načíst lokální data
  // Storage service se postará o to, že pokud nejsou data, vrátí defaultní
  return await nactiKontakty();
};
