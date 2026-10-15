// Služba pro export do telefonních kontaktů a sdílení kontaktů (vCard + Share)
// #14 Export do kontaktů telefonu
// #15 Sdílet kontakt přes systémové menu

let ExContacts = null;
let ExSharing = null;
let ExFileSystem = null;
let ExShare = null; // react-native Share API (defaultní)
let nacteno = false;

/**
 * Lazy load knihoven
 */
const nactiZavislosti = () => {
  if (nacteno) return;
  try {
    ExContacts = require("expo-contacts");
  } catch (e) { ExContacts = null; }
  try {
    ExSharing = require("expo-sharing");
  } catch (e) { ExSharing = null; }
  try {
    ExFileSystem = require("expo-file-system");
  } catch (e) { ExFileSystem = null; }
  try {
    const RN = require("react-native");
    ExShare = RN.Share;
  } catch (e) { ExShare = null; }
  nacteno = true;
};

/**
 * Vrátí kompletní telefonní číslo z kontaktu:
 * - pokud má kontakt vlastní telefon, použije se
 * - jinak se číslo složí z linky (prefix + 4 čísla)
 */
const ziskejTelefon = (kontakt) => {
  const { TELEFONNI_PREFIX } = require("../data/defaultContacts");
  if (!kontakt) return "";
  // Pokud uživatel má uložené celé číslo – použijeme ho
  if (kontakt.telefon && String(kontakt.telefon).length > 6) return String(kontakt.telefon);
  if (kontakt.cislo && kontakt.cislo.length > 6) return kontakt.cislo;
  // Jinak z linky
  if (kontakt.linka && /^\d{4}$/.test(kontakt.linka)) {
    return `${TELEFONNI_PREFIX}${kontakt.linka}`;
  }
  return kontakt.linka || "";
};

/**
 * Sestaví textovou reprezentaci kontaktu pro sdílení
 * (použije se pokud není k dispozici Share API nebo jako fallback)
 */
export const sestavTextKontaktu = (kontakt) => {
  if (!kontakt) return "";
  const telefon = ziskejTelefon(kontakt);
  const radky = [];
  if (kontakt.jmeno) radky.push(`👤 ${kontakt.jmeno}`);
  if (kontakt.oddeleni) radky.push(`🏛️ ${kontakt.oddeleni}`);
  if (kontakt.fakulta && kontakt.fakulta !== kontakt.oddeleni) {
    radky.push(`📚 ${kontakt.fakulta}`);
  }
  if (kontakt.budova) {
    const mistnost = kontakt.mistnost ? ` · ${kontakt.mistnost}` : "";
    radky.push(`📍 ${kontakt.budova}${mistnost}`);
  }
  if (kontakt.linka) radky.push(`☎️ Linka: ${kontakt.linka}`);
  if (telefon) radky.push(`📞 ${telefon}`);
  if (kontakt.email) radky.push(`✉️ ${kontakt.email}`);
  radky.push("");
  radky.push("– Sdíleno z aplikace Linka (Pupen, z.s.)");
  return radky.join("\n");
};

/**
 * Sestaví vCard 3.0 řetězec pro kontakt
 * Obsahuje FN (formatted name), TEL, EMAIL, ORG, TITLE, NOTE
 * včetně titulků a celého jména (jak požadováno ve #15)
 */
export const sestavVCard = (kontakt) => {
  if (!kontakt) return "";
  const telefon = ziskejTelefon(kontakt);

  // Rozložíme formátované jméno na jednotlivé části (pokud lze)
  const fn = kontakt.jmeno || "Neznámý";
  // Pokusíme se rozdělit na příjmení / jméno pro N: pole
  let nPole = ";";
  try {
    const bezTitulu = fn.replace(/^(Ing\.|Doc\.|Prof\.|RNDr\.|MVDr\.|Mgr\.|Bc\.|DiS\.|Ph\.D\.|DrSc\.|CSc\.)\s*/gi, "").trim();
    const casti = bezTitulu.split(/\s+/).filter(Boolean);
    if (casti.length >= 2) {
      const prijmeni = casti[casti.length - 1];
      const jmeno = casti.slice(0, -1).join(" ");
      nPole = `${prijmeni};${jmeno};;;`;
    } else if (casti.length === 1) {
      nPole = `${casti[0]};;;;`;
    }
  } catch (e) { /* neúspěch => necháme ;;;;; */ }

  const radky = [];
  radky.push("BEGIN:VCARD");
  radky.push("VERSION:3.0");
  radky.push(`N:${nPole}`);
  radky.push(`FN:${fn}`); // Celé jméno včetně titulů
  if (kontakt.oddeleni || kontakt.fakulta) {
    const org = [kontakt.fakulta, kontakt.oddeleni].filter(Boolean).join(";");
    radky.push(`ORG:${org}`);
  }
  if (kontakt.linka) radky.push(`TITLE:Linka: ${kontakt.linka}`);
  if (telefon) radky.push(`TEL;TYPE=WORK,VOICE:${telefon}`);
  if (kontakt.email) radky.push(`EMAIL;TYPE=WORK,INTERNET:${kontakt.email}`);
  if (kontakt.budova || kontakt.mistnost) {
    const adresa = [
      "",
      "",
      `${kontakt.budova || ""}${kontakt.mistnost ? " - " + kontakt.mistnost : ""}`,
      "", "", "", ""
    ].join(";");
    radky.push(`ADR;TYPE=WORK:${adresa}`);
  }
  radky.push("NOTE:Aplikace Linka – projekt Studentského spolku Pupen, z.s.");
  radky.push("END:VCARD");
  return radky.join("\r\n") + "\r\n";
};

/**
 * #15 Sdílet kontakt přes systémové sdílení
 * Nejprve se pokusí sdílet jako vCard soubor (pokud je to možné)
 * Jako fallback použije Share s textovou podobou
 */
export const sdiletKontakt = async (kontakt) => {
  nactiZavislosti();
  if (!kontakt) return { uspech: false, duvod: "Prázdný kontakt" };

  // Cesta 1: ExSharing + FileSystem = sdílet jako .vcf soubor
  try {
    if (ExSharing && ExFileSystem && ExFileSystem.cacheDirectory) {
      const vcard = sestavVCard(kontakt);
      const bezpecnyNazev = (kontakt.jmeno || "kontakt")
        .replace(/[^a-zA-ZÁČĎÉĚÍŇÓŘŠŤÚŮÝŽáčďéěíňóřšťúůýž0-9_-]/g, "_")
        .substring(0, 40);
      const cesta = ExFileSystem.cacheDirectory + `${bezpecnyNazev}.vcf`;
      await ExFileSystem.writeAsStringAsync(cesta, vcard, {
        encoding: ExFileSystem.EncodingType.UTF8
      });

      const muzemeSdilet = await ExSharing.isAvailableAsync();
      if (muzemeSdilet) {
        await ExSharing.shareAsync(cesta, {
          mimeType: "text/vcard",
          dialogTitle: `Sdílet kontakt: ${kontakt.jmeno || ""}`,
          UTI: "public.vcard" // iOS
        });
        return { uspech: true, metoda: "vcard-soubor" };
      }
    }
  } catch (e) {
    console.warn("Sdílení vCard selhalo:", e.message);
  }

  // Cesta 2: Sdílet jako text přes React Native Share (funguje skoro všude)
  try {
    if (ExShare) {
      const text = sestavTextKontaktu(kontakt);
      const vysledek = await ExShare.share({
        message: text,
        title: kontakt.jmeno ? `Kontakt: ${kontakt.jmeno}` : "Sdílet kontakt"
      }, {
        dialogTitle: "Sdílet kontakt",
        subject: kontakt.jmeno ? `Kontakt: ${kontakt.jmeno}` : "Kontakt"
      });
      if (vysledek.action === ExShare.sharedAction) {
        return { uspech: true, metoda: "text-share" };
      }
    }
  } catch (e) {
    console.warn("Sdílení textu selhalo:", e.message);
  }

  return { uspech: false, duvod: "Žádná metoda sdílení není dostupná" };
};

/**
 * #14 Uložit kontakt do adresáře telefonu přes expo-contacts
 * Požádá o oprávnění, pokud ještě nebylo uděleno
 */
export const ulozitDoTelefonu = async (kontakt) => {
  nactiZavislosti();
  if (!kontakt) return { uspech: false, zprava: "Prázdný kontakt" };

  if (!ExContacts || !ExContacts.requestPermissionsAsync) {
    return {
      uspech: false,
      zprava: "Toto zařízení nepodporuje ukládání kontaktů (Web / simulátor?)"
    };
  }

  try {
    // 1. Požádat o oprávnění
    const { status } = await ExContacts.requestPermissionsAsync();
    if (status !== "granted") {
      return {
        uspech: false,
        zprava: "Bez oprávnění k přístupu ke kontaktům nelze uložit.",
        potrebujeOpravneni: true
      };
    }

    // 2. Příprava kontaktních dat
    const telefon = ziskejTelefon(kontakt);

    // Složíme organizaci + oddělení
    let company = kontakt.fakulta || "Studentský spolek Pupen, z.s.";
    if (kontakt.oddeleni && kontakt.oddeleni !== kontakt.fakulta) {
      company = `${kontakt.fakulta || ""} – ${kontakt.oddeleni}`.replace(/^ – /, "");
    }

    const kontaktProUlozeni = {
      [ExContacts.Fields.FirstName]: "",
      [ExContacts.Fields.LastName]: kontakt.jmeno || "Neznámý",
      [ExContacts.Fields.Name]: kontakt.jmeno || "Neznámý",
      [ExContacts.Fields.Company]: company,
      [ExContacts.Fields.JobTitle]: kontakt.linka ? `Linka: ${kontakt.linka}` : "",
      [ExContacts.Fields.PhoneNumbers]: telefon ? [
        {
          number: telefon,
          isPrimary: true,
          numberType: ExContacts.PhoneNumberTypes.WORK,
          label: "Práce"
        }
      ] : [],
      [ExContacts.Fields.Emails]: kontakt.email ? [
        {
          email: kontakt.email,
          isPrimary: true,
          emailType: ExContacts.EmailTypes.WORK,
          label: "Práce"
        }
      ] : [],
      [ExContacts.Fields.Addresses]: (kontakt.budova || kontakt.mistnost) ? [
        {
          street: [kontakt.budova, kontakt.mistnost].filter(Boolean).join(" / "),
          city: "",
          postalCode: "",
          country: "Česká republika",
          label: "Práce",
          addressType: ExContacts.AddressTypes.WORK
        }
      ] : [],
      [ExContacts.Fields.Note]: `Aplikace Linka od Pupenu · ${kontakt.linka ? "linka " + kontakt.linka : ""}`
    };

    // 3. Uložit
    const idNovy = await ExContacts.addContactAsync(kontaktProUlozeni);
    return {
      uspech: true,
      zprava: `Kontakt „${kontakt.jmeno}“ byl uložen do telefonu.`,
      id: idNovy
    };
  } catch (chyba) {
    console.error("Uložení kontaktu selhalo:", chyba);
    return {
      uspech: false,
      zprava: `Chyba při ukládání: ${chyba.message}`
    };
  }
};
