import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Modal,
  Alert,
  Platform,
  Appearance
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StatusBar as ExpoStatusBar } from "expo-status-bar";
import RychleVytaceni from "./src/components/RychleVytaceni";
import VyhledavaniKontaktu from "./src/components/VyhledavaniKontaktu";
import KontaktniFormular from "./src/components/KontaktniFormular";
import Nastaveni from "./src/components/Nastaveni";
import {
  nactiPocatecniData,
  synchronizujKontakty
} from "./src/services/syncService";
import {
  nactiOblibene,
  prepniOblibene,
  ziskejPosledniSynchronizaci
} from "./src/services/storageService";
import { CONTACTS_URL } from "./src/data/defaultContacts";
import * as Linking from "expo-linking";
import { ziskejTema } from "./src/theme";
import {
  nactiNastaveni,
  aktualizujNastaveni,
  jeTma,
  velikostPismaMult
} from "./src/services/settingsService";
import { lehkyImpakt, stredniImpakt, uspech, chyba } from "./src/services/hapticService";
import {
  zkontrolujAktualizaci,
  jeVerzePreskocena,
  nastavPreskocenouVerzi,
  otevriStazeni,
  ziskejAktualniVerzi
} from "./src/services/updateService";
// #16 Android / iOS widget – POUZE Nativní platformy (NE Web / PWA)
let syncOblibeneWidget = async () => {};
if (Platform.OS !== "web") {
  try {
    // Použijeme dynamickou cestu (string literal concat), aby Metro při static
    // analýze nenačítal .widget.tsx modul do webového bundle vůbec.
    // Modul se tedy skutečně načte pouze při běhu na Androidu / iOS.
    const WIDGET_DIR = "./widgets/";
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const widgetMod = require(WIDGET_DIR + "linka-oblibene.widget");
    if (widgetMod?.syncOblibeneWidget) {
      syncOblibeneWidget = widgetMod.syncOblibeneWidget;
    }
  } catch (e) {
    // Pokud modul není dostupný – zůstane no-op, aplikace jede normálně
    console.warn("Widget modul není načten (OK pro dev / Web build):", e.message);
  }
}

const ZALOZKY = {
  RYCHLE_VYTACENI: "rychle",
  KONTAKTY: "kontakty",
  PODPORA: "podpora",
  NASTAVENI: "nastaveni"
};

const INFO_VYVOJAR = {
  nazev: "Studentský spolek Pupen, z.s.",
  web: "https://pupen.org",
  emailPodpora: "tech@pupen.org",
  emailInfo: "info@pupen.org",
  kontaktniOsoba: "Lukáš Čepelák"
};

/**
 * Hlavní vstupní bod aplikace Linka
 * Projekt Studentského spolku Pupen, z.s. – data získávána z veřejně dostupných zdrojů
 */
export default function App() {
  // Stav navigace
  const [aktivniZalozka, setAktivniZalozka] = useState(ZALOZKY.RYCHLE_VYTACENI);

  // Stav dat
  const [kontakty, setKontakty] = useState([]);
  const [verzeDat, setVerzeDat] = useState(0);
  const [oblibene, setOblibene] = useState([]);
  const [nacteno, setNacteno] = useState(false);

  // Stav synchronizace
  const [synchronizaceBezi, setSynchronizaceBezi] = useState(false);
  const [posledniSync, setPosledniSync] = useState(null);
  const [zobrazitInfoModal, setZobrazitInfoModal] = useState(false);
  const [zpravaSync, setZpravaSync] = useState(null);

  // #7 Barevné schéma systému
  const [systemTma, setSystemTma] = useState(
    Appearance.getColorScheme() === "dark"
  );

  // Nastavení
  const [nastaveni, setNastaveni] = useState(null);

  // ===== Načtení nastavení a dat =====
  useEffect(() => {
    (async () => {
      try {
        const nast = await nactiNastaveni();
        setNastaveni(nast);
      } catch (e) {
        console.warn("Nastavení nelze načíst:", e);
      }

      // Naslouchání na změny barevného schématu systému (pro #7 auto)
      const subscription = Appearance.addChangeListener(({ colorScheme }) => {
        setSystemTma(colorScheme === "dark");
      });

      await nactiData();
      return () => subscription?.remove?.();
    })();
  }, []);

  // ===== Kontrola dostupných aktualizací aplikace (distribuce mimo obchody) =====
  // Proběhne jednou po načtení aplikace. Pokud je na pupen.org novější APK
  // a uživatel u této verze nezvolil „Později", zobrazí se upozornění.
  useEffect(() => {
    if (!nacteno) return;
    (async () => {
      try {
        const vysl = await zkontrolujAktualizaci();
        if (!vysl.uspech || !vysl.dostupna) return;

        const cilovaVerze = vysl.nejnovejsi?.versionCode;
        if (await jeVerzePreskocena(cilovaVerze)) return;

        Alert.alert(
          "Je dostupná nová verze",
          `Je k dispozici novější verze aplikace Linka${
            vysl.nejnovejsi?.verze ? ` (${vysl.nejnovejsi.verze})` : ""
          }. Doporučujeme ji nainstalovat.`,
          [
            {
              text: "Později",
              style: "cancel",
              onPress: () => nastavPreskocenouVerzi(cilovaVerze)
            },
            {
              text: "Stáhnout",
              onPress: () => otevriStazeni(vysl.nejnovejsi?.url)
            }
          ]
        );
      } catch (e) {
        // Tichý fail – kontrola aktualizací nesmí narušit běh aplikace
      }
    })();
  }, [nacteno]);

  const nactiData = useCallback(async () => {
    try {
      const data = await nactiPocatecniData();
      setKontakty(data.contacts || []);
      setVerzeDat(data.version || 1);

      const oblibeneIds = await nactiOblibene();
      setOblibene(oblibeneIds);

      const sync = await ziskejPosledniSynchronizaci();
      setPosledniSync(sync);

      setNacteno(true);
      await synchronizujNaPozadi();

      // #16 Při prvním spuštění synchronizovat oblíbené do widgetu
      try {
        await syncOblibeneWidget(oblibeneIds, data.contacts || []);
      } catch (e) {
        console.warn("Widget sync po startu selhal:", e.message);
      }
    } catch (chyba) {
      console.error("Chyba při načítání dat:", chyba);
      setNacteno(true);
    }
  }, []);

  const synchronizujNaPozadi = useCallback(async () => {
    setSynchronizaceBezi(true);
    try {
      const vysledek = await synchronizujKontakty();
      setZpravaSync({
        uspech: vysledek.uspesna,
        zprava: vysledek.zprava
      });
      if (vysledek.aktualizovano) {
        const { nactiKontakty } = require("./src/services/storageService");
        const novaData = await nactiKontakty();
        setKontakty(novaData.contacts || []);
        setVerzeDat(novaData.version || 1);

        // #16 Synchronizovat widget i po stažení nových kontaktů
        try {
          await syncOblibeneWidget(oblibene, novaData.contacts || []);
        } catch (e) {
          console.warn("Widget sync po stažení kontaktů selhal:", e.message);
        }
      }
      const sync = await ziskejPosledniSynchronizaci();
      setPosledniSync(sync);
      setTimeout(() => setZpravaSync(null), 3000);
      return vysledek;  // Vrátit výsledek pro ruční volání
    } catch (chyba) {
      console.error("Chyba synchronizace:", chyba);
      setZpravaSync({ uspech: false, zprava: "Chyba při synchronizaci dat" });
      setTimeout(() => setZpravaSync(null), 3000);
      return { uspesna: false, aktualizovano: false, zprava: "Neznámá chyba" };
    } finally {
      setSynchronizaceBezi(false);
    }
  }, [oblibene]);

  const rucniSynchronizace = useCallback(async () => {
    try {
      if (nastaveni) stredniImpakt(nastaveni.haptikaZapnuta);
      const vysledek = await synchronizujNaPozadi();
      if (vysledek) {
        if (vysledek.uspesna && vysledek.aktualizovano) {
          uspech(nastaveni?.haptikaZapnuta);
          Alert.alert(
            "✅ Kontakty aktualizovány",
            `Stažena nejnovější verze kontaktů z pupen.org.\n\n${vysledek.zprava}`
          );
        } else if (vysledek.uspesna) {
          Alert.alert(
            "Již máte aktuální data",
            `Na webu není novější verze než ta, kterou máte uloženou.\n\n${vysledek.zprava}`
          );
        } else {
          chyba(nastaveni?.haptikaZapnuta);
          Alert.alert(
            "❌ Synchronizace selhala",
            `Data se nepodařilo stáhnout z webu. Používají se lokálně uložené kontakty.\n\nPodrobnosti: ${vysledek.zprava || "Chybí připojení k internetu"}`
          );
        }
      }
    } catch (e) {
      chyba(nastaveni?.haptikaZapnuta);
      Alert.alert("Chyba synchronizace", String(e?.message || e));
    }
  }, [synchronizujNaPozadi, nastaveni]);

  /**
   * Hlavní změna nastavení (#7, #8, #12, #9, #10)
   */
  const naZmenuNastaveni = useCallback(async (klic, hodnota) => {
    if (!nastaveni) return;
    lehkyImpakt(nastaveni.haptikaZapnuta);
    try {
      const nove = await aktualizujNastaveni(nastaveni, klic, hodnota);
      setNastaveni(nove);
    } catch (e) {
      console.error("Změna nastavení selhala:", e);
      // Lokální optmistic update i při selhání AsyncStorage
      setNastaveni({ ...nastaveni, [klic]: hodnota });
    }
  }, [nastaveni]);

  const naPrepnutiOblibeneho = useCallback(async (idKontaktu) => {
    try {
      if (nastaveni) stredniImpakt(nastaveni.haptikaZapnuta);
      const novyStav = await prepniOblibene(idKontaktu);
      const noveOblibene = novyStav
        ? [...oblibene, idKontaktu]
        : oblibene.filter((id) => id !== idKontaktu);
      setOblibene(noveOblibene);
      // #16 Synchronizovat do widgetu okamžitě po změně
      try {
        await syncOblibeneWidget(noveOblibene, kontakty);
      } catch (e) {
        console.warn("Widget sync při přepnutí selhal:", e.message);
      }
    } catch (chyba) {
      console.error("Chyba při přepínání oblíbeného:", chyba);
      Alert.alert("Chyba", "Nepodařilo se upravit oblíbené kontakty.");
    }
  }, [nastaveni, oblibene, kontakty]);

  const formatujDatumSync = () => {
    if (!posledniSync) return "Nikdy";
    try {
      const datum = new Date(posledniSync);
      const dnes = new Date();
      const jeDnes = datum.toDateString() === dnes.toDateString();
      if (jeDnes) {
        return "Dnes " + datum.toLocaleTimeString("cs-CZ", {
          hour: "2-digit",
          minute: "2-digit"
        });
      }
      return datum.toLocaleDateString("cs-CZ", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return "Neznámé";
    }
  };

  // === Téma + velikost písma ===
  const tma = nastaveni ? jeTma(nastaveni, systemTma ? "dark" : "light") : false;
  const barvy = ziskejTema(tma);
  const velPisma = nastaveni ? velikostPismaMult(nastaveni.velikostPisma ?? 1) : 1.0;

  // Aktuální verze aplikace (z app.json) – pro zobrazení v informacích
  const infoVerze = ziskejAktualniVerzi();

  // ===== Loading obrazovka (dokud nejsou načtena data) =====
  if (!nacteno || !nastaveni) {
    return (
      <View style={[styly.nacitaciObrazovka, { backgroundColor: barvy.akcent }]}>
        <View style={styly.nacitaciLogo}>
          <MaterialCommunityIcons name="phone-classic" size={72} color="#FFFFFF" />
        </View>
        <Text style={[styly.nacitaciNadpis, { color: "#fff" }]}>Linka</Text>
        <Text style={[styly.nacitaciPopis, { color: "rgba(255,255,255,0.85)" }]}>
          Projekt Studentského spolku Pupen, z.s.
        </Text>
        <ActivityIndicator size="large" color="#FFFFFF" style={{ marginTop: 24 }} />
        <ExpoStatusBar style="light" backgroundColor={barvy.akcent} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styly.kontejner, { backgroundColor: barvy.pozadi }]}>
      <ExpoStatusBar
        style={tma ? "light" : "light"}
        backgroundColor={barvy.pozadiHlavicky}
      />

      {/* Hlavička */}
      <View style={[styly.kontejnerHlavicky, { backgroundColor: barvy.pozadiHlavicky }]}>
        <View style={styly.hlavicka}>
          <View style={styly.logoKontejner}>
            <View style={[styly.logoObal, { backgroundColor: "rgba(255,255,255,0.15)" }]}>
              <MaterialCommunityIcons name="phone-classic" size={24} color="#FFFFFF" />
            </View>
            <View style={styly.nazevKontejner}>
              <Text style={[styly.nazevAplikace, { fontSize: 19 * velPisma }]}>Linka</Text>
              <Text style={styly.podnazevAplikace}>
                {kontakty.length} kontaktů · v{verzeDat} · Pupen
              </Text>
            </View>
          </View>
          <View style={styly.hlavickaAkce}>
            <TouchableOpacity
              onPress={() => {
                lehkyImpakt(nastaveni.haptikaZapnuta);
                synchronizujNaPozadi();
              }}
              style={styly.syncTlacitko}
              activeOpacity={0.7}
            >
              {synchronizaceBezi ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <MaterialCommunityIcons name="cloud-sync-outline" size={24} color="#FFFFFF" />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                lehkyImpakt(nastaveni.haptikaZapnuta);
                setZobrazitInfoModal(true);
              }}
              style={styly.infoTlacitko}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="information-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {zpravaSync && (
          <View style={[
            styly.zpravaSync,
            { backgroundColor: zpravaSync.uspech ? barvy.akcent : barvy.chyba }
          ]}>
            <MaterialCommunityIcons
              name={zpravaSync.uspech ? "check-circle" : "alert-circle"}
              size={16}
              color="#FFFFFF"
            />
            <Text style={[styly.zpravaSyncText, { fontSize: 13 * velPisma }]}>
              {zpravaSync.zprava}
            </Text>
          </View>
        )}
      </View>

      {/* Obsah */}
      <View style={styly.obsahKontejner}>
        {aktivniZalozka === ZALOZKY.RYCHLE_VYTACENI ? (
          <ScrollView
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
            refreshControl={
              <RefreshControl
                refreshing={synchronizaceBezi}
                onRefresh={rucniSynchronizace}
                tintColor={barvy.akcent}
                colors={[barvy.akcent]}
              />
            }
          >
            <RychleVytaceni barvy={barvy} velPisma={velPisma} nastaveni={nastaveni} />
          </ScrollView>
        ) : aktivniZalozka === ZALOZKY.KONTAKTY ? (
          <VyhledavaniKontaktu
            kontakty={kontakty}
            oblibene={oblibene}
            naPrepnutiOblibeneho={naPrepnutiOblibeneho}
            barvy={barvy}
            velPisma={velPisma}
            nastaveni={nastaveni}
            naZmenuNastaveni={naZmenuNastaveni}
          />
        ) : aktivniZalozka === ZALOZKY.PODPORA ? (
          <KontaktniFormular
            barvy={barvy}
            velPisma={velPisma}
            naZmenuNastaveni={naZmenuNastaveni}
          />
        ) : (
          // ZÁLOŽKA NASTAVENÍ
          <Nastaveni
            barvy={barvy}
            velikostPismaMult={velPisma}
            nastaveni={nastaveni}
            naZmenuNastaveni={naZmenuNastaveni}
            synchronizaceBezi={synchronizaceBezi}
            posledniSyncText={formatujDatumSync()}
            pocetKontaktu={kontakty.length}
            naSpustitSynchronizaci={rucniSynchronizace}
            urlKontaktu={CONTACTS_URL}
          />
        )}
      </View>

      {/* Dolní navigace – 4 záložky */}
      <View style={[
        styly.dolniNavigaceKontejner,
        { backgroundColor: barvy.pozadiKarty, borderTopColor: barvy.ohraniceni }
      ]}>
        <View style={styly.dolniNavigace}>
          <Zalozka
            aktivni={aktivniZalozka === ZALOZKY.RYCHLE_VYTACENI}
            ikona="dialpad"
            ikonaAktivni="dialpad"
            nazev="Vytáčení"
            barvy={barvy}
            velPisma={velPisma}
            haptika={nastaveni.haptikaZapnuta}
            onPress={() => {
              lehkyImpakt(nastaveni.haptikaZapnuta);
              setAktivniZalozka(ZALOZKY.RYCHLE_VYTACENI);
            }}
          />
          <Zalozka
            aktivni={aktivniZalozka === ZALOZKY.KONTAKTY}
            ikona="account-search-outline"
            ikonaAktivni="account-search"
            nazev="Kontakty"
            barvy={barvy}
            velPisma={velPisma}
            badge={oblibene.length > 0 ? oblibene.length : null}
            badgeBarva={barvy.hvizda}
            onPress={() => {
              lehkyImpakt(nastaveni.haptikaZapnuta);
              setAktivniZalozka(ZALOZKY.KONTAKTY);
            }}
          />
          <Zalozka
            aktivni={aktivniZalozka === ZALOZKY.PODPORA}
            ikona="chat-question-outline"
            ikonaAktivni="chat-question"
            nazev="Podpora"
            barvy={barvy}
            velPisma={velPisma}
            onPress={() => {
              lehkyImpakt(nastaveni.haptikaZapnuta);
              setAktivniZalozka(ZALOZKY.PODPORA);
            }}
          />
          <Zalozka
            aktivni={aktivniZalozka === ZALOZKY.NASTAVENI}
            ikona="cog-outline"
            ikonaAktivni="cog"
            nazev="Nastavení"
            barvy={barvy}
            velPisma={velPisma}
            onPress={() => {
              lehkyImpakt(nastaveni.haptikaZapnuta);
              setAktivniZalozka(ZALOZKY.NASTAVENI);
            }}
          />
        </View>
      </View>

      {/* Info modal s podporou tmavého režimu */}
      <Modal
        visible={zobrazitInfoModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setZobrazitInfoModal(false)}
      >
        <View style={styly.modalKontejner}>
          <View style={[styly.modalObsah, { backgroundColor: barvy.pozadiKarty }]}>
            <View style={[styly.modalHlavicka, { borderBottomColor: barvy.ohraniceniJemne }]}>
              <Text style={[styly.modalNadpis, { color: barvy.textHlavni, fontSize: 20 * velPisma }]}>
                O aplikaci Linka
              </Text>
              <TouchableOpacity
                onPress={() => setZobrazitInfoModal(false)}
                style={[styly.modalZavritTlacitko, { backgroundColor: barvy.ohraniceniJemne }]}
                activeOpacity={0.6}
              >
                <MaterialCommunityIcons name="close" size={24} color={barvy.textVedlejsi} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styly.modalScroll} showsVerticalScrollIndicator={false}>
              <View style={styly.modalSekce}>
                <View style={[styly.modalLogoVelke, { backgroundColor: barvy.akcent }]}>
                  <MaterialCommunityIcons name="phone-classic" size={48 * velPisma} color="#FFFFFF" />
                </View>
                <Text style={[styly.modalNazevAplikace, { color: barvy.textHlavni, fontSize: 24 * velPisma }]}>
                  Linka
                </Text>
                <Text style={[styly.modalVerze, { color: barvy.textVedlejsi, fontSize: 14 * velPisma }]}>
                  Verze {infoVerze.verze}
                </Text>
              </View>

              <View style={styly.modalSekce}>
                <Text style={[styly.modalPopis, { color: barvy.textVedlejsi, fontSize: 15 * velPisma }]}>
                  Aplikace pro rychlé vyhledávání a vytáčení interních
                  telefonních linek. Pracuje s veřejně dostupnými daty.
                </Text>
              </View>

              <View style={[styly.vyvojarKarta, { backgroundColor: barvy.akcentJemna, borderColor: barvy.ohraniceni }]}>
                <View style={[styly.vyvojarLogo, { backgroundColor: barvy.akcent }]}>
                  <MaterialCommunityIcons name="sprout-outline" size={32} color="#FFFFFF" />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={[styly.vyvojarNazev, { color: barvy.textHlavni, fontSize: 16 * velPisma }]}>
                    {INFO_VYVOJAR.nazev}
                  </Text>
                  <View style={styly.vyvojarTag}>
                    <MaterialCommunityIcons name="heart" size={12} color="#EF4444" />
                    <Text style={[styly.vyvojarTagText, { color: barvy.textVedlejsi, fontSize: 12 * velPisma }]}>
                      Vyvinuto dobrovolníky
                    </Text>
                  </View>
                </View>
              </View>

              <View style={[styly.modalSeznam, { backgroundColor: barvy.akcentJemna, borderRadius: 16 }]}>
                <PolozkaInformace
                  ikona="format-list-numbered"
                  nazev="Počet kontaktů"
                  hodnota={`${kontakty.length} osob`}
                  barvy={barvy}
                  velPisma={velPisma}
                />
                <PolozkaInformace
                  ikona="tag-outline"
                  nazev="Verze dat"
                  hodnota={`v${verzeDat}`}
                  barvy={barvy}
                  velPisma={velPisma}
                />
                <PolozkaInformace
                  ikona="clock-outline"
                  nazev="Poslední aktualizace"
                  hodnota={formatujDatumSync()}
                  barvy={barvy}
                  velPisma={velPisma}
                />
                <PolozkaInformace
                  ikona="database-outline"
                  nazev="Zdroj dat"
                  hodnota={CONTACTS_URL}
                  barvy={barvy}
                  velPisma={velPisma}
                />
                <PolozkaInformace
                  ikona="star-outline"
                  nazev="Oblíbené kontakty"
                  hodnota={`${oblibene.length} položek`}
                  barvy={barvy}
                  velPisma={velPisma}
                />
                <TouchableOpacity
                  onPress={() => Linking.openURL(`mailto:${INFO_VYVOJAR.emailPodpora}`)}
                  activeOpacity={0.6}
                >
                  <PolozkaInformace
                    ikona="email-outline"
                    nazev="Kontakt na podporu"
                    hodnota={`${INFO_VYVOJAR.kontaktniOsoba} · ${INFO_VYVOJAR.emailPodpora}`}
                    barvy={barvy}
                    velPisma={velPisma}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => Linking.openURL(INFO_VYVOJAR.web)}
                  activeOpacity={0.6}
                >
                  <PolozkaInformace
                    ikona="web"
                    nazev="Web spolku"
                    hodnota={INFO_VYVOJAR.web}
                    barvy={barvy}
                    velPisma={velPisma}
                  />
                </TouchableOpacity>
              </View>

              <View style={styly.modalSekce}>
                <Text style={[styly.modalPodsekceNadpis, { color: barvy.textHlavni, fontSize: 16 * velPisma }]}>
                  Jak používat:
                </Text>
                <View style={styly.navodKontejner}>
                  {[
                    {
                      1: "Do vytáčky zadejte 4místnou linku – hovor se spustí automaticky."
                    },
                    {
                      2: "V záložce Kontakty hledejte podle jména, oddělení, budovy nebo linky. Použijte filtry pro řazení a výběr fakulty."
                    },
                    {
                      3: "V horním menu každého kontaktu rozbalíte akci Sdílet / Uložit do telefonu."
                    },
                    {
                      4: "V Nastavení si upravte téma, velikost písma, haptiku a výchozí řazení."
                    }
                  ].map((krok) => {
                    const poradi = Object.keys(krok)[0];
                    const text = krok[poradi];
                    return (
                      <View key={poradi} style={styly.navodKrok}>
                        <View style={[styly.navodKrokCislo, { backgroundColor: barvy.akcent }]}>
                          <Text style={[styly.navodKrokCisloText, { color: "#fff", fontSize: 14 * velPisma }]}>
                            {poradi}
                          </Text>
                        </View>
                        <Text style={[styly.navodKrokText, { color: barvy.textVedlejsi, fontSize: 14 * velPisma }]}>
                          {text}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>

              <View style={styly.modalAkce}>
                <TouchableOpacity
                  style={[
                    styly.modalTlacitko,
                    styly.modalTlacitkoSekundarni,
                    {
                      backgroundColor: barvy.pozadiKarty,
                      borderColor: barvy.akcent
                    }
                  ]}
                  onPress={() => {
                    lehkyImpakt(nastaveni.haptikaZapnuta);
                    setZobrazitInfoModal(false);
                    setAktivniZalozka(ZALOZKY.PODPORA);
                  }}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons name="chat-question-outline" size={20 * velPisma} color={barvy.akcent} />
                  <Text style={[styly.modalTlacitkoTextSekundarni, { color: barvy.akcent, fontSize: 15 * velPisma }]}>
                    Napsat podpoře
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styly.modalTlacitko, { backgroundColor: barvy.akcent }]}
                  onPress={() => {
                    stredniImpakt(nastaveni.haptikaZapnuta);
                    setZobrazitInfoModal(false);
                    synchronizujNaPozadi();
                  }}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons name="cloud-sync-outline" size={20 * velPisma} color="#FFFFFF" />
                  <Text style={[styly.modalTlacitkoText, { fontSize: 15 * velPisma }]}>
                    Synchronizovat
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={[styly.modalPaticka, { color: barvy.textPotrebny, fontSize: 12 * velPisma }]}>
                © {new Date().getFullYear()} {INFO_VYVOJAR.nazev} · Vyvinuto s 💚
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const Zalozka = ({
  aktivni,
  ikona,
  ikonaAktivni,
  nazev,
  badge,
  badgeBarva,
  barvy,
  velPisma,
  onPress
}) => (
  <TouchableOpacity
    style={styly.zalozka}
    onPress={onPress}
    activeOpacity={0.75}
  >
    <View style={styly.zalozkaIkonaKontejner}>
      <MaterialCommunityIcons
        name={aktivni ? ikonaAktivni : ikona}
        size={26}
        color={aktivni ? barvy.akcent : barvy.textPotrebny}
      />
      {badge ? (
        <View style={[styly.zalozkaBadge, { backgroundColor: badgeBarva || barvy.chyba }]}>
          <Text style={styly.zalozkaBadgeText}>{badge}</Text>
        </View>
      ) : null}
    </View>
    <Text style={[
      styly.zalozkaText,
      {
        color: aktivni ? barvy.akcent : barvy.textPotrebny,
        fontSize: 12 * velPisma,
        fontWeight: aktivni ? "700" : "500"
      }
    ]}>
      {nazev}
    </Text>
  </TouchableOpacity>
);

const PolozkaInformace = ({ ikona, nazev, hodnota, barvy, velPisma }) => (
  <View style={[styly.polozkaInformace, { borderBottomColor: barvy.ohraniceniJemne }]}>
    <View style={[styly.polozkaInformaceIkona, { backgroundColor: barvy.akcentSvetla }]}>
      <MaterialCommunityIcons name={ikona} size={20} color={barvy.akcent} />
    </View>
    <View style={{ flex: 1, minWidth: 0 }}>
      <Text style={[styly.polozkaInformaceNazev, { color: barvy.textVedlejsi, fontSize: 12 * velPisma }]}>
        {nazev}
      </Text>
      <Text
        style={[styly.polozkaInformaceHodnota, { color: barvy.textHlavni, fontSize: 14 * velPisma }]}
        numberOfLines={1}
        ellipsizeMode="middle"
      >
        {hodnota}
      </Text>
    </View>
  </View>
);

const styly = StyleSheet.create({
  kontejner: { flex: 1 },
  nacitaciObrazovka: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32
  },
  nacitaciLogo: {
    width: 120,
    height: 120,
    borderRadius: 30,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24
  },
  nacitaciNadpis: {
    fontSize: 36,
    fontWeight: "800",
    marginBottom: 8
  },
  nacitaciPopis: {
    fontSize: 16
  },

  // Hlavička
  kontejnerHlavicky: {
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight + 8 : 8,
    paddingBottom: 8
  },
  hlavicka: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12
  },
  logoKontejner: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1
  },
  logoObal: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12
  },
  nazevKontejner: {
    flex: 1,
    minWidth: 0
  },
  nazevAplikace: {
    fontWeight: "700",
    color: "#FFFFFF"
  },
  podnazevAplikace: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 2
  },
  hlavickaAkce: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4
  },
  syncTlacitko: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.12)"
  },
  infoTlacitko: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.12)"
  },
  zpravaSync: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 8
  },
  zpravaSyncText: {
    fontWeight: "500",
    color: "#FFFFFF",
    flex: 1
  },

  // Obsah
  obsahKontejner: { flex: 1, overflow: "hidden" },

  // Dolní navigace
  dolniNavigaceKontejner: {
    borderTopWidth: 1,
    paddingBottom: Platform.OS === "ios" ? 8 : 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 8
  },
  dolniNavigace: {
    flexDirection: "row",
    paddingTop: 8
  },
  zalozka: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    gap: 2
  },
  zalozkaIkonaKontejner: { position: "relative" },
  zalozkaBadge: {
    position: "absolute",
    top: -4,
    right: -8,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4
  },
  zalozkaBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFFFFF"
  },
  zalozkaText: {},

  // Modal
  modalKontejner: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end"
  },
  modalObsah: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: "94%"
  },
  modalHlavicka: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    borderBottomWidth: 1
  },
  modalNadpis: {
    fontWeight: "700"
  },
  modalZavritTlacitko: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center"
  },
  modalScroll: {
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === "ios" ? 32 : 24
  },
  modalSekce: {
    paddingVertical: 16
  },
  modalLogoVelke: {
    width: 84,
    height: 84,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 12
  },
  modalNazevAplikace: {
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 4
  },
  modalVerze: {
    textAlign: "center"
  },
  modalPopis: {
    lineHeight: 22
  },
  modalSeznam: {
    paddingVertical: 4,
    overflow: "hidden"
  },
  polozkaInformace: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12
  },
  polozkaInformaceIkona: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0
  },
  polozkaInformaceNazev: {
    marginBottom: 2
  },
  polozkaInformaceHodnota: {
    fontWeight: "600"
  },
  modalPodsekceNadpis: {
    fontWeight: "700",
    marginBottom: 12
  },
  navodKontejner: {
    gap: 12
  },
  navodKrok: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12
  },
  navodKrokCislo: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: 2
  },
  navodKrokCisloText: {
    fontWeight: "700"
  },
  navodKrokText: {
    flex: 1,
    lineHeight: 20
  },
  modalTlacitko: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8
  },
  modalTlacitkoText: {
    color: "#FFFFFF",
    fontWeight: "700"
  },
  modalPaticka: {
    textAlign: "center",
    marginTop: 16
  },
  vyvojarKarta: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    padding: 14,
    gap: 14,
    marginBottom: 16,
    borderWidth: 1
  },
  vyvojarLogo: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0
  },
  vyvojarNazev: {
    fontWeight: "700",
    marginBottom: 4
  },
  vyvojarTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5
  },
  vyvojarTagText: {
    flex: 1
  },
  modalAkce: {
    flexDirection: "row",
    gap: 10,
    paddingVertical: 8
  },
  modalTlacitkoSekundarni: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5
  },
  modalTlacitkoTextSekundarni: {
    fontWeight: "700"
  }
});
