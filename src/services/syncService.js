import { ziskejVerziDat, ulozKontakty } from "./storageService";
import { CONTACTS_URL, DEFAULT_CONTACTS } from "../data/defaultContacts";

/**
 * Stáhne aktuální kontaktní data z vzdáleného serveru
 * @returns {Promise<Object|null>} Stažená data nebo null při selhání
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

    // Validace přijatých dat
    if (!data || !Array.isArray(data.contacts) || typeof data.version !== "number") {
      throw new Error("Neplatná struktura přijatých dat");
    }

    return data;
  } catch (chyba) {
    console.error("Chyba při stahování kontaktů:", chyba.message);
    return null;
  }
};

/**
 * Provede synchronizaci kontaktů
 * Staží nová data a porovná verzi, aktualizuje pouze pokud je novější verze
 * @returns {Promise<Object>} Výsledek synchronizace
 * @property {boolean} uspesna - Zda byla synchronizace úspěšná
 * @property {boolean} aktualizovano - Zda byla data aktualizována
 * @property {number} novaVerze - Nová verze dat (pokud byla aktualizace)
 * @property {string} zprava - Popis výsledku operace
 */
export const synchronizujKontakty = async () => {
  try {
    // Získáme aktuální verzi lokálních dat
    const lokalniVerze = await ziskejVerziDat();

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

    // Porovnáme verze
    if (vzdalenaData.version > lokalniVerze) {
      const ulozeno = await ulozKontakty(vzdalenaData);
      if (ulozeno) {
        return {
          uspesna: true,
          aktualizovano: true,
          novaVerze: vzdalenaData.version,
          zprava: `Data byla aktualizována na verzi ${vzdalenaData.version}.`
        };
      } else {
        return {
          uspesna: false,
          aktualizovano: false,
          novaVerze: lokalniVerze,
          zprava: "Chyba při ukládání nových dat."
        };
      }
    } else {
      return {
        uspesna: true,
        aktualizovano: false,
        novaVerze: lokalniVerze,
        zprava: "Lokální data jsou již aktuální."
      };
    }
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
  const { nactiKontakty } = require("./storageService");
  return await nactiKontakty();
};
