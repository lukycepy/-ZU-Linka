import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  ScrollView,
  ActivityIndicator
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { odeslatFormular } from "../services/emailService";

const PODPORA_EMAIL = "tech@pupen.org";
const PODPORA_JMENO = "Lukáš Čepelák";

/**
 * Předdefinované typy zpráv
 * #23 přidávámo nový typ „Navrhnout nový kontakt“
 */
const TYPY_ZPRAVY = [
  { id: "chyba",    nazev: "Nahlásit chybu",              ikona: "bug-outline",           predmet: "Chyba v aplikaci Linka" },
  { id: "navrh",    nazev: "Návrh na zlepšení",           ikona: "lightbulb-on-outline",  predmet: "Návrh na vylepšení aplikace Linka" },
  { id: "kontakt",  nazev: "Chybí kontakt / špatně",      ikona: "format-list-checks",    predmet: "Oprava / doplnění kontaktů v aplikaci Linka" },
  { id: "novy",     nazev: "Navrhnout nový kontakt",      ikona: "account-plus-outline",  predmet: "Návrh nového kontaktu pro aplikaci Linka" },
  { id: "osobni",   nazev: "Jiný dotaz",                  ikona: "help-circle-outline",   predmet: "Dotaz na aplikaci Linka" }
];

/**
 * Kontaktní formulář s podporou návrhu nového kontaktu (#23)
 */
const KontaktniFormular = ({
  barvy,
  velPisma,
  naZmenuNastaveni
}) => {
  const m = velPisma;
  const [typZpravy, setTypZpravy] = useState(TYPY_ZPRAVY[0].id);
  const [jmenoOdesilatele, setJmenoOdesilatele] = useState("");
  const [emailOdesilatele, setEmailOdesilatele] = useState("");
  const [textZpravy, setTextZpravy] = useState("");
  const [pridatPodrobnostiOSystemu, setPridatPodrobnostiOSystemu] = useState(true);

  // #23 pole pro nový kontakt
  const [novyJmeno, setNovyJmeno] = useState("");
  const [novyOddeleni, setNovyOddeleni] = useState("");
  const [novyFakulta, setNovyFakulta] = useState("");
  const [novyLinka, setNovyLinka] = useState("");
  const [novyCislo, setNovyCislo] = useState("");
  const [novyEmail, setNovyEmail] = useState("");
  const [novyBudova, setNovyBudova] = useState("");
  const [novyZdroj, setNovyZdroj] = useState("");

  // Stav: probíhá odesílání formuláře? (zabrání dvojkliku + spinner v tlačítku)
  const [odesilaSe, setOdesilaSe] = useState(false);

  const jeNovy = typZpravy === "novy";

  const sestavTechnickePodrobnosti = () => {
    if (!pridatPodrobnostiOSystemu) return "";
    return (
      "\n\n---\n" +
      "Technické informace:\n" +
      `Platforma: ${Platform.OS} ${Platform.Version}\n` +
      `Verze aplikace: 1.2.0\n` +
      `Uživatel: ${jmenoOdesilatele || "neuvedeno"}\n` +
      `Kontakt: ${emailOdesilatele || "neuvedeno"}\n`
    );
  };

  /**
   * Sestaví sekci s údaji nového kontaktu do těla mailu (#23)
   */
  const sestavNovyKontaktSection = () => {
    if (!jeNovy) return "";
    const radky = [
      "\n\n------------------------------",
      "NÁVRH NOVÉHO KONTAKTU:",
      "------------------------------",
      `Jméno a titul:     ${novyJmeno || "—"}`,
      `Oddělení:          ${novyOddeleni || "—"}`,
      `Fakulta / útvar:   ${novyFakulta || "—"}`,
      `Linka (4 čísla):   ${novyLinka || "—"}`,
      `Telefonní číslo:   ${novyCislo || "—"}`,
      `E‑mail:            ${novyEmail || "—"}`,
      `Budova / místnost: ${novyBudova || "—"}`,
      `Zdroj / odkaz:     ${novyZdroj || "—"}`,
      "------------------------------"
    ];
    return radky.join("\n");
  };

  const odeslatDotaz = async () => {
    // Minimální délka textu záleží na typu
    const prazdnyNovy = jeNovy &&
      !novyJmeno && !novyLinka && !novyCislo && !novyEmail && !novyOddeleni;

    if (textZpravy.trim().length < 5 && !(jeNovy && !prazdnyNovy)) {
      Alert.alert(
        "Krátký text",
        "Prosím, napište alespoň několik slov k Vašemu dotazu, abychom mohli lépe reagovat.",
        [{ text: "Dobře" }]
      );
      return;
    }

    if (jeNovy && prazdnyNovy && textZpravy.trim().length < 5) {
      Alert.alert(
        "Chybí údaje",
        "Vyplňte prosím alespoň jméno nebo linku návrhu nového kontaktu (nebo do popisku).",
        [{ text: "Dobře" }]
      );
      return;
    }

    // Stav odesílání (zabrání dvojkliku)
    setOdesilaSe(true);

    try {
      const vybranyTyp = TYPY_ZPRAVY.find((t) => t.id === typZpravy) || TYPY_ZPRAVY[0];

      // Data pro e-mail – srovnáno s emailService (HTTP i mailto fallback)
      const dataFormulare = {
        typZpravyNazev: vybranyTyp.predmet,
        jmeno: jmenoOdesilatele,
        email: emailOdesilatele,
        textZpravy:
          (jmenoOdesilatele ? `Dobrý den, jmenuji se ${jmenoOdesilatele}.\n\n` : "Dobrý den,\n\n") +
          textZpravy +
          sestavNovyKontaktSection() +
          sestavTechnickePodrobnosti() +
          `\n\nS pozdravem\n${jmenoOdesilatele || "Uživatel aplikace Linka"}`,
        novyKontakt: jeNovy
          ? {
              jmeno: novyJmeno,
              oddeleni: novyOddeleni,
              fakulta: novyFakulta,
              linka: novyLinka,
              cislo: novyCislo,
              email: novyEmail,
              budova: novyBudova,
              zdroj: novyZdroj
            }
          : null,
        zarizeniInfo: pridatPodrobnostiOSystemu
          ? {
              Platforma: `${Platform.OS} ${Platform.Version || ""}`,
              "Verze aplikace": "1.2.0",
              "Jméno uživatele": jmenoOdesilatele || "neuvedeno",
              "E-mail uživatele": emailOdesilatele || "neuvedeno"
            }
          : null
      };

      // Odeslat formulář → Nejprve HTTP (FormSubmit), pokud selže, mailto fallback
      // (emailService.odeslatFormular() si sám volá Linking.openURL pro fallback)
      const vysledek = await odeslatFormular(dataFormulare, {
        otevreMailto: async (url) => {
          try {
            const muzeme = await Linking.canOpenURL(url);
            if (muzeme) {
              await Linking.openURL(url);
            } else {
              Alert.alert(
                "Pošlete nám e‑mail",
                `Nepodařilo se otevřít e‑mailovou aplikaci.\n\nNapište nám na:  ${PODPORA_EMAIL}\n${PODPORA_JMENO}`,
                [{ text: "Zavřít", style: "cancel" }]
              );
            }
          } catch (e) {
            Alert.alert("Chyba", `Nelze otevřít e‑mail klienta.\nNapište nám na:  ${PODPORA_EMAIL}`);
          }
        }
      });

      // Zpráva uživateli dle výsledku
      if (vysledek.uspech) {
        // ✅ Doručeno přímo přes HTTP (app@pupen.org → tech@pupen.org)
        Alert.alert(
          "✅ Zpráva byla odeslána",
          "Děkujeme! Váš dotaz dorazil přímo na podporu (app@pupen.org → tech@pupen.org). Ozveme se Vám co nejdříve.",
          [{ text: "Skvělé" }]
        );

        // Vyčistit formulář
        setTextZpravy("");
        if (jeNovy) {
          setNovyJmeno("");
          setNovyOddeleni("");
          setNovyFakulta("");
          setNovyLinka("");
          setNovyCislo("");
          setNovyEmail("");
          setNovyBudova("");
          setNovyZdroj("");
        }
      } else if (vysledek.pouzito === "MAILTO") {
        // HTTP selhalo, ale otevřel se mail klient → uživatel odesílá ručně
        Alert.alert(
          "📝 Připraveno v e‑mailu",
          "Formulář se nepodařilo odeslat přímo (pravděpodobně chybí připojení). Byl otevřen Váš e‑mailový klient, stačí tam pouze stisknout Odeslat.",
          [{ text: "Rozumím" }]
        );
      } else {
        throw new Error(vysledek.chyba || "Neznámá chyba");
      }
    } catch (chyba) {
      console.error("Chyba při odesílání formuláře:", chyba);
      Alert.alert(
        "❌ Odeslání selhalo",
        `Nepodařilo se odeslat zprávu.\n\nNapište nám prosím přímo na:\n${PODPORA_EMAIL}\n\n${PODPORA_JMENO}`,
        [{ text: "OK" }]
      );
    } finally {
      setOdesilaSe(false);
    }
  };

  const otevritPrimyEmail = async () => {
    try {
      const url = `mailto:${PODPORA_EMAIL}`;
      await Linking.openURL(url);
    } catch (chyba) {
      Alert.alert(
        "E‑mailová adresa",
        `Napište nám na: ${PODPORA_EMAIL}\n\n${PODPORA_JMENO}`,
        [{ text: "Rozumím" }]
      );
    }
  };

  const textInputStyle = {
    backgroundColor: barvy.pozadiKarty,
    borderColor: barvy.inputOhraniceni,
    color: barvy.textHlavni,
    fontSize: 15 * m
  };

  return (
    <ScrollView
      style={{ backgroundColor: barvy.pozadi, flex: 1 }}
      contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 48 }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Záhlaví */}
      <View style={[
        styly.kontaktHlavicka,
        { backgroundColor: barvy.akcentJemna, borderColor: barvy.ohraniceni, borderWidth: 1 }
      ]}>
        <View style={[styly.avatar, { backgroundColor: barvy.akcent }]}>
          <MaterialCommunityIcons name="account-tie" size={32 * m} color="#FFFFFF" />
        </View>
        <View style={styly.kontaktHlavickaText}>
          <Text style={[styly.kontaktJmeno, { color: barvy.textHlavni, fontSize: 16 * m }]}>
            {PODPORA_JMENO}
          </Text>
          <Text style={[styly.kontaktFunkce, { color: barvy.textVedlejsi, fontSize: 12 * m }]}>
            Podpora aplikace Linka · Studentský spolek Pupen, z.s.
          </Text>
        </View>
      </View>

      {/* Rychlé akce */}
      <View style={styly.rychleAkce}>
        <TouchableOpacity
          style={[
            styly.akceTlacitko,
            { backgroundColor: barvy.pozadiKarty, borderColor: barvy.ohraniceni }
          ]}
          onPress={otevritPrimyEmail}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="email-outline" size={20 * m} color={barvy.textAkcent} />
          <Text style={[styly.akceText, { color: barvy.textAkcent, fontSize: 14 * m }]}>
            {PODPORA_EMAIL}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Typ zprávy */}
      <Text style={[styly.stitekFormulare, { color: barvy.textVedlejsi, fontSize: 13 * m }]}>
        Typ dotazu
      </Text>
      <View style={styly.typyKontejner}>
        {TYPY_ZPRAVY.map((typ) => (
          <TouchableOpacity
            key={typ.id}
            style={[
              styly.typTlacitko,
              { backgroundColor: typZpravy === typ.id ? barvy.akcent : barvy.pozadiKarty,
                borderColor: typZpravy === typ.id ? barvy.akcent : barvy.ohraniceni,
                borderWidth: 1 }
            ]}
            onPress={() => setTypZpravy(typ.id)}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name={typ.ikona}
              size={18}
              color={typZpravy === typ.id ? "#FFFFFF" : barvy.textVedlejsi}
            />
            <Text
              style={[
                styly.typText,
                { color: typZpravy === typ.id ? "#FFFFFF" : barvy.textHlavni, fontSize: 13 * m }
              ]}
              numberOfLines={1}
            >
              {typ.nazev}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Jméno a e‑mail */}
      <Text style={[styly.stitekFormulare, { color: barvy.textVedlejsi, fontSize: 13 * m }]}>
        Vaše jméno (nepovinné)
      </Text>
      <TextInput
        style={[styly.textInput, textInputStyle]}
        placeholder="Jan Novák"
        placeholderTextColor={barvy.textPotrebny}
        value={jmenoOdesilatele}
        onChangeText={setJmenoOdesilatele}
        autoCorrect={false}
        autoCapitalize="words"
      />

      <Text style={[styly.stitekFormulare, { color: barvy.textVedlejsi, fontSize: 13 * m }]}>
        E‑mail na odpověď (nepovinné)
      </Text>
      <TextInput
        style={[styly.textInput, textInputStyle]}
        placeholder="vas@email.cz"
        placeholderTextColor={barvy.textPotrebny}
        value={emailOdesilatele}
        onChangeText={setEmailOdesilatele}
        keyboardType="email-address"
        autoCorrect={false}
        autoCapitalize="none"
      />

      {/* ======= #23: Sekce NAVRH KONTAKTU – pouze pokud je vybráno ======= */}
      {jeNovy && (
        <View style={{ marginTop: 10 }}>
          <View style={[
            styly.sekceOddelovac,
            { backgroundColor: barvy.akcentSvetla, borderColor: barvy.akcent }
          ]}>
            <MaterialCommunityIcons name="account-plus-outline" size={20} color={barvy.akcent} />
            <Text style={[
              styly.sekceOddelovacText,
              { color: barvy.textAkcent, fontSize: 14 * m }
            ]}>
              Údaje navrhovaného kontaktu
            </Text>
          </View>

          <Text style={[styly.stitekFormulare, { color: barvy.textVedlejsi, fontSize: 13 * m }]}>
            Jméno a tituly *
          </Text>
          <TextInput
            style={[styly.textInput, textInputStyle]}
            placeholder="např. Ing. Jan Novák, Ph.D."
            placeholderTextColor={barvy.textPotrebny}
            value={novyJmeno}
            onChangeText={setNovyJmeno}
            autoCorrect={false}
            autoCapitalize="words"
          />

          <View style={styly.dvaSloupce}>
            <View style={{ flex: 1 }}>
              <Text style={[styly.stitekFormulare, { color: barvy.textVedlejsi, fontSize: 13 * m }]}>
                Oddělení
              </Text>
              <TextInput
                style={[styly.textInput, textInputStyle]}
                placeholder="Katedra / oddělení"
                placeholderTextColor={barvy.textPotrebny}
                value={novyOddeleni}
                onChangeText={setNovyOddeleni}
                autoCorrect={false}
                autoCapitalize="sentences"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styly.stitekFormulare, { color: barvy.textVedlejsi, fontSize: 13 * m }]}>
                Fakulta / útvar
              </Text>
              <TextInput
                style={[styly.textInput, textInputStyle]}
                placeholder="Fakulta ..."
                placeholderTextColor={barvy.textPotrebny}
                value={novyFakulta}
                onChangeText={setNovyFakulta}
                autoCorrect={false}
                autoCapitalize="words"
              />
            </View>
          </View>

          <View style={styly.dvaSloupce}>
            <View style={{ flex: 1 }}>
              <Text style={[styly.stitekFormulare, { color: barvy.textVedlejsi, fontSize: 13 * m }]}>
                Linka (4 číslice)
              </Text>
              <TextInput
                style={[styly.textInput, textInputStyle]}
                placeholder="např. 1234"
                placeholderTextColor={barvy.textPotrebny}
                value={novyLinka}
                onChangeText={setNovyLinka}
                keyboardType="number-pad"
                maxLength={4}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styly.stitekFormulare, { color: barvy.textVedlejsi, fontSize: 13 * m }]}>
                Telefon (celé)
              </Text>
              <TextInput
                style={[styly.textInput, textInputStyle]}
                placeholder="+420 224 381 234"
                placeholderTextColor={barvy.textPotrebny}
                value={novyCislo}
                onChangeText={setNovyCislo}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <Text style={[styly.stitekFormulare, { color: barvy.textVedlejsi, fontSize: 13 * m }]}>
            E‑mail osoby
          </Text>
          <TextInput
            style={[styly.textInput, textInputStyle]}
            placeholder="osoba@domena.cz"
            placeholderTextColor={barvy.textPotrebny}
            value={novyEmail}
            onChangeText={setNovyEmail}
            keyboardType="email-address"
            autoCorrect={false}
            autoCapitalize="none"
          />

          <View style={styly.dvaSloupce}>
            <View style={{ flex: 1 }}>
              <Text style={[styly.stitekFormulare, { color: barvy.textVedlejsi, fontSize: 13 * m }]}>
                Budova / místnost
              </Text>
              <TextInput
                style={[styly.textInput, textInputStyle]}
                placeholder="např. Kampus A / 3.21"
                placeholderTextColor={barvy.textPotrebny}
                value={novyBudova}
                onChangeText={setNovyBudova}
                autoCorrect={false}
                autoCapitalize="words"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styly.stitekFormulare, { color: barvy.textVedlejsi, fontSize: 13 * m }]}>
                Zdroj / odkaz
              </Text>
              <TextInput
                style={[styly.textInput, textInputStyle]}
                placeholder="https://..."
                placeholderTextColor={barvy.textPotrebny}
                value={novyZdroj}
                onChangeText={setNovyZdroj}
                autoCorrect={false}
                autoCapitalize="none"
              />
            </View>
          </View>
        </View>
      )}

      {/* Text zprávy */}
      <Text style={[styly.stitekFormulare, { color: barvy.textVedlejsi, fontSize: 13 * m }]}>
        {jeNovy ? "Poznámka / doplnění (nepovinné)" : "Popište Váš dotaz"}
      </Text>
      <TextInput
        style={[styly.textInput, styly.textArea, textInputStyle]}
        placeholder={
          jeNovy
            ? "Případně upřesněte, co víte o dané osobě…"
            : "Sem napište podrobnosti, které nám pomohou odpovědět..."
        }
        placeholderTextColor={barvy.textPotrebny}
        value={textZpravy}
        onChangeText={setTextZpravy}
        multiline={true}
        numberOfLines={6}
        textAlignVertical="top"
      />

      {/* Systémové informace */}
      <TouchableOpacity
        style={styly.prepinacRadek}
        onPress={() => setPridatPodrobnostiOSystemu(!pridatPodrobnostiOSystemu)}
        activeOpacity={0.7}
      >
        <MaterialCommunityIcons
          name={pridatPodrobnostiOSystemu ? "checkbox-marked" : "checkbox-blank-outline"}
          size={22}
          color={pridatPodrobnostiOSystemu ? barvy.akcent : barvy.textPotrebny}
        />
        <Text style={[styly.prepinacText, { color: barvy.textVedlejsi, fontSize: 13 * m }]}>
          Připojit informace o zařízení pro snazší řešení
        </Text>
      </TouchableOpacity>

      {/* Odeslat */}
      <TouchableOpacity
        style={[
          styly.odeslatTlacitko,
          { backgroundColor: odesilaSe
            ? barvy.textPotrebny
            : (textZpravy.trim().length < 3 && !(jeNovy && (novyJmeno || novyLinka)))
              ? barvy.textPotrebny
              : barvy.akcent }
        ]}
        onPress={odeslatDotaz}
        activeOpacity={0.85}
        disabled={odesilaSe}
      >
        {odesilaSe ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <MaterialCommunityIcons name="send-outline" size={20 * m} color="#FFFFFF" />
        )}
        <Text style={[styly.odeslatTlacitkoText, { fontSize: 15 * m, marginLeft: odesilaSe ? 10 : 0 }]}>
          {odesilaSe ? "Odesílám…" : "Odeslat (přímo z aplikace)"}
        </Text>
      </TouchableOpacity>

      <Text style={[styly.poznamkaText, { color: barvy.textPotrebny, fontSize: 12 * m }]}>
        Zpráva je nejprve odesílána přímo přes HTTPS z aplikace (z adresy app@pupen.org na {PODPORA_EMAIL} – bez nutnosti mailového klienta. Pokud toto selže, otevře se Váš e‑mail klient jako záložní řešení.
      </Text>
    </ScrollView>
  );
};

const styly = StyleSheet.create({
  kontaktHlavicka: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    gap: 14
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0
  },
  kontaktHlavickaText: { flex: 1, minWidth: 0 },
  kontaktJmeno: { fontWeight: "700", marginBottom: 2 },
  kontaktFunkce: {},
  rychleAkce: { marginBottom: 8 },
  akceTlacitko: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8
  },
  akceText: { fontWeight: "600" },
  stitekFormulare: {
    fontWeight: "600",
    marginBottom: 6,
    marginTop: 10
  },
  typyKontejner: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 4
  },
  typTlacitko: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10
  },
  typText: { fontWeight: "500" },
  dvaSloupce: { flexDirection: "row", gap: 10 },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12
  },
  textArea: {
    minHeight: 130,
    paddingTop: 12,
    paddingBottom: 12
  },
  prepinacRadek: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    gap: 10
  },
  prepinacText: { flex: 1, lineHeight: 18 },
  odeslatTlacitko: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 15,
    borderRadius: 14,
    marginTop: 8,
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 2
  },
  odeslatTlacitkoText: {
    color: "#FFFFFF",
    fontWeight: "600"
  },
  poznamkaText: {
    marginTop: 14,
    lineHeight: 18
  },
  sekceOddelovac: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 16,
    marginBottom: 4,
    borderWidth: 1
  },
  sekceOddelovacText: { fontWeight: "700" }
});

export default KontaktniFormular;
export { PODPORA_EMAIL, PODPORA_JMENO };
