import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Keyboard,
  Alert
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  zavolej,
  vytvorCisloZLinky,
  jePlatnaLinka,
  formatujCislo
} from "../services/contactsService";
import { lehkyImpakt, silnyImpakt, uspech } from "../services/hapticService";

/**
 * Komponenta pro rychlé vytáčení 4místné linky
 * Podporuje téma (#7), velikost písma (#12) a haptiku (#8)
 */
const RychleVytaceni = ({ barvy, velPisma, nastaveni }) => {
  const m = velPisma;
  const [linka, setLinka] = useState("");
  const [zobrazitCislo, setZobrazitCislo] = useState(false);
  const inputRef = useRef(null);
  const haptika = nastaveni.haptikaZapnuta;

  useEffect(() => {
    if (jePlatnaLinka(linka) && linka.length === 4) {
      const casovac = setTimeout(() => {
        provedHovor();
      }, 300);
      return () => clearTimeout(casovac);
    }
  }, [linka]);

  const pridejCislici = (cislo) => {
    if (linka.length < 4) {
      lehkyImpakt(haptika);
      const novaLinka = linka + cislo;
      setLinka(novaLinka);
    }
  };

  const smazPosledni = () => {
    lehkyImpakt(haptika);
    setLinka((predchozi) => predchozi.slice(0, -1));
  };

  const vymazVse = () => {
    lehkyImpakt(haptika);
    setLinka("");
  };

  const provedHovor = async () => {
    if (!jePlatnaLinka(linka)) {
      Alert.alert("Neplatná linka", "Prosím zadejte platnou 4místnou linku.", [{ text: "OK" }]);
      return;
    }
    silnyImpakt(haptika);
    Keyboard.dismiss();
    try {
      await zavolej(linka);
      uspech(haptika);
    } catch (e) {
      Alert.alert(
        "Nelze volat",
        "Volání se nepodařilo spustit. Zkontrolujte prosím přístup telefonní aplikace.",
        [{ text: "OK" }]
      );
    }
  };

  const ukazkoveCislo = linka.length > 0 ? vytvorCisloZLinky(linka) : "";

  return (
    <View style={[styly.kontejner, { backgroundColor: barvy.pozadi }]}>
      <View style={styly.nadpisKontejner}>
        <Text style={[styly.nadpis, { color: barvy.textHlavni, fontSize: 24 * m }]}>
          Rychlé vytáčení
        </Text>
        <Text style={[styly.podnadpis, { color: barvy.textVedlejsi, fontSize: 15 * m }]}>
          Zadejte 4místnou linku
        </Text>
      </View>

      <View style={[
        styly.displejKontejner,
        { backgroundColor: barvy.pozadiKarty, borderColor: barvy.ohraniceni, borderWidth: 1 }
      ]}>
        <TextInput
          ref={inputRef}
          style={[styly.linkaText, { color: barvy.textAkcent, fontSize: 56 * m }]}
          value={linka}
          onChangeText={setLinka}
          keyboardType="numeric"
          maxLength={4}
          placeholder="• • • •"
          placeholderTextColor={barvy.textPotrebny}
          caretHidden={true}
        />
        <View style={styly.teckyKontejner}>
          {[0, 1, 2, 3].map((index) => (
            <View
              key={index}
              style={[
                styly.tecka,
                { borderColor: barvy.textPotrebny },
                linka.length > index && {
                  backgroundColor: barvy.akcent,
                  borderColor: barvy.akcent
                }
              ]}
            />
          ))}
        </View>

        {zobrazitCislo && ukazkoveCislo ? (
          <Text style={[styly.cisloText, { color: barvy.textVedlejsi, fontSize: 16 * m }]}>
            {formatujCislo(ukazkoveCislo)}
          </Text>
        ) : (
          <TouchableOpacity
            onPress={() => { lehkyImpakt(haptika); setZobrazitCislo(true); }}
            style={styly.zobrazitCisloTlacitko}
          >
            <Text style={[styly.zobrazitCisloText, { color: barvy.textAkcent, fontSize: 14 * m }]}>
              Zobrazit telefonní číslo
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styly.klavesniceKontejner}>
        <View style={styly.klavesniceRadek}>
          {[1, 2, 3].map((cislo) => (
            <KlavesoveTlacitko
              key={cislo}
              cislo={cislo}
              onPress={() => pridejCislici(String(cislo))}
              barvy={barvy}
              m={m}
            />
          ))}
        </View>
        <View style={styly.klavesniceRadek}>
          {[4, 5, 6].map((cislo) => (
            <KlavesoveTlacitko
              key={cislo}
              cislo={cislo}
              onPress={() => pridejCislici(String(cislo))}
              barvy={barvy}
              m={m}
            />
          ))}
        </View>
        <View style={styly.klavesniceRadek}>
          {[7, 8, 9].map((cislo) => (
            <KlavesoveTlacitko
              key={cislo}
              cislo={cislo}
              onPress={() => pridejCislici(String(cislo))}
              barvy={barvy}
              m={m}
            />
          ))}
        </View>
        <View style={styly.klavesniceRadek}>
          <TouchableOpacity
            style={[
              styly.klavesa,
              styly.klavesaSpec,
              { backgroundColor: barvy.klavesniceKladivoSpec, borderColor: barvy.ohraniceniJemne }
            ]}
            onPress={vymazVse}
            onLongPress={vymazVse}
            activeOpacity={0.6}
          >
            <MaterialCommunityIcons name="close" size={28 * m} color={barvy.textVedlejsi} />
          </TouchableOpacity>

          <KlavesoveTlacitko
            cislo={0}
            onPress={() => pridejCislici("0")}
            barvy={barvy}
            m={m}
          />

          <TouchableOpacity
            style={[
              styly.klavesa,
              styly.klavesaSpec,
              { backgroundColor: barvy.klavesniceKladivoSpec, borderColor: barvy.ohraniceniJemne }
            ]}
            onPress={smazPosledni}
            activeOpacity={0.6}
          >
            <MaterialCommunityIcons
              name="backspace-outline"
              size={28 * m}
              color={barvy.textVedlejsi}
            />
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity
        style={[
          styly.tlacitkoHovor,
          { backgroundColor: jePlatnaLinka(linka) ? barvy.akcent : barvy.textPotrebny }
        ]}
        onPress={provedHovor}
        activeOpacity={0.8}
        disabled={!jePlatnaLinka(linka)}
      >
        <MaterialCommunityIcons name="phone" size={32 * m} color="#FFFFFF" />
        <Text style={[styly.tlacitkoHovorText, { fontSize: 18 * m }]}>
          Zavolat na linku {linka || "• • • •"}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const KlavesoveTlacitko = ({ cislo, onPress, barvy, m }) => (
  <TouchableOpacity
    style={[
      styly.klavesa,
      {
        backgroundColor: barvy.klavesniceKladivo,
        borderColor: barvy.ohraniceniJemne,
        borderWidth: 1
      }
    ]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <Text style={[styly.klavesaText, { color: barvy.textHlavni, fontSize: 32 * m }]}>
      {cislo}
    </Text>
  </TouchableOpacity>
);

const styly = StyleSheet.create({
  kontejner: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 120
  },
  nadpisKontejner: { alignItems: "center", marginBottom: 24 },
  nadpis: { fontWeight: "700", marginBottom: 4 },
  podnadpis: {},
  displejKontejner: {
    borderRadius: 20,
    padding: 32,
    alignItems: "center",
    marginBottom: 24
  },
  linkaText: {
    fontWeight: "700",
    letterSpacing: 16,
    textAlign: "center",
    minWidth: 200
  },
  teckyKontejner: {
    flexDirection: "row",
    gap: 16,
    marginTop: 16,
    marginBottom: 20
  },
  tecka: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2
  },
  cisloText: { fontWeight: "500" },
  zobrazitCisloTlacitko: { paddingVertical: 4 },
  zobrazitCisloText: { fontWeight: "500" },
  klavesniceKontejner: { marginBottom: 24 },
  klavesniceRadek: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12
  },
  klavesa: {
    width: "31%",
    aspectRatio: 1.6,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center"
  },
  klavesaSpec: {},
  klavesaText: { fontWeight: "500" },
  tlacitkoHovor: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3
  },
  tlacitkoHovorText: {
    color: "#FFFFFF",
    fontWeight: "600",
    marginLeft: 12
  }
});

export default RychleVytaceni;
