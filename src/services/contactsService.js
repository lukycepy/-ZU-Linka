import { TELEFONNI_PREFIX } from "../data/defaultContacts";
import * as Linking from "expo-linking";
import { Platform, Alert, PermissionsAndroid } from "react-native";

// Lazy načtení expo-intent-launcher (pouze pro Android ACTION_CALL)
let IntentLauncher = null;
try {
  IntentLauncher = require("expo-intent-launcher").default;
} catch (e) {
  IntentLauncher = null;
}

/**
 * Vytvoří kompletní telefonní číslo z 4místné linky
 * @param {string} linka - 4místná linka
 * @returns {string} Kompletní telefonní číslo s předvolbou
 */
export const vytvorCisloZLinky = (linka) => {
  // Odebereme všechny nečíselné znaky
  const cistaLinka = linka.replace(/\D/g, "");
  return `${TELEFONNI_PREFIX}${cistaLinka}`;
};

/**
 * Ověří, zda je vstup platná 4místná linka
 * @param {string} vstup - Vstupní řetězec
 * @returns {boolean} Zda je vstup platná linka
 */
export const jePlatnaLinka = (vstup) => {
  if (!vstup) return false;
  const cistyVstup = vstup.replace(/\D/g, "");
  return /^\d{4}$/.test(cistyVstup);
};

/**
 * Vrátí telefonní číslo z kontaktu:
 * - pokud má kontakt vlastní telefon, vrátí ho
 * - jinak vrátí číslo složené z linky (prefix + 4 čísla)
 * @param {Object} kontakt
 * @returns {string} Kompletní telefonní číslo
 */
export const ziskejTelefonKontaktu = (kontakt) => {
  if (!kontakt) return "";
  // preferujeme přímé telefonní číslo, pokud existuje
  if (kontakt.telefon && String(kontakt.telefon).trim().length > 0) {
    return String(kontakt.telefon).trim();
  }
  // jinak sestavíme číslo z linky
  if (kontakt.linka && jePlatnaLinka(kontakt.linka)) {
    return vytvorCisloZLinky(kontakt.linka);
  }
  return "";
};

/**
 * Formátuje telefonní číslo pro zobrazení
 * @param {string} cislo - Telefonní číslo
 * @returns {string} Formátované číslo
 */
export const formatujCislo = (cislo) => {
  if (!cislo) return "";
  // Pokud je to formát +420XXXXXXXX, rozdělíme na skupiny
  const match = cislo.match(/^(\+420)(\d{3})(\d{3})(\d{3})$/);
  if (match) {
    return `${match[1]} ${match[2]} ${match[3]} ${match[4]}`;
  }
  return cislo;
};

/**
 * Iniciuje telefonní hovor.
 *
 * Android: Pokusí se použít Intent.ACTION_CALL, který hovor vytočí
 *   okamžitě (bez potvrzovací obrazovky dialeru). Pokud selže
 *   (nedostatečné oprávnění CALL_PHONE nebo chyba), automaticky
 *   použije fallback na ACTION_DIAL (tel: URL – otevře dialer).
 * iOS: Otevře systémovou aplikaci Telefon přes tel: URL.
 *   (iOS neumožňuje hovor přímo uvnitř aplikace.)
 *
 * @param {string} cil - 4místná linka nebo kompletní telefonní číslo
 * @returns {Promise<boolean>} Zda se podařilo zahájit hovor
 */
export const zavolej = async (cil) => {
  try {
    let telefonniCislo;

    // Pokud je vstup 4místná linka, vytvoříme z ní číslo
    if (jePlatnaLinka(cil)) {
      telefonniCislo = vytvorCisloZLinky(cil);
    } else {
      // Jinak předpokládáme, že jde o kompletní číslo
      telefonniCislo = cil;
    }

    const telUrl = `tel:${telefonniCislo}`;

    // === ANDROID: Pokus o ACTION_CALL (vytočení bez potvrzení) ===
    if (Platform.OS === "android" && IntentLauncher) {
      try {
        // Nejprve požádáme o oprávnění CALL_PHONE (pokud ještě není uděleno)
        const stavOpravneni = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CALL_PHONE,
          {
            title: "Povolení hovorů",
            message: "Aplikace Linka potřebuje povolení k zahájení hovoru přímo z aplikace.",
            buttonPositive: "Povolit",
            buttonNegative: "Zamítnout"
          }
        );

        if (stavOpravneni === PermissionsAndroid.RESULTS.GRANTED) {
          await IntentLauncher.startActivityAsync("android.intent.action.CALL", {
            data: telUrl
          });
          return true;
        }
        // Pokud oprávnění není uděleno, pokračujeme na fallback (tel: URL)
      } catch (chybaActionCall) {
        // Selhalo (např. SecurityException). Fallback na ACTION_DIAL.
        console.warn("ACTION_CALL selhalo, používám ACTION_DIAL:", chybaActionCall.message);
      }
    }

    // === iOS / Web / Fallback: Otevření přes tel: URL ===
    const muzemeOtevrit = await Linking.canOpenURL(telUrl);

    if (muzemeOtevrit) {
      await Linking.openURL(telUrl);
      return true;
    } else {
      if (Platform.OS === "web") {
        window.location.href = telUrl;
        return true;
      } else {
        Alert.alert(
          "Chyba",
          "Toto zařízení nepodporuje telefonní hovory.",
          [{ text: "OK" }]
        );
        return false;
      }
    }
  } catch (chyba) {
    console.error("Chyba při zahájení hovoru:", chyba);
    Alert.alert(
      "Chyba",
      "Nepodařilo se zahájit telefonní hovor. Zkuste to prosím znovu.",
      [{ text: "OK" }]
    );
    return false;
  }
};

/**
 * Provede fulltextové vyhledávání v polích kontaktu
 * Hledá v: jméno, oddělení, fakulta, budova, místnost, linka, telefon, email
 * @param {Array} kontakty - Seznam kontaktů k prohledání
 * @param {string} vyhledavanyText - Text, který hledáme
 * @returns {Array} Filtrovaný seznam kontaktů
 */
export const vyhledejKontakty = (kontakty, vyhledavanyText) => {
  if (!vyhledavanyText || vyhledavanyText.trim() === "") {
    return kontakty;
  }

  const hledanyTextNormalizovany = odstranDiakritiku(vyhledavanyText.toLowerCase().trim());

  return kontakty.filter((kontakt) => {
    // Vytvoříme spojení všech polí do jednoho řetězce pro rychlé vyhledávání
    const celaHodnota = [
      kontakt.jmeno,
      kontakt.oddeleni,
      kontakt.fakulta,
      kontakt.budova,
      kontakt.mistnost,
      kontakt.linka,
      kontakt.telefon,
      kontakt.email
    ]
      .filter(Boolean)
      .map((hodnota) => odstranDiakritiku(String(hodnota).toLowerCase()))
      .join(" ");

    return celaHodnota.includes(hledanyTextNormalizovany);
  });
};

/**
 * Odstraní diakritiku z textu pro nezávislé vyhledávání
 * @param {string} text - Vstupní text s diakritikou
 * @returns {string} Text bez diakritiky
 */
export const odstranDiakritiku = (text) => {
  if (!text) return "";
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\u0142/g, "l")
    .replace(/\u0141/g, "L");
};

/**
 * Seskupí kontakty podle první písmena příjmení
 * @param {Array} kontakty - Seznam kontaktů
 * @returns {Object} Seskupené kontakty { "A": [...], "B": [...] }
 */
export const seskupKontaktyPodlePrijmeni = (kontakty) => {
  const skupiny = {};

  kontakty.forEach((kontakt) => {
    // Pokusíme se získat první písmeno příjmení
    // Normální formát: "Tituly Jméno Příjmení" nebo "Příjmení, Jméno"
    let prvniPismeno = "#";

    if (kontakt.jmeno) {
      const casti = kontakt.jmeno.trim().split(/[\s,]+/);
      // Najdeme poslední neprázdnou část, která pravděpodobně bude příjmení
      const prijmeni = casti.filter((cast) => cast && /^[A-Za-zÁČĎÉĚÍŇÓŘŠŤÚŮÝŽáčďéěíňóřšťúůýž]/.test(cast)).pop();

      if (prijmeni) {
        const normalizovane = odstranDiakritiku(prijmeni[0].toUpperCase());
        if (/[A-Z]/.test(normalizovane)) {
          prvniPismeno = normalizovane;
        }
      }
    }

    if (!skupiny[prvniPismeno]) {
      skupiny[prvniPismeno] = [];
    }
    skupiny[prvniPismeno].push(kontakt);
  });

  // Seřadíme skupiny podle písmena
  const serazeneSkupiny = {};
  Object.keys(skupiny)
    .sort((a, b) => {
      if (a === "#") return 1;
      if (b === "#") return -1;
      return a.localeCompare(b);
    })
    .forEach((klic) => {
      serazeneSkupiny[klic] = skupiny[klic];
    });

  return serazeneSkupiny;
};
