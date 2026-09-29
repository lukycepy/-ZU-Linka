// Jednoduchý wrapper pro haptiku, který respektuje uživatelské nastavení
// Pokud není dostupné (Web, iOS simulátor) nebo vypnuté, nic nedělá

let ExHaptics = null;
let nacteno = false;

/**
 * Lazy load expo-haptics – na webu to může selhat
 */
const ziskejHaptics = () => {
  if (nacteno) return ExHaptics;
  try {
    ExHaptics = require("expo-haptics");
  } catch (e) {
    ExHaptics = null;
  }
  nacteno = true;
  return ExHaptics;
};

/**
 * Lehký impakt – např. při stisku klávesy
 */
export const lehkyImpakt = (zapnuto = true) => {
  if (!zapnuto) return;
  try {
    const Haptics = ziskejHaptics();
    if (Haptics && Haptics.ImpactFeedbackStyle) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  } catch (e) {
    // Na webu se nic neděje
  }
};

/**
 * Střední impakt – např. uložení oblíbeného
 */
export const stredniImpakt = (zapnuto = true) => {
  if (!zapnuto) return;
  try {
    const Haptics = ziskejHaptics();
    if (Haptics && Haptics.ImpactFeedbackStyle) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  } catch (e) {}
};

/**
 * Silný impakt – např. spuštění hovoru
 */
export const silnyImpakt = (zapnuto = true) => {
  if (!zapnuto) return;
  try {
    const Haptics = ziskejHaptics();
    if (Haptics && Haptics.ImpactFeedbackStyle) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
  } catch (e) {}
};

/**
 * Úspěšná notifikace
 */
export const uspech = (zapnuto = true) => {
  if (!zapnuto) return;
  try {
    const Haptics = ziskejHaptics();
    if (Haptics && Haptics.NotificationFeedbackType) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  } catch (e) {}
};

/**
 * Chybová notifikace
 */
export const chyba = (zapnuto = true) => {
  if (!zapnuto) return;
  try {
    const Haptics = ziskejHaptics();
    if (Haptics && Haptics.NotificationFeedbackType) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  } catch (e) {}
};

/**
 * Výběrová vibrace – např. při výběru z pickeru
 */
export const vyber = (zapnuto = true) => {
  if (!zapnuto) return;
  try {
    const Haptics = ziskejHaptics();
    if (Haptics && Haptics.selectionAsync) {
      Haptics.selectionAsync();
    }
  } catch (e) {}
};
