// Barevné palety pro světlý a tmavý režim
// Používáme konstanty, které se předávají přes ThemeContext

export const BARVY_SVETLE = {
  // Základní pozadí
  pozadi: "#FFFFFF",
  pozadiKarty: "#FFFFFF",
  pozadiHlavicky: "#15803d",

  // Text
  textHlavni: "#000000",
  textVedlejsi: "rgba(0, 0, 0, 0.82)",
  textPotrebny: "rgba(0, 0, 0, 0.58)",
  textNaZelenem: "#FFFFFF",
  textAkcent: "#15803d",

  // Akcenty
  akcent: "#15803d",
  akcentSvetla: "#DCFCE7",
  akcentJemna: "#F0FDF4",
  hvizda: "#F59E0B",

  // Stíny a linky
  ohraniceni: "#000000",
  ohraniceniJemne: "rgba(0, 0, 0, 0.14)",
  stin: "#000000",

  // Stavové
  uspech: "#10B981",
  chyba: "#EF4444",
  varovani: "#F59E0B",
  info: "#3B82F6",

  // Specifické komponenty
  klavesniceKladivo: "#FFFFFF",
  klavesniceKladivoSpec: "#DCFCE7",
  scrollbar: "#000000",

  // Inputy a formuláře
  inputPozadi: "#FFFFFF",
  inputOhraniceni: "#000000"
};

export const BARVY_TMAVE = {
  // Základní pozadí
  pozadi: "#000000",
  pozadiKarty: "#000000",
  pozadiHlavicky: "#000000",

  // Text
  textHlavni: "#FFFFFF",
  textVedlejsi: "rgba(255, 255, 255, 0.88)",
  textPotrebny: "rgba(255, 255, 255, 0.62)",
  textNaZelenem: "#FFFFFF",
  textAkcent: "#4ADE80",

  // Akcenty
  akcent: "#16A34A",
  akcentSvetla: "#14532D",
  akcentJemna: "#052E16",
  hvizda: "#FBBF24",

  // Stíny a linky
  ohraniceni: "#FFFFFF",
  ohraniceniJemne: "rgba(255, 255, 255, 0.18)",
  stin: "#000000",

  // Stavové
  uspech: "#34D399",
  chyba: "#F87171",
  varovani: "#FBBF24",
  info: "#60A5FA",

  // Specifické komponenty
  klavesniceKladivo: "#000000",
  klavesniceKladivoSpec: "#052E16",
  scrollbar: "#FFFFFF",

  // Inputy a formuláře
  inputPozadi: "#000000",
  inputOhraniceni: "#FFFFFF"
};

/**
 * Vrací kompletní sadu barev na základě režimu
 * @param {boolean} tma
 */
export const ziskejTema = (tma) => (tma ? BARVY_TMAVE : BARVY_SVETLE);
