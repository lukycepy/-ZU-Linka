/**
 * ======== #16 ANDROID WIDGET ========
 * Linka widget – zobrazí 4 oblíbené kontakty jako 2×2 mřížku
 * Název: LinkaOblibene
 *
 * Kompatibilita: funguje na Androidu (Glance-based) + iOS (widgetkit)
 * Používá expo-widgets – data se synchronizují přes
 * ExpoWidgets.setWidgetData() a reloadují se přes ExpoWidgets.reloadWidget()
 * při každé změně oblíbených kontaktů.
 */

import React from "react";
import { View, Text } from "react-native";

// Lazy load expo-widgets – na Web / Expo Go není k dispozici, tak selže jen ticho
function nactiExpoWidgets(): any {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require("expo-widgets");
  } catch (e) {
    return null;
  }
}
const ExpoWidgetsMod = nactiExpoWidgets();
const Widgets: any = ExpoWidgetsMod?.Widgets;
const registerWidget: any = ExpoWidgetsMod?.registerWidget;

/**
 * Definice konfigurace widgetu (použije se v pluginu v app.json)
 * Název se musí shodovat s property `name` v app.json pluginu
 */
export const WIDGET_CONFIG = {
  name: "LinkaOblibene",
  displayName: "Linka – Oblíbené",
  description: "Rychlá volání 4 oblíbených kontaktů přímo z plochy telefonu",
  android: {
    // 2 × 2 buňky (2 × (70+8) − 8 = 148dp)
    targetCellWidth: 2,
    targetCellHeight: 2,
    minWidth: 148,
    minHeight: 148,
    resizeMode: "none"
  },
  ios: {
    supportedFamilies: ["systemSmall", "systemMedium"]
  }
};

/**
 * Definice prop typu, co widget očekává (jsou to propsy posílané přes setWidgetData)
 * Vyplňují se při každé změně oblíbených v App.js → syncWidget()
 */
export function Widget_Projekt_Linka_Oblibene({
  oblibene = [
    { jmeno: "Přidej oblíbené", klapka: "0000" },
    { jmeno: "v Nastavení", klapka: "0000" },
    { jmeno: "aplikace", klapka: "0000" },
    { jmeno: "Linka 📞", klapka: "0000" }
  ],
  datumAktualizace = "—"
}) {
  // Ořízneme jméno tak, aby se vešlo do dlaždice widgetu
  const oriznout = (text = "", max = 16) =>
    text.length > max ? text.substring(0, max - 1) + "…" : text;

  // Vyzvedneme 4 první
  const prvni4 = [
    oblibene[0] || { jmeno: "—", klapka: "" },
    oblibene[1] || { jmeno: "—", klapka: "" },
    oblibene[2] || { jmeno: "—", klapka: "" },
    oblibene[3] || { jmeno: "—", klapka: "" }
  ];

  // Barvy použijeme Pupen zelené (stálé – widget běží bez přístupu k AsyncStorage theme)
  const ZELENA = "#15803d";
  const ZELENA_SVETLA = "#DCFCE7";
  const BILA = "#FFFFFF";
  const CERNA = "#111827";
  const SEDA = "#6B7280";

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: BILA,
        borderRadius: 20,
        padding: 10,
        gap: 8
      }}
    >
      {/* Hlavička widgetu */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between"
        }}
      >
        <Text
          style={{
            fontWeight: "800",
            fontSize: 13,
            color: ZELENA,
            marginLeft: 2,
            letterSpacing: 0.4
          }}
        >
          LINKA · Pupen
        </Text>
        <Text
          style={{
            fontSize: 9,
            color: SEDA
          }}
        >
          {datumAktualizace}
        </Text>
      </View>

      {/* 2×2 mřížka s kontakty */}
      <View style={{ flex: 1, gap: 6 }}>
        {/* Řádek 1 */}
        <View style={{ flexDirection: "row", gap: 6, flex: 1 }}>
          {prvni4.slice(0, 2).map((osoba, idx) => (
            <View
              key={idx}
              style={{
                flex: 1,
                backgroundColor: ZELENA_SVETLA,
                borderRadius: 12,
                padding: 6,
                justifyContent: "center",
                minHeight: 42,
                overflow: "hidden"
              }}
            >
              <Text
                numberOfLines={1}
                style={{
                  color: ZELENA,
                  fontWeight: "700",
                  fontSize: 11
                }}
              >
                {oriznout(osoba.jmeno, 14)}
              </Text>
              <Text
                style={{
                  color: CERNA,
                  fontWeight: "600",
                  fontSize: 14,
                  marginTop: 1,
                  letterSpacing: 1.5
                }}
              >
                {osoba.klapka ? osoba.klapka : "—"}
              </Text>
            </View>
          ))}
        </View>

        {/* Řádek 2 */}
        <View style={{ flexDirection: "row", gap: 6, flex: 1 }}>
          {prvni4.slice(2, 4).map((osoba, idx) => (
            <View
              key={idx}
              style={{
                flex: 1,
                backgroundColor: ZELENA_SVETLA,
                borderRadius: 12,
                padding: 6,
                justifyContent: "center",
                minHeight: 42,
                overflow: "hidden"
              }}
            >
              <Text
                numberOfLines={1}
                style={{
                  color: ZELENA,
                  fontWeight: "700",
                  fontSize: 11
                }}
              >
                {oriznout(osoba.jmeno, 14)}
              </Text>
              <Text
                style={{
                  color: CERNA,
                  fontWeight: "600",
                  fontSize: 14,
                  marginTop: 1,
                  letterSpacing: 1.5
                }}
              >
                {osoba.klapka ? osoba.klapka : "—"}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

/**
 * ===== Helper pro synchronizaci s widgetem =====
 * Volá se z App.js pokaždé když se změní oblíbené nebo kontakty
 *
 * @param {Array} oblibeneIds Seznam ID oblíbených kontaktů
 * @param {Array} kontakty Celý seznam kontaktů
 */
export const syncOblibeneWidget = async (oblibeneIds, kontakty) => {
  try {
    if (!Widgets || typeof Widgets.setWidgetData !== "function") {
      // Na Web / iOS simulátor / staré zařízení může být nedostupné
      return { uspech: false, duvod: "Widgets API nedostupné" };
    }

    // Vyhledáme kompletní kontaktní informace
    const prvni4 = [];
    for (const id of (oblibeneIds || []).slice(0, 4)) {
      const kontakt = (kontakty || []).find((k) => k.id === id);
      if (kontakt) {
        prvni4.push({
          jmeno: kontakt.jmeno,
          klapka: kontakt.klapka,
          id: kontakt.id
        });
      }
    }

    const widgetProps = {
      oblibene: prvni4,
      datumAktualizace: new Date().toLocaleTimeString("cs-CZ", {
        hour: "2-digit",
        minute: "2-digit"
      })
    };

    await Widgets.setWidgetData(WIDGET_CONFIG.name, widgetProps);
    await Widgets.reloadWidget(WIDGET_CONFIG.name);
    return { uspech: true };
  } catch (chyba) {
    console.warn("Widget sync selhal:", chyba.message);
    return { uspech: false, duvod: chyba.message };
  }
};

/**
 * Registrace widgetu – musí být volána BĚHEM MODULU (ne v useEffectu!)
 * jinak expo-widgets nenajde funkci a zobrazí červený box.
 */
try {
  if (registerWidget) {
    registerWidget(
      WIDGET_CONFIG.name,
      Widget_Projekt_Linka_Oblibene
    );
  }
} catch (e) {
  // Těsně po expo install (bez prebuildu) může selhat → jen info
  console.warn("Widget registrace odložena do produkčního buildu:", e.message);
}

export default WIDGET_CONFIG;
