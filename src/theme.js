// Barevné palety pro světlý a tmavý režim
// Používáme konstanty, které se předávají přes ThemeContext

export const BARVY_SVETLE = {
  // Základní pozadí
  pozadi: "#F9FAFB",
  pozadiKarty: "#FFFFFF",
  pozadiHlavicky: "#15803d",

  // Text
  textHlavni: "#111827",
  textVedlejsi: "#4B5563",
  textPotrebny: "#6B7280",
  textNaZelenem: "#FFFFFF",
  textAkcent: "#15803d",

  // Akcenty
  akcent: "#15803d",
  akcentSvetla: "#DCFCE7",
  akcentJemna: "#F0FDF4",
  hvizda: "#F59E0B",

  // Stíny a linky
  ohraniceni: "#E5E7EB",
  ohraniceniJemne: "#F3F4F6",
  stin: "#000000",

  // Stavové
  uspech: "#10B981",
  chyba: "#EF4444",
  varovani: "#F59E0B",
  info: "#3B82F6",

  // Specifické komponenty
  klavesniceKladivo: "#FFFFFF",
  klavesniceKladivoSpec: "#F3F4F6",
  scrollbar: "#D1D5DB",

  // Inputy a formuláře
  inputPozadi: "#FFFFFF",
  inputOhraniceni: "#E5E7EB"
};

export const BARVY_TMAVE = {
  // Základní pozadí
  pozadi: "#0F172A",
  pozadiKarty: "#1E293B",
  pozadiHlavicky: "#14532D",

  // Text
  textHlavni: "#F9FAFB",
  textVedlejsi: "#D1D5DB",
  textPotrebny: "#94A3B8",
  textNaZelenem: "#FFFFFF",
  textAkcent: "#4ADE80",

  // Akcenty
  akcent: "#4ADE80",
  akcentSvetla: "#14532D",
  akcentJemna: "#052E16",
  hvizda: "#FBBF24",

  // Stíny a linky
  ohraniceni: "#334155",
  ohraniceniJemne: "#1E293B",
  stin: "#000000",

  // Stavové
  uspech: "#34D399",
  chyba: "#F87171",
  varovani: "#FBBF24",
  info: "#60A5FA",

  // Specifické komponenty
  klavesniceKladivo: "#1E293B",
  klavesniceKladivoSpec: "#334155",
  scrollbar: "#334155",

  // Inputy a formuláře
  inputPozadi: "#0F172A",
  inputOhraniceni: "#334155"
};

/**
 * Vrací kompletní sadu barev na základě režimu
 * @param {boolean} tma
 */
export const ziskejTema = (tma) => (tma ? BARVY_TMAVE : BARVY_SVETLE);
