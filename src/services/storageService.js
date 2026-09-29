import AsyncStorage from "@react-native-async-storage/async-storage";
import { DEFAULT_CONTACTS } from "../data/defaultContacts";

// Klíče pro AsyncStorage
const KLUCE = {
  KONTAKTY: "czu_linka_kontakty",
  VERZE: "czu_linka_verze_dat",
  POSLEDNI_SYNCHRONIZACE: "czu_linka_posledni_sync",
  OBLIBENE: "czu_linka_oblibene"
};

/**
 * Načte kontaktní data z lokálního úložiště
 * @returns {Promise<Object>} Objekt s kontakty a metadaty nebo defaultní data
 */
export const nactiKontakty = async () => {
  try {
    const ulozeneKontakty = await AsyncStorage.getItem(KLUCE.KONTAKTY);
    if (ulozeneKontakty) {
      return JSON.parse(ulozeneKontakty);
    }
    // Pokud nejsou žádná data, použijeme defaultní
    await ulozKontakty(DEFAULT_CONTACTS);
    return DEFAULT_CONTACTS;
  } catch (chyba) {
    console.error("Chyba při načítání kontaktů z úložiště:", chyba);
    return DEFAULT_CONTACTS;
  }
};

/**
 * Uloží kontaktní data do lokálního úložiště
 * @param {Object} data - Objekt s kontakty a metadaty
 * @returns {Promise<boolean>} Úspěch operace
 */
export const ulozKontakty = async (data) => {
  try {
    await AsyncStorage.setItem(KLUCE.KONTAKTY, JSON.stringify(data));
    await AsyncStorage.setItem(KLUCE.VERZE, String(data.version));
    await AsyncStorage.setItem(
      KLUCE.POSLEDNI_SYNCHRONIZACE,
      new Date().toISOString()
    );
    return true;
  } catch (chyba) {
    console.error("Chyba při ukládání kontaktů do úložiště:", chyba);
    return false;
  }
};

/**
 * Získá verzi aktuálně uložených dat
 * @returns {Promise<number>} Verze dat nebo 0
 */
export const ziskejVerziDat = async () => {
  try {
    const verze = await AsyncStorage.getItem(KLUCE.VERZE);
    return verze ? parseInt(verze, 10) : 0;
  } catch (chyba) {
    console.error("Chyba při čtení verze dat:", chyba);
    return 0;
  }
};

/**
 * Získá datum poslední synchronizace
 * @returns {Promise<string|null>} ISO datum poslední synchronizace
 */
export const ziskejPosledniSynchronizaci = async () => {
  try {
    return await AsyncStorage.getItem(KLUCE.POSLEDNI_SYNCHRONIZACE);
  } catch (chyba) {
    console.error("Chyba při čtení data synchronizace:", chyba);
    return null;
  }
};

/**
 * Načte seznam oblíbených kontaktů
 * @returns {Promise<number[]>} Pole ID oblíbených kontaktů
 */
export const nactiOblibene = async () => {
  try {
    const oblibene = await AsyncStorage.getItem(KLUCE.OBLIBENE);
    return oblibene ? JSON.parse(oblibene) : [];
  } catch (chyba) {
    console.error("Chyba při načítání oblíbených:", chyba);
    return [];
  }
};

/**
 * Uloží seznam oblíbených kontaktů
 * @param {number[]} oblibene - Pole ID oblíbených kontaktů
 * @returns {Promise<boolean>} Úspěch operace
 */
export const ulozOblibene = async (oblibene) => {
  try {
    await AsyncStorage.setItem(KLUCE.OBLIBENE, JSON.stringify(oblibene));
    return true;
  } catch (chyba) {
    console.error("Chyba při ukládání oblíbených:", chyba);
    return false;
  }
};

/**
 * Přepne stav oblíbenosti pro daný kontakt
 * @param {number} idKontaktu - ID kontaktu
 * @returns {Promise<boolean>} Nový stav oblíbenosti
 */
export const prepniOblibene = async (idKontaktu) => {
  try {
    const oblibene = await nactiOblibene();
    const index = oblibene.indexOf(idKontaktu);
    let novyStav;

    if (index > -1) {
      oblibene.splice(index, 1);
      novyStav = false;
    } else {
      oblibene.push(idKontaktu);
      novyStav = true;
    }

    await ulozOblibene(oblibene);
    return novyStav;
  } catch (chyba) {
    console.error("Chyba při přepínání oblíbeného:", chyba);
    return false;
  }
};

/**
 * Vymaže všechna data z úložiště (pro testovací účely)
 * @returns {Promise<boolean>} Úspěch operace
 */
export const vymazVsechnaData = async () => {
  try {
    await AsyncStorage.multiRemove([
      KLUCE.KONTAKTY,
      KLUCE.VERZE,
      KLUCE.POSLEDNI_SYNCHRONIZACE,
      KLUCE.OBLIBENE
    ]);
    return true;
  } catch (chyba) {
    console.error("Chyba při mazání dat:", chyba);
    return false;
  }
};
