import { TELEFONNI_PREFIX } from "../data/defaultContacts";
import * as Linking from "expo-linking";
import { Platform, Alert } from "react-native";

/**
 * Vytvoří kompletní telefonní číslo z 4místné klapky
 * @param {string} klapka - 4místná klapka
 * @returns {string} Kompletní telefonní číslo s předvolbou
 */
export const vytvorCisloZKlapky = (klapka) => {
  // Odebereme všechny nečíselné znaky
  const cistaKlapka = klapka.replace(/\D/g, "");
  return `${TELEFONNI_PREFIX}${cistaKlapka}`;
};

/**
 * Ověří, zda je vstup platná 4místná klapka
 * @param {string} vstup - Vstupní řetězec
 * @returns {boolean} Zda je vstup platná klapka
 */
export const jePlatnaKlapka = (vstup) => {
  const cistyVstup = vstup.replace(/\D/g, "");
  return /^\d{4}$/.test(cistyVstup);
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
 * Iniciuje telefonní hovor
 * @param {string} klapka - 4místná klapka nebo kompletní číslo
 * @returns {Promise<boolean>} Zda se podařilo otevřít telefonní aplikaci
 */
export const zavolej = async (klapka) => {
  try {
    let telefonniCislo;

    // Pokud je vstup 4místná klapka, vytvoříme z něj číslo
    if (jePlatnaKlapka(klapka)) {
      telefonniCislo = vytvorCisloZKlapky(klapka);
    } else {
      // Jinak předpokládáme, že jde o kompletní číslo
      telefonniCislo = klapka;
    }

    // Vytvoříme tel:// URL
    const telUrl = `tel:${telefonniCislo}`;

    // Zkontrolujeme, zda URL můžeme otevřít
    const muzemeOtevrit = await Linking.canOpenURL(telUrl);

    if (muzemeOtevrit) {
      await Linking.openURL(telUrl);
      return true;
    } else {
      // Na webu nebo zařízeních bez možnosti volání
      if (Platform.OS === "web") {
        // Pokusíme se otevřít i přesměrováním
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
 * Hledá v: jméno, oddělení, fakulta, budova, místnost, klapka, email
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
      kontakt.klapka,
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
