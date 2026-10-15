import AsyncStorage from "@react-native-async-storage/async-storage";

// Klíče pro AsyncStorage
const KLUCE = {
  NASTAVENI: "pupen_linka_nastaveni"
};

// Výchozí hodnoty nastavení
export const VYCHOZI_NASTAVENI = {
  // #7 Tmavý mód: "auto" = podle systému, "svetly" / "tmavy"
  tema: "auto",

  // #8 Haptic Feedback
  haptikaZapnuta: true,

  // #12 Velikost písma: 0 = malé (A−), 1 = normální (A), 2 = velké (A+), 3 = extrémně velké (A++)
  velikostPisma: 1,

  // #9 Třídění kontaktů: "prijmeni" (A-Ž), "fakulta", "linka", "oblibene" (Oblíbené jako první)
  razeniKontaktu: "prijmeni",

  // #10 Filtrování fakulty: null = Zobrazit vše, jinak string např. "Fakulta technická"
  vybranaFakulta: null,

  // Historie volání zobrazená
  zobrazitHistorii: false
};

/**
 * Načte uživatelská nastavení z AsyncStorage
 * Nebo vrátí výchozí, pokud žádná nejsou
 * @returns {Promise<Object>} Nastavení aplikace
 */
export const nactiNastaveni = async () => {
  try {
    const ulozena = await AsyncStorage.getItem(KLUCE.NASTAVENI);
    if (ulozena) {
      const parsovano = JSON.parse(ulozena);
      // Sloučíme s výchozími pro případ přidání nových klíčů v nové verzi
      return { ...VYCHOZI_NASTAVENI, ...parsovano };
    }
    return { ...VYCHOZI_NASTAVENI };
  } catch (chyba) {
    console.error("Chyba při načítání nastavení:", chyba);
    return { ...VYCHOZI_NASTAVENI };
  }
};

/**
 * Uloží nastavení do AsyncStorage
 * @param {Object} nastaveni - Objekt s aktuálním nastavením
 * @returns {Promise<boolean>} Úspěch
 */
export const ulozNastaveni = async (nastaveni) => {
  try {
    await AsyncStorage.setItem(KLUCE.NASTAVENI, JSON.stringify(nastaveni));
    return true;
  } catch (chyba) {
    console.error("Chyba při ukládání nastavení:", chyba);
    return false;
  }
};

/**
 * Aktualizuje jednu hodnotu v nastavení
 * @param {Object} aktualni - Současné nastavení
 * @param {string} klic - Klíč k aktualizaci
 * @param {*} hodnota - Nová hodnota
 * @returns {Promise<Object>} Nové nastavení
 */
export const aktualizujNastaveni = async (aktualni, klic, hodnota) => {
  const nove = { ...aktualni, [klic]: hodnota };
  await ulozNastaveni(nove);
  return nove;
};

/**
 * Helper: určí zda je aktuálně aktivní tmavý režim na základě nastavení
 * a barevného schématu systému
 * @param {Object} nastaveni - Uživatelské nastavení
 * @param {string} barevneSchemaSystemu - "light" / "dark" z useColorScheme
 * @returns {boolean}
 */
export const jeTma = (nastaveni, barevneSchemaSystemu) => {
  if (nastaveni.tema === "tmavy") return true;
  if (nastaveni.tema === "svetly") return false;
  // auto
  return barevneSchemaSystemu === "dark";
};

/**
 * Vypočte multiplikátor velikosti písma
 * @param {number} nastaveniVelikost - 0,1,2,3
 * @returns {number} 0.9 / 1.0 / 1.15 / 1.35
 */
export const velikostPismaMult = (nastaveniVelikost) => {
  const mult = [0.9, 1.0, 1.15, 1.35];
  return mult[nastaveniVelikost] ?? 1.0;
};

/**
 * Seznam možností velikosti písma pro nastavení
 */
export const MOZNOSTI_VELIKOST_PISMA = [
  { id: 0, znacka: "A−", popis: "Malé" },
  { id: 1, znacka: "A", popis: "Normální" },
  { id: 2, znacka: "A+", popis: "Velké" },
  { id: 3, znacka: "A++", popis: "Extrémně velké" }
];

/**
 * Možnosti řazení kontaktů
 */
export const MOZNOSTI_RAZENI = [
  { id: "prijmeni", nazev: "Podle příjmení (A–Ž)", ikona: "sort-alphabetical-ascending" },
  { id: "fakulta", nazev: "Podle fakulty", ikona: "office-building-marker-outline" },
  { id: "linka", nazev: "Podle linky (0–9)", ikona: "numeric" },
  { id: "oblibene", nazev: "Oblíbené jako první", ikona: "star-outline" }
];
