import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Switch,
  Pressable,
  ScrollView,
  Linking,
  TouchableOpacity,
  ActivityIndicator
} from "react-native";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { MOZNOSTI_VELIKOST_PISMA, MOZNOSTI_RAZENI } from "../services/settingsService";

/**
 * Komponenta Nastavení
 * Umožňuje uživateli měnit téma (#7), zapnout/vypnout haptiku (#8),
 * měnit velikost písma (#12), defaultní řazení kontaktů (#9)
 * a ručně spustit synchronizaci kontaktů z pupen.org (#RUČNÍ SYNC)
 */
const Nastaveni = ({
  barvy,
  velikostPismaMult,
  nastaveni,
  naZmenuNastaveni,
  // Ruční synchronizace
  synchronizaceBezi,
  posledniSyncText,
  pocetKontaktu,
  naSpustitSynchronizaci,
  urlKontaktu
}) => {
  const m = velikostPismaMult;

  // Přepínač téma
  const moznostiTema = [
    { id: "auto", nazev: "Podle systému", ikona: "theme-light-dark", popis: "Automaticky" },
    { id: "svetly", nazev: "Světlý", ikona: "weather-sunny" },
    { id: "tmavy", nazev: "Tmavý", ikona: "weather-night" }
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: barvy.pozadi }]}
      contentContainerStyle={{ paddingBottom: 32 }}
    >
      {/* 1. VZHLED – Téma */}
      <Text style={[styles.skupinaNadpis, { color: barvy.textVedlejsi, fontSize: 13 * m }]}>
        VZHLED A CITLIVOST
      </Text>

      <View style={[styles.skupinaBox, { backgroundColor: barvy.pozadiKarty, borderColor: barvy.ohraniceni }]}>
        <Text style={[styles.radekNadpis, { color: barvy.textHlavni, fontSize: 16 * m }]}>
          Barevné téma
        </Text>
        <View style={styles.radekDvojice}>
          {moznostiTema.map((t) => {
            const zvoleno = nastaveni.tema === t.id;
            return (
              <Pressable
                key={t.id}
                android_ripple={{ color: barvy.akcentSvetla }}
                style={[
                  styles.tlacitkoVolba,
                  {
                    borderColor: zvoleno ? barvy.akcent : barvy.ohraniceni,
                    backgroundColor: zvoleno ? barvy.akcentJemna : barvy.pozadiKarty
                  }
                ]}
                onPress={() => naZmenuNastaveni("tema", t.id)}
              >
                <MaterialCommunityIcons
                  name={t.ikona}
                  size={20 * m}
                  color={zvoleno ? barvy.akcent : barvy.textVedlejsi}
                />
                <Text style={[
                  styles.tlacitkoVolbaText,
                  { color: zvoleno ? barvy.akcent : barvy.textHlavni, fontSize: 14 * m }
                ]}>
                  {t.nazev}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* 2. VELIKOST PÍSMA */}
      <View style={[styles.skupinaBox, { backgroundColor: barvy.pozadiKarty, borderColor: barvy.ohraniceni }]}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.radekNadpis, { color: barvy.textHlavni, fontSize: 16 * m }]}>
              Velikost písma
            </Text>
            <Text style={[styles.radekPopis, { color: barvy.textVedlejsi, fontSize: 13 * m }]}>
              Aplikuje se na text v celé aplikaci
            </Text>
          </View>
        </View>
        <View style={styles.radekDvojice}>
          {MOZNOSTI_VELIKOST_PISMA.map((vel) => {
            const zvoleno = nastaveni.velikostPisma === vel.id;
            return (
              <Pressable
                key={vel.id}
                android_ripple={{ color: barvy.akcentSvetla }}
                style={[
                  styles.tlacitkoVelikost,
                  {
                    borderColor: zvoleno ? barvy.akcent : barvy.ohraniceni,
                    backgroundColor: zvoleno ? barvy.akcentJemna : barvy.pozadiKarty
                  }
                ]}
                onPress={() => naZmenuNastaveni("velikostPisma", vel.id)}
              >
                <Text style={[
                  styles.tlacitkoVelikostZnak,
                  { color: zvoleno ? barvy.akcent : barvy.textHlavni, fontSize: [16, 18, 22, 28][vel.id] }
                ]}>
                  {vel.znacka}
                </Text>
                <Text style={[
                  styles.tlacitkoVelikostPopis,
                  { color: zvoleno ? barvy.akcent : barvy.textVedlejsi, fontSize: 12 * m }
                ]}>
                  {vel.popis}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* 3. CHYBY A HLÁŠENÍ – Haptika */}
      <Text style={[styles.skupinaNadpis, { color: barvy.textVedlejsi, fontSize: 13 * m, marginTop: 24 }]}>
        INTERAKCE
      </Text>
      <View style={[styles.skupinaBox, { backgroundColor: barvy.pozadiKarty, borderColor: barvy.ohraniceni }]}>
        <View style={styles.radek}>
          <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
            <View style={[styles.ikonaBox, { backgroundColor: barvy.akcentSvetla }]}>
              <MaterialCommunityIcons name="vibrate" size={20} color={barvy.akcent} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.radekNadpis, { color: barvy.textHlavni, fontSize: 16 * m }]}>
                Vibrace (Haptic Feedback)
              </Text>
              <Text style={[styles.radekPopis, { color: barvy.textVedlejsi, fontSize: 13 * m }]}>
                Jemné vibrace při stisknutí tlačítek a provedení akcí
              </Text>
            </View>
          </View>
          <Switch
            trackColor={{ false: barvy.ohraniceni, true: barvy.akcent }}
            thumbColor="#ffffff"
            ios_backgroundColor={barvy.ohraniceni}
            onValueChange={(hodnota) => naZmenuNastaveni("haptikaZapnuta", hodnota)}
            value={nastaveni.haptikaZapnuta}
          />
        </View>
      </View>

      {/* 4. ŘAZENÍ A FILTRY */}
      <Text style={[styles.skupinaNadpis, { color: barvy.textVedlejsi, fontSize: 13 * m, marginTop: 24 }]}>
        VYHLEDÁVÁNÍ KONTAKTŮ
      </Text>
      <View style={[styles.skupinaBox, { backgroundColor: barvy.pozadiKarty, borderColor: barvy.ohraniceni }]}>
        <Text style={[styles.radekNadpis, { color: barvy.textHlavni, fontSize: 16 * m, marginBottom: 12 }]}>
          Výchozí řazení
        </Text>
        {MOZNOSTI_RAZENI.map((razeni) => {
          const zvoleno = nastaveni.razeniKontaktu === razeni.id;
          return (
            <Pressable
              key={razeni.id}
              android_ripple={{ color: barvy.akcentSvetla }}
              style={[
                styles.razeniRadek,
                { borderBottomColor: barvy.ohraniceniJemne }
              ]}
              onPress={() => naZmenuNastaveni("razeniKontaktu", razeni.id)}
            >
              <MaterialCommunityIcons
                name={razeni.ikona}
                size={20 * m}
                color={zvoleno ? barvy.akcent : barvy.textVedlejsi}
              />
              <Text style={[
                styles.razeniText,
                { color: zvoleno ? barvy.akcent : barvy.textHlavni, fontSize: 15 * m }
              ]}>
                {razeni.nazev}
              </Text>
              {zvoleno && (
                <Ionicons name="checkmark-circle" size={20 * m} color={barvy.akcent} />
              )}
            </Pressable>
          );
        })}
      </View>

      {/* 5. DATA A SYNCHRONIZACE */}
      <Text style={[styles.skupinaNadpis, { color: barvy.textVedlejsi, fontSize: 13 * m, marginTop: 24 }]}>
        DATA A SYNCHRONIZACE
      </Text>
      <View style={[styles.skupinaBox, { backgroundColor: barvy.pozadiKarty, borderColor: barvy.ohraniceni }]}>
        {/* Stav */}
        <View style={styles.radek}>
          <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
            <View style={[styles.ikonaBox, { backgroundColor: barvy.akcentSvetla }]}>
              <MaterialCommunityIcons
                name={synchronizaceBezi ? "cloud-sync" : "database-outline"}
                size={20}
                color={barvy.akcent}
              />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.radekNadpis, { color: barvy.textHlavni, fontSize: 16 * m }]}>
                {pocetKontaktu} kontaktů
              </Text>
              <Text style={[styles.radekPopis, { color: barvy.textVedlejsi, fontSize: 13 * m }]}>
                Poslední aktualizace: {posledniSyncText}
              </Text>
            </View>
          </View>
        </View>

        {/* URL zdroje */}
        <View style={[
          styles.urlBox,
          { backgroundColor: barvy.akcentJemna, borderColor: barvy.ohraniceniJemne, marginTop: 12 }
        ]}>
          <MaterialCommunityIcons name="web" size={16 * m} color={barvy.textAkcent} />
          <Text
            style={[styles.urlText, { color: barvy.textAkcent, fontSize: 12 * m, flex: 1 }]}
            numberOfLines={1}
            ellipsizeMode="middle"
          >
            {urlKontaktu}
          </Text>
        </View>

        {/* Tlačítko synchronizace */}
        <TouchableOpacity
          style={[
            styles.syncTlacitko,
            { backgroundColor: synchronizaceBezi ? barvy.textPotrebny : barvy.akcent, marginTop: 14 }
          ]}
          onPress={naSpustitSynchronizaci}
          activeOpacity={0.85}
          disabled={synchronizaceBezi}
        >
          {synchronizaceBezi ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <MaterialCommunityIcons name="cloud-sync-outline" size={20 * m} color="#FFFFFF" />
          )}
          <Text style={[styles.syncTlacitkoText, { fontSize: 15 * m, color: "#fff" }]}>
            {synchronizaceBezi
              ? "Synchronizuji…"
              : `Synchronizovat z pupen.org`}
          </Text>
        </TouchableOpacity>

        <Text style={[styles.syncPopis, { color: barvy.textPotrebny, fontSize: 12 * m, marginTop: 8 }]}>
          Stažení nejnovějších kontaktů z veřejného JSON souboru · verze se porovnává a data se aktualizují pouze pokud je na webu novější verze.
        </Text>
      </View>

      {/* 6. SEKCE O APLIKACI */}
      <Text style={[styles.skupinaNadpis, { color: barvy.textVedlejsi, fontSize: 13 * m, marginTop: 24 }]}>
        O APLIKACI
      </Text>
      <View style={[styles.skupinaBox, { backgroundColor: barvy.pozadiKarty, borderColor: barvy.ohraniceni }]}>
        <Pressable
          android_ripple={{ color: barvy.akcentSvetla }}
          style={styles.radek}
          onPress={() => Linking.openURL("https://pupen.org")}
        >
          <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
            <View style={[styles.ikonaBox, { backgroundColor: barvy.akcentSvetla }]}>
              <MaterialCommunityIcons name="sprout" size={20} color={barvy.akcent} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.radekNadpis, { color: barvy.textHlavni, fontSize: 16 * m }]}>
                Studentský spolek Pupen, z.s.
              </Text>
              <Text style={[styles.radekPopis, { color: barvy.textVedlejsi, fontSize: 13 * m }]}>
                pupen.org – otevři web spolku
              </Text>
            </View>
          </View>
          <Ionicons name="open-outline" size={18} color={barvy.textVedlejsi} />
        </Pressable>

        {/* Disclaimer – požadavek uživatele */}
        <View style={{
          marginTop: 16,
          paddingTop: 16,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: barvy.ohraniceni
        }}>
          <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 10 }}>
            <View style={[styles.ikonaBox, { backgroundColor: barvy.akcentJemna, width: 34, height: 34 }]}>
              <MaterialCommunityIcons
                name="information-outline"
                size={18 * m}
                color={barvy.textAkcent}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.disclaimerNadpis, { color: barvy.textHlavni, fontSize: 14 * m }]}>
                Neoficiální aplikace
              </Text>
              <Text
                style={[
                  styles.disclaimerText,
                  { color: barvy.textVedlejsi, fontSize: 13 * m, marginTop: 6, lineHeight: 20 * m }
                ]}
                selectable
              >
                Linka od Pupenu je neoficiální studentská aplikace vyvinutá Studentským spolkem Pupen, z.s. Aplikace nesouvisí s vedením České zemědělské univerzity v Praze ani není tímto subjektem spravována. Všechna kontaktní data vycházejí z veřejně dostupných zdrojů na oficiálních stránkách univerzity.
              </Text>
            </View>
          </View>
        </View>
      </View>

      <Text style={[styles.vers, { color: barvy.textPotrebny, fontSize: 12 * m }]}>
        Linka · verze 1.2 · © 2026 Studentský spolek Pupen, z.s.
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16
  },
  skupinaNadpis: {
    marginTop: 20,
    marginBottom: 8,
    marginLeft: 4,
    fontWeight: "600",
    letterSpacing: 0.4
  },
  skupinaBox: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    overflow: "hidden"
  },
  radek: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 4
  },
  radekDvojice: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  tlacitkoVolba: {
    flex: 1,
    minWidth: 90,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderRadius: 12,
    gap: 6
  },
  tlacitkoVolbaText: {
    fontWeight: "600"
  },
  tlacitkoVelikost: {
    flex: 1,
    minWidth: 68,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderWidth: 1,
    borderRadius: 12
  },
  tlacitkoVelikostZnak: {
    fontWeight: "700"
  },
  tlacitkoVelikostPopis: {
    marginTop: 2
  },
  ikonaBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center"
  },
  radekNadpis: {
    fontWeight: "600"
  },
  radekPopis: {
    marginTop: 2
  },
  razeniRadek: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth
  },
  razeniText: {
    flex: 1,
    fontWeight: "500"
  },
  vers: {
    textAlign: "center",
    marginTop: 28,
    marginBottom: 4
  },
  disclaimerNadpis: {
    fontWeight: "700",
    letterSpacing: 0.1
  },
  disclaimerText: {
    textAlign: "left"
  },
  urlBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1
  },
  urlText: {
    fontWeight: "600",
    letterSpacing: 0.1
  },
  syncTlacitko: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 2
  },
  syncTlacitkoText: {
    fontWeight: "700"
  },
  syncPopis: {
    lineHeight: 17,
    textAlign: "left"
  }
});

export default Nastaveni;
