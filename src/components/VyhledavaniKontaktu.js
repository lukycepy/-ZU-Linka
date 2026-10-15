import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  vyhledejKontakty,
  zavolej,
  formatujCislo,
  vytvorCisloZLinky,
  seskupKontaktyPodlePrijmeni
} from "../services/contactsService";
import { MOZNOSTI_RAZENI } from "../services/settingsService";
import { lehkyImpakt, stredniImpakt, uspech } from "../services/hapticService";
import { sdiletKontakt, ulozitDoTelefonu, ulozitJakoVCard } from "../services/shareService";

/**
 * Komponenta pro fulltextové vyhledávání kontaktů
 * + řazení (#9), filtrování podle fakulty (#10),
 * + sdílet (#15) a export do kontaktů (#14)
 */
const VyhledavaniKontaktu = ({
  kontakty,
  oblibene,
  naPrepnutiOblibeneho,
  barvy,
  velPisma,
  nastaveni,
  naZmenuNastaveni
}) => {
  const m = velPisma;
  const [vyhledavani, setVyhledavani] = useState("");
  const [zobrazitOblibene, setZobrazitOblibene] = useState(false);

  // Zobrazíme podrobnosti (akce export/sdílet) pro konkrétní kontakt
  const [rozbalenyKontaktId, setRozbalenyKontaktId] = useState(null);

  // --- ŘAZENÍ (#9) ---
  const raditPodle = nastaveni.razeniKontaktu || "prijmeni";
  const rucniZmenaRazeni = nastaveni._rucniRad ?? raditPodle;
  const pouzitRadit = rucniZmenaRazeni;

  // --- FILTR FAKULTY (#10) ---
  const vybranaFakulta = nastaveni.vybranaFakulta ?? null;

  // Vytvoříme seznam všech dostupných fakult (unikátní hodnoty)
  const seznamFakult = useMemo(() => {
    const sada = new Set();
    (kontakty || []).forEach((k) => {
      if (k.fakulta && k.fakulta.trim()) sada.add(k.fakulta.trim());
    });
    return Array.from(sada).sort();
  }, [kontakty]);

  const filtrovaneKontakty = useMemo(() => {
    let vysledek = (kontakty || []).slice();

    // 0. Filtr neplatných kontaktů – bez jména nebo bez možnosti volání (linka i telefon) nezobrazit
    vysledek = vysledek.filter((k) => {
      if (!k || !k.jmeno || !String(k.jmeno).trim()) return false;
      const maLinku = k.linka && String(k.linka).trim().length > 0;
      const maTelefon = k.telefon && String(k.telefon).trim().length > 0;
      return maLinku || maTelefon;
    });

    // 1. Filtr oblíbených
    if (zobrazitOblibene) {
      vysledek = vysledek.filter((k) => oblibene.includes(k.id));
    }

    // 2. Filtr fakulty
    if (vybranaFakulta) {
      vysledek = vysledek.filter((k) => k.fakulta === vybranaFakulta);
    }

    // 3. Textový filtr
    vysledek = vyhledejKontakty(vysledek, vyhledavani);

    // 4. Řazení
    const porovnejPrijmeni = (a, b) => {
      const pA = (a.jmeno || "").toLowerCase();
      const pB = (b.jmeno || "").toLowerCase();
      return pA.localeCompare(pB, "cs");
    };

    switch (pouzitRadit) {
      case "fakulta":
        vysledek.sort((a, b) => {
          const fa = (a.fakulta || "").toLowerCase();
          const fb = (b.fakulta || "").toLowerCase();
          return fa !== fb ? fa.localeCompare(fb, "cs") : porovnejPrijmeni(a, b);
        });
        break;
      case "linka":
        vysledek.sort((a, b) => {
          const ka = parseInt(a.linka || "0", 10);
          const kb = parseInt(b.linka || "0", 10);
          return ka - kb;
        });
        break;
      case "oblibene": {
        const jeOb = (id) => (oblibene.includes(id) ? 0 : 1);
        vysledek.sort((a, b) => {
          const s = jeOb(a.id) - jeOb(b.id);
          return s !== 0 ? s : porovnejPrijmeni(a, b);
        });
        break;
      }
      case "prijmeni":
      default:
        vysledek.sort(porovnejPrijmeni);
        break;
    }

    return vysledek;
  }, [
    kontakty,
    vyhledavani,
    zobrazitOblibene,
    oblibene,
    vybranaFakulta,
    pouzitRadit
  ]);

  const seskupeneKontakty = useMemo(() => {
    if (vyhledavani.trim()) return null;
    if (pouzitRadit === "oblibene" ||
        pouzitRadit === "linka" ||
        pouzitRadit === "fakulta") {
      return null; // pro netradiční řazení zobrazíme rovnou seznam bez seskupení
    }
    return seskupKontaktyPodlePrijmeni(filtrovaneKontakty);
  }, [filtrovaneKontakty, vyhledavani, pouzitRadit]);

  const vymazVyhledavani = () => {
    lehkyImpakt(nastaveni.haptikaZapnuta);
    setVyhledavani("");
  };

  // --- HANDLERY PRO #14 a #15 ---
  const handleSdilet = async (kontakt) => {
    stredniImpakt(nastaveni.haptikaZapnuta);
    const vysl = await sdiletKontakt(kontakt);
    if (!vysl.uspech) {
      Alert.alert("Nelze sdílet", vysl.duvod || "Zkuste to prosím později.");
    }
  };

  const handleExport = async (kontakt) => {
    stredniImpakt(nastaveni.haptikaZapnuta);
    const vysl = await ulozitDoTelefonu(kontakt);
    if (vysl.uspech) {
      uspech(nastaveni.haptikaZapnuta);
      Alert.alert("✅ Uloženo", vysl.zprava);
    } else {
      Alert.alert("Uložení nebylo dokončeno", vysl.zprava || "Zkuste to prosím později.");
    }
  };

  const handleUlozitVCard = async (kontakt) => {
    stredniImpakt(nastaveni.haptikaZapnuta);
    const vysl = await ulozitJakoVCard(kontakt);
    if (!vysl.uspech) {
      Alert.alert("Nelze uložit", vysl.duvod || "Zkuste to prosím později.");
    }
  };

  const handlePrepnutiOblibenehoW = (id) => {
    lehkyImpakt(nastaveni.haptikaZapnuta);
    naPrepnutiOblibeneho(id);
  };

  const handleZavolej = (cil) => {
    stredniImpakt(nastaveni.haptikaZapnuta);
    zavolej(cil);
  };

  const vykresliKontakt = ({ item }) => {
    const jeObliben = oblibene.includes(item.id);
    const rozbalen = rozbalenyKontaktId === item.id;
    return (
      <KontaktPolozka
        kontakt={item}
        jeObliben={jeObliben}
        rozbalen={rozbalen}
        naZavolani={() => handleZavolej(item.linka)}
        naZavolaniTelefon={(tel) => handleZavolej(tel)}
        naPrepnutiOblibeneho={() => handlePrepnutiOblibenehoW(item.id)}
        naRozbal={() => {
          lehkyImpakt(nastaveni.haptikaZapnuta);
          setRozbalenyKontaktId(rozbalen ? null : item.id);
        }}
        naSdilet={() => handleSdilet(item)}
        naExport={() => handleExport(item)}
        naUlozitVCard={() => handleUlozitVCard(item)}
        barvy={barvy}
        m={m}
      />
    );
  };

  const vykresliPrazdnyStav = () => (
    <View style={[styly.prazdnyStav, { backgroundColor: barvy.pozadi }]}>
      <MaterialCommunityIcons
        name="account-search"
        size={64}
        color={barvy.textPotrebny}
      />
      <Text style={[styly.prazdnyStavNadpis, { color: barvy.textVedlejsi, fontSize: 18 * m }]}>
        {vyhledavani ? "Žádné výsledky" : "Zatím žádné kontakty"}
      </Text>
      <Text style={[styly.prazdnyStavPopis, { color: barvy.textPotrebny, fontSize: 14 * m }]}>
        {vyhledavani
          ? "Zkuste prosím upravit hledaný výraz nebo filtr fakulty."
          : "Kontakty budou zobrazeny po načtení."}
      </Text>
    </View>
  );

  const vykresliOddelovacSkupiny = (pismeno) => (
    <View key={pismeno} style={styly.oddelovacSkupiny}>
      <Text style={[styly.oddelovacSkupinyText, { color: barvy.textAkcent, fontSize: 14 * m }]}>
        {pismeno}
      </Text>
    </View>
  );

  // === CHIPSY FILTRŮ (#10 FAKULTY + #9 RAZENÍ) ===
  const FiltryChipsy = (
    <View style={{ paddingHorizontal: 16 }}>
      {/* řazení chipsy */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingVertical: 6 }}
      >
        {MOZNOSTI_RAZENI.map((r) => {
          const akt = pouzitRadit === r.id;
          return (
            <Pressable
              key={r.id}
              android_ripple={{ color: barvy.akcentSvetla }}
              style={[
                styly.chip,
                {
                  backgroundColor: akt ? barvy.akcent : barvy.pozadiKarty,
                  borderColor: akt ? barvy.akcent : barvy.ohraniceni
                }
              ]}
              onPress={() => {
                lehkyImpakt(nastaveni.haptikaZapnuta);
                naZmenuNastaveni("_rucniRad", r.id);
              }}
            >
              <MaterialCommunityIcons
                name={r.ikona}
                size={16 * m}
                color={akt ? "#fff" : barvy.textVedlejsi}
              />
              <Text style={[
                styly.chipText,
                { color: akt ? "#fff" : barvy.textHlavni, fontSize: 13 * m }
              ]}>
                {r.nazev}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* fakulty chipsy */}
      {seznamFakult.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingTop: 2, paddingBottom: 6 }}
        >
          <Pressable
            android_ripple={{ color: barvy.akcentSvetla }}
            style={[
              styly.chip,
              styly.chipFac,
              {
                backgroundColor: vybranaFakulta === null ? barvy.akcent : barvy.pozadiKarty,
                borderColor: vybranaFakulta === null ? barvy.akcent : barvy.ohraniceni
              }
            ]}
            onPress={() => {
              lehkyImpakt(nastaveni.haptikaZapnuta);
              naZmenuNastaveni("vybranaFakulta", null);
            }}
          >
            <Text style={[
              styly.chipText,
              { color: vybranaFakulta === null ? "#fff" : barvy.textHlavni, fontSize: 13 * m }
            ]}>
              Vše ({(kontakty || []).length})
            </Text>
          </Pressable>
          {seznamFakult.map((fak) => {
            const pocet = (kontakty || []).filter((k) => k.fakulta === fak).length;
            const akt = vybranaFakulta === fak;
            return (
              <Pressable
                key={fak}
                android_ripple={{ color: barvy.akcentSvetla }}
                style={[
                  styly.chip,
                  styly.chipFac,
                  {
                    backgroundColor: akt ? barvy.akcent : barvy.pozadiKarty,
                    borderColor: akt ? barvy.akcent : barvy.ohraniceni
                  }
                ]}
                onPress={() => {
                  lehkyImpakt(nastaveni.haptikaZapnuta);
                  naZmenuNastaveni("vybranaFakulta", akt ? null : fak);
                }}
              >
                <Text style={[
                  styly.chipText,
                  { color: akt ? "#fff" : barvy.textHlavni, fontSize: 13 * m }
                ]}>
                  {zkratFakultu(fak)} ({pocet})
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </View>
  );

  const SeznamBezSeskupeni = (
    <>
      <VyhledavaciLista
        vyhledavani={vyhledavani}
        naZmenu={(t) => { setVyhledavani(t); }}
        naVymazani={vymazVyhledavani}
        zobrazitOblibene={zobrazitOblibene}
        naPrepniOblibene={() => {
          lehkyImpakt(nastaveni.haptikaZapnuta);
          setZobrazitOblibene(!zobrazitOblibene);
        }}
        pocetOblibenych={oblibene.length}
        barvy={barvy}
        m={m}
      />
      {FiltryChipsy}
      <View style={styly.pocetVysledku}>
        <Text style={[styly.pocetVysledkuText, { color: barvy.textVedlejsi, fontSize: 13 * m }]}>
          {vyhledavani
            ? `Nalezeno ${filtrovaneKontakty.length} výsledků`
            : (vybranaFakulta
                ? `${vybranaFakulta} – ${filtrovaneKontakty.length} kontaktů`
                : `Celkem ${filtrovaneKontakty.length} kontaktů`)}
        </Text>
      </View>
      <FlatList
        data={filtrovaneKontakty}
        renderItem={vykresliKontakt}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={[
          styly.seznamKontaktu,
          filtrovaneKontakty.length === 0 && { flexGrow: 1 }
        ]}
        ListEmptyComponent={vykresliPrazdnyStav}
        showsVerticalScrollIndicator={false}
      />
    </>
  );

  if (!seskupeneKontakty) {
    return <View style={[styly.kontejner, { backgroundColor: barvy.pozadi }]}>{SeznamBezSeskupeni}</View>;
  }

  const sekce = Object.entries(seskupeneKontakty).flatMap(
    ([pismeno, polozky]) => [
      { type: "oddelovac", key: `odd-${pismeno}`, pismeno },
      ...polozky.map((polozka) => ({ type: "kontakt", key: `kont-${polozka.id}`, data: polozka }))
    ]
  );

  return (
    <View style={[styly.kontejner, { backgroundColor: barvy.pozadi }]}>
      <VyhledavaciLista
        vyhledavani={vyhledavani}
        naZmenu={(t) => setVyhledavani(t)}
        naVymazani={vymazVyhledavani}
        zobrazitOblibene={zobrazitOblibene}
        naPrepniOblibene={() => {
          lehkyImpakt(nastaveni.haptikaZapnuta);
          setZobrazitOblibene(!zobrazitOblibene);
        }}
        pocetOblibenych={oblibene.length}
        barvy={barvy}
        m={m}
      />
      {FiltryChipsy}
      <FlatList
        data={sekce}
        renderItem={({ item }) => {
          if (item.type === "oddelovac") {
            return vykresliOddelovacSkupiny(item.pismeno);
          }
          return vykresliKontakt({ item: item.data });
        }}
        keyExtractor={(item) => item.key}
        contentContainerStyle={[
          styly.seznamKontaktu,
          sekce.length === 0 && { flexGrow: 1 }
        ]}
        ListEmptyComponent={vykresliPrazdnyStav}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const zkratFakultu = (fakulta) => {
  if (!fakulta) return "?";
  if (fakulta.length <= 18) return fakulta;
  // Pokusíme se vytvořit zkratku (pokud jsou v názvu slova s velkými počátečními písmeny)
  const match = fakulta.match(/[A-ZÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ]/g);
  if (match && match.length >= 2) return match.join("");
  return fakulta.substring(0, 18) + "…";
};

/**
 * Komponenta vyhledávací lišty
 */
const VyhledavaciLista = ({
  vyhledavani,
  naZmenu,
  naVymazani,
  zobrazitOblibene,
  naPrepniOblibene,
  pocetOblibenych,
  barvy,
  m
}) => (
  <View style={styly.vyhledavaciKontejner}>
    <View style={[
      styly.vyhledavaciPolickoKontejner,
      { backgroundColor: barvy.inputPozadi, borderColor: barvy.inputOhraniceni, borderWidth: 1 }
    ]}>
      <MaterialCommunityIcons
        name="magnify"
        size={22 * m}
        color={barvy.textPotrebny}
        style={styly.vyhledavaciIkona}
      />
      <TextInput
        style={[styly.vyhledavaciPolicko, { color: barvy.textHlavni, fontSize: 15 * m }]}
        placeholder="Hledat jméno, oddělení, linku..."
        placeholderTextColor={barvy.textPotrebny}
        value={vyhledavani}
        onChangeText={naZmenu}
        returnKeyType="search"
        clearButtonMode="never"
        autoCorrect={false}
        autoCapitalize="none"
      />
      {vyhledavani.length > 0 && (
        <TouchableOpacity
          onPress={naVymazani}
          style={styly.vymazatVyhledavaniTlacitko}
          activeOpacity={0.6}
        >
          <MaterialCommunityIcons name="close-circle" size={20} color={barvy.textPotrebny} />
        </TouchableOpacity>
      )}
    </View>
    <TouchableOpacity
      style={[
        styly.oblibeneTlacitko,
        { backgroundColor: zobrazitOblibene ? barvy.hvizda : barvy.pozadiKarty,
          borderColor: zobrazitOblibene ? barvy.hvizda : barvy.ohraniceni,
          borderWidth: 1
        }
      ]}
      onPress={naPrepniOblibene}
      activeOpacity={0.8}
    >
      <MaterialCommunityIcons
        name={zobrazitOblibene ? "star" : "star-outline"}
        size={22 * m}
        color={zobrazitOblibene ? "#FFFFFF" : barvy.textVedlejsi}
      />
      {pocetOblibenych > 0 && (
        <View
          style={[
            styly.pocetOblibenychBadge,
            zobrazitOblibene
              ? { backgroundColor: "#FFFFFF" }
              : { backgroundColor: barvy.chyba }
          ]}
        >
          <Text
            style={[
              styly.pocetOblibenychText,
              zobrazitOblibene ? { color: barvy.hvizda } : { color: "#FFFFFF" }
            ]}
          >
            {pocetOblibenych}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  </View>
);

/**
 * Komponenta jedné položky kontaktu v seznamu
 * S rozbalovatelnými akcemi: Sdílet, Uložit do kontaktů
 */
const KontaktPolozka = ({
  kontakt,
  jeObliben,
  rozbalen,
  naZavolani,
  naZavolaniTelefon,
  naPrepnutiOblibeneho,
  naRozbal,
  naSdilet,
  naExport,
  naUlozitVCard,
  barvy,
  m
}) => {
  const inicialy = ziskejInicialy(kontakt.jmeno);
  // Linka (4místná) → kompletní telefonní číslo
  const cisloZLinky = kontakt.linka ? vytvorCisloZLinky(kontakt.linka) : "";
  // Má kontakt vlastní telefonní číslo? (jiné než linka)
  const maTelefon = !!(kontakt.telefon && String(kontakt.telefon).trim().length > 0);
  const telefonCislo = maTelefon ? String(kontakt.telefon).trim() : "";

  return (
    <View style={[
      styly.kontaktPolozka,
      { backgroundColor: barvy.pozadiKarty, borderColor: barvy.ohraniceniJemne, borderWidth: 1 }
    ]}>
      <TouchableOpacity
        style={{ flexDirection: "row", alignItems: "center", flex: 1 }}
        onPress={naZavolani}
        activeOpacity={0.85}
      >
        {/* Avatar */}
        <View style={[styly.avatar, { backgroundColor: barvy.akcentSvetla }]}>
          <Text style={[styly.avatarText, { color: barvy.textAkcent, fontSize: 16 * m }]}>
            {inicialy}
          </Text>
        </View>

        {/* Info */}
        <View style={styly.kontaktInfo}>
          <Text style={[styly.kontaktJmeno, { color: barvy.textHlavni, fontSize: 15 * m }]} numberOfLines={1}>
            {kontakt.jmeno}
          </Text>
          {kontakt.oddeleni ? (
            <Text style={[styly.kontaktOddeleni, { color: barvy.textVedlejsi, fontSize: 13 * m }]} numberOfLines={1}>
              {kontakt.oddeleni}
            </Text>
          ) : null}
          <View style={styly.kontaktDetailyRadek}>
            {kontakt.budova ? (
              <Text style={[styly.kontaktDetail, { color: barvy.textPotrebny, fontSize: 12 * m }]} numberOfLines={1}>
                <MaterialCommunityIcons name="office-building" size={12} color={barvy.textPotrebny} />
                {" "}{kontakt.budova}{kontakt.mistnost ? " · " + kontakt.mistnost : ""}
              </Text>
            ) : null}
            {kontakt.linka ? (
              <View style={[styly.kontaktLinkaBadge, { backgroundColor: barvy.akcentSvetla }]}>
                <MaterialCommunityIcons
                  name="phone-classic"
                  size={12}
                  color={barvy.akcent}
                />
                <Text style={[styly.kontaktLinkaText, { color: barvy.textAkcent, fontSize: 12 * m }]}>
                  {kontakt.linka}
                </Text>
              </View>
            ) : null}
            {maTelefon ? (
              <View style={[styly.kontaktLinkaBadge, { backgroundColor: barvy.akcentSvetla }]}>
                <MaterialCommunityIcons
                  name="cellphone"
                  size={12}
                  color={barvy.akcent}
                />
                <Text style={[styly.kontaktLinkaText, { color: barvy.textAkcent, fontSize: 12 * m }]}>
                  {formatujCislo(telefonCislo)}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </TouchableOpacity>

      {/* Pravá část – hvězdička, rozbal, ico hovor */}
      <View style={styly.kontaktAkce}>
        <TouchableOpacity
          style={styly.oblibeneIkonaKontejner}
          onPress={(e) => {
            e.stopPropagation();
            naPrepnutiOblibeneho();
          }}
          activeOpacity={0.6}
        >
          <MaterialCommunityIcons
            name={jeObliben ? "star" : "star-outline"}
            size={24 * m}
            color={jeObliben ? barvy.hvizda : barvy.textPotrebny}
          />
        </TouchableOpacity>
        {/* rozbal akci */}
        <TouchableOpacity
          style={styly.rozbalTlacitko}
          onPress={(e) => {
            e.stopPropagation();
            naRozbal();
          }}
          activeOpacity={0.6}
        >
          <MaterialCommunityIcons
            name={rozbalen ? "chevron-up" : "chevron-down"}
            size={20 * m}
            color={barvy.textVedlejsi}
          />
        </TouchableOpacity>
        <View style={[styly.volatTlacitko, { backgroundColor: barvy.akcentSvetla }]}>
          <MaterialCommunityIcons name="phone" size={20 * m} color={barvy.akcent} />
        </View>
      </View>

      {/* Rozbalené akce #14 a #15 */}
      {rozbalen && (
        <View style={[
          styly.akceRozbalene,
          { borderTopColor: barvy.ohraniceniJemne, backgroundColor: barvy.akcentJemna }
        ]}>
          <TouchableOpacity
            style={[styly.akceTlacitko, { borderColor: barvy.ohraniceni }]}
            onPress={naSdilet}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="share-variant-outline" size={18} color={barvy.textAkcent} />
            <Text style={[styly.akceTlacitkoText, { color: barvy.textAkcent, fontSize: 14 * m }]}>
              Sdílet kontakt
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styly.akceTlacitko, { borderColor: barvy.ohraniceni }]}
            onPress={naExport}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="account-plus-outline" size={18} color={barvy.textAkcent} />
            <Text style={[styly.akceTlacitkoText, { color: barvy.textAkcent, fontSize: 14 * m }]}>
              Uložit do telefonu
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styly.akceTlacitko, { borderColor: barvy.ohraniceni }]}
            onPress={naUlozitVCard}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="card-account-details-outline" size={18} color={barvy.textAkcent} />
            <Text style={[styly.akceTlacitkoText, { color: barvy.textAkcent, fontSize: 14 * m }]}>
              Uložit jako vCard
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styly.akceTlacitko, { borderColor: barvy.ohraniceni }]}
            onPress={naZavolani}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="phone" size={18} color={barvy.textAkcent} />
            <Text style={[styly.akceTlacitkoText, { color: barvy.textAkcent, fontSize: 14 * m }]}>
              {kontakt.linka ? `Zavolat na linku ${kontakt.linka}` : "Zavolat"}
            </Text>
          </TouchableOpacity>
          {maTelefon && (
            <TouchableOpacity
              style={[styly.akceTlacitko, { borderColor: barvy.ohraniceni }]}
              onPress={() => naZavolaniTelefon(telefonCislo)}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="cellphone" size={18} color={barvy.textAkcent} />
              <Text style={[styly.akceTlacitkoText, { color: barvy.textAkcent, fontSize: 14 * m }]}>
                Zavolat na telefon {formatujCislo(telefonCislo)}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

const ziskejInicialy = (jmeno) => {
  if (!jmeno) return "?";
  const slova = jmeno
    .replace(/,/g, " ")
    .split(/\s+/)
    .filter((slovo) => slovo && /^[A-ZÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ]/.test(slovo));
  if (slova.length === 0) return jmeno[0]?.toUpperCase() || "?";
  if (slova.length === 1) return slova[0].substring(0, 2).toUpperCase();
  return (slova[0][0] + slova[slova.length - 1][0]).toUpperCase();
};

const styly = StyleSheet.create({
  kontejner: {
    flex: 1
  },
  vyhledavaciKontejner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 8
  },
  vyhledavaciPolickoKontejner: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    shadowOpacity: 0,
    elevation: 0
  },
  vyhledavaciIkona: {
    marginRight: 8
  },
  vyhledavaciPolicko: {
    flex: 1,
    height: 48
  },
  vymazatVyhledavaniTlacitko: {
    padding: 4
  },
  oblibeneTlacitko: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    position: "relative"
  },
  pocetOblibenychBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4
  },
  pocetOblibenychText: {
    fontSize: 10,
    fontWeight: "700"
  },
  pocetVysledku: {
    paddingHorizontal: 16,
    paddingVertical: 6
  },
  seznamKontaktu: {
    paddingHorizontal: 16,
    paddingBottom: 120,
    paddingTop: 8
  },
  oddelovacSkupiny: {
    paddingVertical: 8,
    paddingHorizontal: 4
  },
  oddelovacSkupinyText: {
    fontWeight: "700"
  },
  kontaktPolozka: {
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    shadowOpacity: 0
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    flexShrink: 0
  },
  kontaktInfo: {
    flex: 1,
    marginRight: 8,
    minWidth: 0
  },
  kontaktJmeno: {
    fontWeight: "600",
    marginBottom: 2
  },
  kontaktOddeleni: {
    marginBottom: 4
  },
  kontaktDetailyRadek: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap"
  },
  kontaktDetail: {
    flexShrink: 1
  },
  kontaktLinkaBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 4
  },
  kontaktLinkaText: {
    fontWeight: "600"
  },
  kontaktAkce: {
    alignItems: "flex-end",
    gap: 4,
    flexShrink: 0
  },
  oblibeneIkonaKontejner: {
    padding: 4
  },
  rozbalTlacitko: {
    padding: 4
  },
  volatTlacitko: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center"
  },
  akceRozbalene: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  akceTlacitko: {
    flex: 1,
    minWidth: 140,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 12,
    backgroundColor: "#fff"
  },
  akceTlacitkoText: {
    fontWeight: "600"
  },
  prazdnyStav: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48
  },
  prazdnyStavNadpis: {
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 6
  },
  prazdnyStavPopis: {
    textAlign: "center",
    paddingHorizontal: 24
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    gap: 6
  },
  chipFac: {
    minWidth: 90
  },
  chipText: {
    fontWeight: "600"
  }
});

export default VyhledavaniKontaktu;
