# Linka od Pupenu 🌱

Aplikace pro rychlé vyhledávání a vytáčení interních telefonních linek. Projekt **Studentského spolku Pupen, z.s.** – data získávána z veřejně dostupných zdrojů.
Vyvinuta pomocí **Expo (React Native)** pro platformy **Android**, **iOS** a **Web (PWA)**.

---

## 🎯 Proč Expo?

| Výhoda | Popis |
|--------|-------|
| **Multiplatformní** | Jeden kód pro Android, iOS i Web (PWA) |
| **Offline podpora** | AsyncStorage + Expo FileSystem pro lokální úložiště |
| **Rychlý vývoj** | Žádná nastavování nativních IDE, okamžitý Hot Reload |
| **Jednoduchý build** | EAS Build - cloudové buildy bez Macu pro iOS |
| **Komunita & moduly** | Tisíce ověřených nativních modulů k dispozici |
| **PWA podpora** | Webová verze může být nainstalována jako aplikace |

---

## 🏗️ Architektura projektu

```
projekt-linka/
├── App.js                          # Hlavní vstupní bod - navigace, stav aplikace
├── app.json                        # Expo konfigurace (název, icony, oprávnění, verze)
├── package.json                    # Závislosti a skripty
├── babel.config.js                 # Babel konfigurace pro Expo
├── eas.json                        # EAS Build profily (development/preview/apk/production)
├── kontakty.json                   # Datová sada kontaktů - hostovaná na pupen.org
├── verze.json                      # Metadata nejnovější verze aplikace (kontrola aktualizací)
├── linka.html                      # Distribuční stránka ke stažení APK (hostovaná na pupen.org)
├── odesli-mail.php                 # Serverový endpoint pro odesílání e-mailů z formuláře
└── src/
    ├── data/
    │   └── defaultContacts.js      # Default data + URL konstanty (kontakty, verze, APK)
    │
    ├── services/
    │   ├── storageService.js       # Správa AsyncStorage (kontakty, oblíbené)
    │   ├── syncService.js          # Synchronizace na pozadí + verzování
    │   ├── updateService.js        # Kontrola dostupných aktualizací aplikace
    │   ├── shareService.js         # Uložení do telefonu / vCard + sdílení kontaktu
    │   ├── emailService.js         # Odesílání formuláře přes odesli-mail.php
    │   └── contactsService.js      # Vyhledávání, formátování, volání (linka / telefon)
    │
    └── components/
        ├── RychleVytaceni.js       # Obrazovka s číselnou klávesnicí
        ├── VyhledavaniKontaktu.js  # Obrazovka s vyhledáváním + seznam
        ├── KontaktniFormular.js    # Formulář podpory
        └── Nastaveni.js            # Nastavení + kontrola aktualizací
```

### Klíčové komponenty

| Soubor | Odpovědnost |
|--------|-------------|
| `App.js` | Hlavní state management, navigace mezi záložkami, synchronizace, kontrola aktualizací |
| `RychleVytaceni.js` | 3x4 klávesnice, 4místný vstup, **automatické volání po 4. číslici** |
| `VyhledavaniKontaktu.js` | Fulltextové vyhledávání, seskupení A–Ž, oblíbené, jedno-klik volání |
| `contactsService.js` | `vytvorCisloZLinky()` - doplnění prefixu `+42022438` před 4místnou linku |
| `syncService.js` | Verzování: stažení nových dat **pouze při vyšším `version` v JSON** |
| `updateService.js` | Kontrola nejnovější verze aplikace přes `verze.json` na pupen.org |
| `shareService.js` | Uložení kontaktu do telefonu, export do vCard, sdílení |
| `storageService.js` | Offline cache v AsyncStorage, oblíbené kontakty |

---

## 📦 Použité závislosti

```json
{
  "expo": "~51.0.0",
  "react": "18.2.0",
  "react-native": "0.74.5",
  "@react-native-async-storage/async-storage": "1.23.1",
  "expo-constants": "~16.0.2",
  "expo-contacts": "~13.0.5",
  "expo-file-system": "~17.0.1",
  "expo-haptics": "~13.0.1",
  "expo-intent-launcher": "~11.0.1",
  "expo-linking": "~6.3.1",
  "expo-sharing": "~12.0.1",
  "expo-status-bar": "~1.12.1",
  "@expo/vector-icons": "^14.0.2",
  "react-native-web": "~0.19.10"
}
```

---

## 🗂️ Schéma JSON souboru

URL: `https://www.pupen.org/apps/kontakty.json`

```jsonc
{
  "version": 4,                 // 🔢 Číslo verze - zvýšit při každé aktualizaci!
  "lastUpdated": "2026-09-29T10:30:00.000Z",  // 📅 ISO 8601 datum
  "description": "Popis datové sady",
  "contacts": [
    {
      "id": 1,                  // Unikátní číslo
      "jmeno": "Ing. Jan Novák, Ph.D.",
      "oddeleni": "Katedra informatiky",
      "fakulta": "Fakulta agrobiologie, potravinových a přírodních zdrojů",
      "budova": "Kampus - Budova A",
      "mistnost": "A-301",
      "linka": "2001",          // 📞 4 čísla - doplní se na +420224382001
      "telefon": "+420224382001", // ☎️ Volitelné - přímé číslo (jiné než linka)
      "email": "jan.novak@fapp.czu.cz"
    }
  ]
}
```

⚠️ **Pravidla pro aktualizaci JSON:**
- Pokaždé zvýšete `version` o +1 (int)
- `lastUpdated` nastavte na aktuální čas
- `linka` musí být **přesně 4 číslice** jako string
- `telefon` je volitelný – pokud je vyplněný, aplikace nabídne volání na linku i na telefon
- `id` musí být unikátní a neměnná pro daný kontakt
- Vyhledávání pracuje přes všechna textová pole
- Kontakty bez `jmeno` nebo bez `linka` i `telefon` se v aplikaci nezobrazí

### Metadata verze aplikace (`verze.json`)

Slouží ke kontrole dostupných aktualizací. Nahrává se na `https://www.pupen.org/apps/linka/verze.json`.

```jsonc
{
  "verze": "1.3.1",           // Textová verze (musí odpovídat app.json)
  "versionCode": 5,           // Číslo verze z app.json – rozhoduje o „novější verzi"
  "datum": "2026-10-15",
  "url": "https://www.pupen.org/apps/linka/linka.apk",
  "zmeny": ["Popis změn v této verzi"]
}
```

---

## 🚀 Spuštění pro vývoj

### Předpoklady
- Node.js 18+ a npm/npx
- Nainstalovaný [Expo Go](https://expo.dev/go) na mobilu (nebo Android Studio / Xcode simulátor)

### Krok za krokem

```bash
# 1. V adresáři projektu nainstaluj závislosti
npm install

# 2. Spusť vývojový server
npx expo start

# 3. V terminálu uvidíš QR kód:
#    - Android: Naskenuj QR kód přes aplikaci Expo Go
#    - iOS: Naskenuj QR kód přes Fotoaparát
#    - Web: Stiskni 'w' pro otevření v prohlížeči
```

### Dostupné skripty

```bash
npm run start        # Spustí Expo vývojový server
npm run android      # Spustí přímo na Android simulátoru
npm run ios          # Spustí přímo na iOS simulátoru (pouze macOS)
npm run web          # Spustí webovou verzi (PWA)
```

---

## 🏭 Sestavení a distribuce APK

Aplikace **není publikována v Google Play ani App Store**. Distribuuje se jako instalační soubor **APK**, který si uživatel stáhne z webu spolku. Díky tomu neplatí omezení obchodů (např. citlivé oprávnění `CALL_PHONE`).

### Požadavky
- Účet na [expo.dev](https://expo.dev)
- Nainstalovaný EAS CLI: `npm install -g eas-cli`
- Přihlášení: `eas login`

### 1. Sestavení APK

```bash
# Produkční APK pro distribuci (profil "apk")
npx eas-cli build --platform android --profile apk

# Rychlý testovací APK (profil "preview")
npx eas-cli build --platform android --profile preview
```

Build probíhá v **cloudu Expo** – nepotřebuješ Android Studio ani Mac.

### 2. Stažení hotového APK

```bash
# Zobraz seznam buildů
npx eas-cli build:list --platform android --limit 1

# Stáhni konkrétní build podle ID
npx eas-cli build:download --build-id <BUILD_ID>
```

### 3. Nahrání na web

Soubory nahraj na server do složky `www.pupen.org/apps/linka/`:

```
apps/
├── kontakty.json      # data kontaktů
├── odesli-mail.php    # endpoint pro e-maily
└── linka/
    ├── index.html     # distribuční stránka (obsah souboru linka.html)
    ├── linka.apk      # nejnovější APK
    └── verze.json     # metadata verze (kontrola aktualizací)
```

### 🔁 Postup při vydání nové verze

1. **Zvyšte verzi** v `app.json`:
   - `expo.version` (např. `1.3.0` → `1.4.0`)
   - `expo.android.versionCode` (např. `4` → `5`) — **musí vždy růst**
   - `expo.ios.buildNumber`
2. **Sestavte APK** – `npx eas-cli build --platform android --profile apk`
3. **Stáhněte APK** a nahraďte `linka.apk` na serveru (název souboru ponechte).
4. **Aktualizujte `verze.json`** na serveru – nová `verze`, `versionCode`, `datum`, `zmeny[]`.
5. **Aktualizujte `linka.html`** (verze + seznam změn) a nahrajte jako `index.html`.

> ⚠️ **Keystore neměňte.** EAS jej spravuje na serveru a při každém buildu použije stejný. Kdyby se změnil, uživatelé by museli aplikaci před aktualizací odinstalovat.

### 🔔 Jak funguje kontrola aktualizací

Aplikace při startu a při otevření *Nastavení → Aktualizace aplikace* stáhne `verze.json` a porovná `versionCode`. Pokud je na serveru vyšší, zobrazí upozornění s tlačítkem **Stáhnout**, které otevře prohlížeč s novým APK. Volbou „Později" se upozornění u dané verze už neopakuje.

---

## 🔐 Oprávnění a bezpečnost

| Platforma | Způsob volání | Oprávnění |
|-----------|---------------|-----------|
| **Android** | `Intent.ACTION_CALL` – hovor se vytočí okamžitě | ✅ `CALL_PHONE` (žádáno za běhu) + `READ_CONTACTS`, `WRITE_CONTACTS` |
| **iOS** | `tel://` URL scheme (otevře aplikaci Telefon) | ✅ `LSApplicationQueriesSchemes: ["tel"]`, `NSContactsUsageDescription` |
| **Web (PWA)** | `tel:` odkaz | Žádné – záleží na prohlížeči |

> **Volání:** Na Androidu aplikace nejprve požádá o oprávnění `CALL_PHONE` a poté hovor vytočí přímo přes `ACTION_CALL`. Pokud oprávnění není uděleno nebo volání selže, automaticky se použije bezpečný fallback – otevře se systémový dialer s předvyplněným číslem. iOS neumožňuje hovor přímo uvnitř aplikace, proto se vždy otevře nativní aplikace Telefon.
>
> **Nižší nároky kvůli APK distribuci:** Protože aplikace není v Google Play, neplatí omezení pro citlivá oprávnění a `CALL_PHONE` je možné používat bez schvalování.

### Ostatní oprávnění

- `READ_CONTACTS` / `WRITE_CONTACTS` – pouze pro funkci „Uložit kontakt do telefonu" (na vyžádání uživatele).
- Aplikace nevyžaduje přístup k poloze, kameře, mikrofonu ani souborům.

---

## 🔄 Jak aktualizovat JSON na webu

1. Upravte lokální soubor `kontakty.json`:
   - Přidejte/odeberte kontakty
   - ⚠️ **Zvýšte `version`** o +1
   - ⚠️ **Aktualizujte `lastUpdated`** na aktuální ISO datum

2. Nahrajte zpět na server přes FTP/SFTP/scp:
   ```bash
   scp kontakty.json uzivatel@server:/var/www/pupen.org/apps/kontakty.json
   ```

3. V aplikaci klikněte na ikonu ☁️ (cloud sync) v hlavičce, nebo jen restartujte aplikaci.
   - ✅ Aplikace automaticky zjistí vyšší verzi a aktualizuje data
   - ✅ Stará data zůstanou funkční i když server selže

---

## 🧪 Klíčové funkce aplikace

| Funkce | Popis |
|--------|-------|
| ⚡ **Automatické vytáčení** | Po zadání 4 číslic se hovor spustí sám za 300ms |
| 📞 **Prefix +42022438** | Každá 4místná linka → `+420 224 38X XXX` |
| 🔍 **Fulltext vyhledávání** | Hledá ve všech polích: jméno, oddělení, fakulta, budova, linka, email |
| 🇨🇿 **Odstranění diakritiky** | Hledání "cv" najde i "ČVUT" |
| 📑 **Seskupení A–Ž** | Bez vyhledávání jsou kontakty seskupené podle příjmení |
| ⭐ **Oblíbené** | Klik na hvězdu přidá mezi oblíbené, filtrování přes ikonu ★ |
| 📴 **Offline prvně** | Okamžité zobrazení lokálních dat, sync na pozadí |
| 🔢 **Verzování** | Data se přepíší **jen při vyšším `version`** - bez zbytečných stažení |
| 🛡️ **Error handling** | Network chyby → použijí se stará data + uživatel je informován |

---

## 🛠️ Tipy pro vývoj

### Test offline režimu
```bash
# V CLI stiskni '?' pro menu → 'm' pro dev menu → Toggle Fast Refresh
# Nebo na Androidu zatřes telefonem / iOS třikrát zmáčkni Shift+Cmd+H
```

### Vymazání lokální cache pro reset
Do konzole / debuggeru zavolejte přes dev menu:
```javascript
import { vymazVsechnaData } from "./src/services/storageService";
await vymazVsechnaData();
```

### Živá data lokálně
- Nastavte si lokální server: `npx serve -l 3000 .`
- Do `src/data/defaultContacts.js` `CONTACTS_URL` dejte `http://10.0.2.2:3000/kontakty.json` (Android Emulator) nebo `http://localhost:3000/kontakty.json` (iOS/Web)

---

## 🧑‍💻 Autor & vývojář

Aplikaci **Linka** vyvinul **Studentský spolek Pupen, z.s.** dobrovolně. Aplikace zpracovává **veřejně dostupné kontaktní údaje** pro rychlé vyhledávání a volání.

| Údaj | Hodnota |
|-------|--------|
| 🌱 Spolek | Studentský spolek Pupen, z.s. |
| 🌐 Web spolku | [https://pupen.org](https://pupen.org) |
| 👨‍💻 Hlavní vývojář & podpora | **Lukáš Čepelák** |
| 📧 Podpora (tech) | [tech@pupen.org](mailto:tech@pupen.org) |
| 📧 Obecná pošta | [info@pupen.org](mailto:info@pupen.org) |

> Aplikaci můžete využívat zcela zadarmo. Pokud chcete přispět, hlásit chyby, chybějící kontakty, navrhnout vylepšení, nebo se zapojit do dalšího vývoje – neváhejte a ozvěte se! Formulář naleznete přímo v záložce **Podpora** v aplikaci.

> ⚠️ **Odmítnutí odpovědnosti:** Aplikace není oficiálním produktem žádné instituce. Veškerá kontaktní data jsou získána z veřejně dostupných zdrojů a jsou poskytována „jak jsou“. Pro aktuálnost a správnost dat není zaručena spolkem Pupen, z.s.

---

## 📝 Podpora

Způsoby řešení problémů:

1.  **Přímo v aplikaci** – záložka **Podpora**
    - Volba typu dotazu: chyba / návrh / chybí kontakt / jiný dotaz
    - Automaticky se připojí informace o Vašem zařízení
    - Otevře Vaši e-mailovou aplikaci s předvyplněným předmětem

2.  **E-mail** – napište na [tech@pupen.org](mailto:tech@pupen.org)
    - Předmět: `[Linka] Váš dotaz`
    - Osobně se stará o podporu Lukáš Čepelák

3.  **Web spolku** – více informací na [pupen.org](https://pupen.org)

---

**© 2026 Studentský spolek Pupen, z.s.** · Vyvinuto s 💚 pomocí Expo · [pupen.org](https://pupen.org)
