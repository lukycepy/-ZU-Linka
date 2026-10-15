// Služba pro kontrolu dostupných aktualizací aplikace.
//
// Aplikace Linka není distribuována přes Google Play ani App Store,
// proto nemá automatické aktualizace z obchodu. Tato služba porovnává
// verzi nainstalované aplikace s metadaty na pupen.org a upozorní
// uživatele na novější APK, které si stáhne ručně.
//
// Projekt Studentského spolku Pupen, z.s.

import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Linking from "expo-linking";
import { VERSION_URL, APK_URL } from "../data/defaultContacts";

// Klíč pro uložení verze, kterou uživatel odložil volbou „Později"
const KLIC_PRESKOCENO = "czu_linka_preskocena_verze";

/**
 * Vrátí aktuální verzi nainstalované aplikace (čteno z app.json).
 * @returns {{verze: string, versionCode: number}} Aktuální verze a její kód
 */
export const ziskejAktualniVerzi = () => {
  try {
    const cfg = Constants.expoConfig || {};
    return {
      verze: cfg.version || "0.0.0",
      versionCode: Number(cfg?.android?.versionCode ?? 0)
    };
  } catch (e) {
    return { verze: "0.0.0", versionCode: 0 };
  }
};

/**
 * Porovná dvě textové verze ve formátu X.Y.Z.
 * @returns {number} 1 pokud je a novější, -1 pokud je starší, 0 pokud shodné
 */
const porovnejVerze = (a, b) => {
  const castiA = String(a).split(".").map((n) => parseInt(n, 10) || 0);
  const castiB = String(b).split(".").map((n) => parseInt(n, 10) || 0);
  const delka = Math.max(castiA.length, castiB.length);
  for (let i = 0; i < delka; i++) {
    const x = castiA[i] || 0;
    const y = castiB[i] || 0;
    if (x > y) return 1;
    if (x < y) return -1;
  }
  return 0;
};

/**
 * Zkontroluje, zda je na serveru dostupná novější verze aplikace.
 *
 * Porovnává primárně číselný `versionCode`, sekundárně textovou verzi.
 *
 * @returns {Promise<{
 *   uspech: boolean,
 *   dostupna: boolean,
 *   aktualni: {verze: string, versionCode: number},
 *   nejnovejsi?: object,
 *   duvod?: string
 * }>} Výsledek kontroly
 */
export const zkontrolujAktualizaci = async () => {
  const aktualni = ziskejAktualniVerzi();
  try {
    // Cache-busting parametr, aby se vždy stáhla aktuální metadata
    const odpoved = await fetch(`${VERSION_URL}?t=${Date.now()}`, {
      headers: { Accept: "application/json" }
    });

    if (!odpoved.ok) {
      return {
        uspech: false,
        dostupna: false,
        aktualni,
        duvod: `Server odpověděl stavem ${odpoved.status}.`
      };
    }

    const data = await odpoved.json();
    if (!data || (!data.versionCode && !data.verze)) {
      return {
        uspech: false,
        dostupna: false,
        aktualni,
        duvod: "Neplatná metadata verze."
      };
    }

    let dostupna = false;
    if (typeof data.versionCode === "number" && aktualni.versionCode) {
      dostupna = data.versionCode > aktualni.versionCode;
    } else if (data.verze) {
      dostupna = porovnejVerze(data.verze, aktualni.verze) > 0;
    }

    return { uspech: true, dostupna, aktualni, nejnovejsi: data };
  } catch (e) {
    return {
      uspech: false,
      dostupna: false,
      aktualni,
      duvod: "Nepodařilo se připojit k serveru."
    };
  }
};

/**
 * Otevře odkaz na stažení nejnovějšího APK v prohlížeči zařízení.
 * @param {string} [url] Volitelná URL; jinak se použije výchozí APK_URL
 * @returns {Promise<boolean>} Zda se odkaz podařilo otevřít
 */
export const otevriStazeni = async (url) => {
  try {
    await Linking.openURL(url || APK_URL);
    return true;
  } catch (e) {
    return false;
  }
};

/**
 * Zjistí, zda uživatel u dané verze zvolil „Později" (aby se upozornění neopakovalo).
 * @param {number|string} versionCode Verze, kterou kontrolujeme
 * @returns {Promise<boolean>}
 */
export const jeVerzePreskocena = async (versionCode) => {
  if (versionCode === undefined || versionCode === null) return false;
  try {
    const hodnota = await AsyncStorage.getItem(KLIC_PRESKOCENO);
    return String(hodnota) === String(versionCode);
  } catch (e) {
    return false;
  }
};

/**
 * Uloží verzi, kterou uživatel odložil volbou „Později".
 * @param {number|string} versionCode Odložená verze
 */
export const nastavPreskocenouVerzi = async (versionCode) => {
  if (versionCode === undefined || versionCode === null) return;
  try {
    await AsyncStorage.setItem(KLIC_PRESKOCENO, String(versionCode));
  } catch (e) {
    // Tichý fail – upozornění se případně objeví znovu, což není kritické
  }
};