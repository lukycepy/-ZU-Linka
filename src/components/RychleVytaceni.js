import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Keyboard,
  Alert,
  useWindowDimensions
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
  const { height } = useWindowDimensions();
  const [linka, setLinka] = useState("");
  const [zobrazitCislo, setZobrazitCislo] = useState(false);
  const inputRef = useRef(null);
  const haptika = nastaveni.haptikaZapnuta;
  // Na nižších telefonech stáhneme mezery a velikosti, aby se hlavní obrazovka
  // vešla bez nutnosti posouvání.
  const jeKompaktniVyska = height <= 820;

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
    <View
      style={[
        styly.kontejner,
        jeKompaktniVyska && styly.kontejnerKompaktni,
        { backgroundColor: barvy.pozadi }
      ]}
    >
      <View style={[styly.nadpisKontejner, jeKompaktniVyska && styly.nadpisKontejnerKompaktni]}>
        <Text
          style={[
            styly.nadpis,
            { color: barvy.textHlavni, fontSize: (jeKompaktniVyska ? 20 : 24) * m }
          ]}
        >
          Rychlé vytáčení
        </Text>
        <Text
          style={[
            styly.podnadpis,
            { color: barvy.textVedlejsi, fontSize: (jeKompaktniVyska ? 13 : 15) * m }
          ]}
        >
          Zadejte 4místnou linku
        </Text>
      </View>

      <View
        style={[
          styly.displejKontejner,
          jeKompaktniVyska && styly.displejKontejnerKompaktni,
          {
            backgroundColor: barvy.pozadiKarty,
            borderColor: barvy.ohraniceni,
            borderWidth: 2
          }
        ]}
      >
        <TextInput
          ref={inputRef}
          style={[
            styly.linkaText,
            jeKompaktniVyska && styly.linkaTextKompaktni,
            { color: barvy.textAkcent, fontSize: (jeKompaktniVyska ? 46 : 56) * m }
          ]}
          value={linka}
          onChangeText={setLinka}
          keyboardType="numeric"
          maxLength={4}
          placeholder="• • • •"
          placeholderTextColor={barvy.textPotrebny}
          caretHidden={true}
        />
        <View style={[styly.teckyKontejner, jeKompaktniVyska && styly.teckyKontejnerKompaktni]}>
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

      <View style={[styly.klavesniceKontejner, jeKompaktniVyska && styly.klavesniceKontejnerKompaktni]}>
        <View style={[styly.klavesniceRadek, jeKompaktniVyska && styly.klavesniceRadekKompaktni]}>
          {[1, 2, 3].map((cislo) => (
            <KlavesoveTlacitko
              key={cislo}
              cislo={cislo}
              onPress={() => pridejCislici(String(cislo))}
              barvy={barvy}
              m={m}
              jeKompaktniVyska={jeKompaktniVyska}
            />
          ))}
        </View>
        <View style={[styly.klavesniceRadek, jeKompaktniVyska && styly.klavesniceRadekKompaktni]}>
          {[4, 5, 6].map((cislo) => (
            <KlavesoveTlacitko
              key={cislo}
              cislo={cislo}
              onPress={() => pridejCislici(String(cislo))}
              barvy={barvy}
              m={m}
              jeKompaktniVyska={jeKompaktniVyska}
            />
          ))}
        </View>
        <View style={[styly.klavesniceRadek, jeKompaktniVyska && styly.klavesniceRadekKompaktni]}>
          {[7, 8, 9].map((cislo) => (
            <KlavesoveTlacitko
              key={cislo}
              cislo={cislo}
              onPress={() => pridejCislici(String(cislo))}
              barvy={barvy}
              m={m}
              jeKompaktniVyska={jeKompaktniVyska}
            />
          ))}
        </View>
        <View style={[styly.klavesniceRadek, jeKompaktniVyska && styly.klavesniceRadekKompaktni]}>
          <TouchableOpacity
            style={[
              styly.klavesa,
              jeKompaktniVyska && styly.klavesaKompaktni,
              styly.klavesaSpec,
              { backgroundColor: barvy.klavesniceKladivoSpec, borderColor: barvy.ohraniceni, borderWidth: 2 }
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
            jeKompaktniVyska={jeKompaktniVyska}
          />

          <TouchableOpacity
            style={[
              styly.klavesa,
              jeKompaktniVyska && styly.klavesaKompaktni,
              styly.klavesaSpec,
              { backgroundColor: barvy.klavesniceKladivoSpec, borderColor: barvy.ohraniceni, borderWidth: 2 }
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
          jeKompaktniVyska && styly.tlacitkoHovorKompaktni,
          {
            backgroundColor: jePlatnaLinka(linka) ? barvy.akcent : barvy.textPotrebny,
            borderColor: jePlatnaLinka(linka) ? barvy.akcent : barvy.textPotrebny,
            borderWidth: 2
          }
        ]}
        onPress={provedHovor}
        activeOpacity={0.8}
        disabled={!jePlatnaLinka(linka)}
      >
        <MaterialCommunityIcons
          name="phone"
          size={(jeKompaktniVyska ? 28 : 32) * m}
          color="#FFFFFF"
        />
        <Text
          style={[
            styly.tlacitkoHovorText,
            { fontSize: (jeKompaktniVyska ? 16 : 18) * m }
          ]}
        >
          Zavolat na linku {linka || "• • • •"}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const KlavesoveTlacitko = ({ cislo, onPress, barvy, m, jeKompaktniVyska }) => (
  <TouchableOpacity
    style={[
      styly.klavesa,
      jeKompaktniVyska && styly.klavesaKompaktni,
      {
        backgroundColor: barvy.klavesniceKladivo,
        borderColor: barvy.ohraniceni,
        borderWidth: 2
      }
    ]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <Text
      style={[
        styly.klavesaText,
        { color: barvy.textHlavni, fontSize: (jeKompaktniVyska ? 28 : 32) * m }
      ]}
    >
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
  kontejnerKompaktni: {
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 20
  },
  nadpisKontejner: { alignItems: "center", marginBottom: 24 },
  nadpisKontejnerKompaktni: { marginBottom: 16 },
  nadpis: { fontWeight: "700", marginBottom: 4 },
  podnadpis: {},
  displejKontejner: {
    borderRadius: 20,
    padding: 32,
    alignItems: "center",
    marginBottom: 24
  },
  displejKontejnerKompaktni: {
    borderRadius: 18,
    padding: 22,
    marginBottom: 16
  },
  linkaText: {
    fontWeight: "700",
    letterSpacing: 16,
    textAlign: "center",
    minWidth: 200
  },
  linkaTextKompaktni: {
    letterSpacing: 12,
    minWidth: 180
  },
  teckyKontejner: {
    flexDirection: "row",
    gap: 16,
    marginTop: 16,
    marginBottom: 20
  },
  teckyKontejnerKompaktni: {
    gap: 12,
    marginTop: 10,
    marginBottom: 14
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
  klavesniceKontejnerKompaktni: { marginBottom: 16 },
  klavesniceRadek: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12
  },
  klavesniceRadekKompaktni: { marginBottom: 10 },
  klavesa: {
    width: "31%",
    aspectRatio: 1.6,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center"
  },
  klavesaKompaktni: {
    aspectRatio: 1.95,
    borderRadius: 14
  },
  klavesaSpec: {},
  klavesaText: { fontWeight: "500" },
  tlacitkoHovor: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    borderRadius: 16
  },
  tlacitkoHovorKompaktni: {
    paddingVertical: 14,
    borderRadius: 14
  },
  tlacitkoHovorText: {
    color: "#FFFFFF",
    fontWeight: "600",
    marginLeft: 12
  }
});

export default RychleVytaceni;
