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
├── app.json                        # Expo konfigurace (název, icony, oprávnění)
├── package.json                    # Závislosti a skripty
├── babel.config.js                 # Babel konfigurace pro Expo
├── eas.json                        # EAS Build profily (dev/preview/production)
├── kontakty.json                   # Vzorová datová sada - hostovaná na webu
└── src/
    ├── data/
    │   └── defaultContacts.js      # Default data (pro 1. spuštění offline)
    │
    ├── services/
    │   ├── storageService.js       # Správa AsyncStorage (kontakty, oblíbené)
    │   ├── syncService.js          # Synchronizace na pozadí + verzování
    │   └── contactsService.js      # Vyhledávání, formátování, volání tel://
    │
    └── components/
        ├── RychleVytaceni.js       # Obrazovka s číselnou klávesnicí
        └── VyhledavaniKontaktu.js  # Obrazovka s vyhledáváním + seznam
```

### Klíčové komponenty

| Soubor | Odpovědnost |
|--------|-------------|
| `App.js` | Hlavní state management, navigace mezi záložkami, synchronizace, info modal |
| `RychleVytaceni.js` | 3x4 klávesnice, 4místný vstup, **automatické volání po 4. číslici** |
| `VyhledavaniKontaktu.js` | Fulltextové vyhledávání, seskupení A–Ž, oblíbené, jedno-klik volání |
| `contactsService.js` | ✨ `vytvorCisloZKlapka()` - doplnění prefixu `+42022438` před 4místnou klapku |
| `syncService.js` | 🆕 Verzování: stažení nových dat **pouze při vyšším `version` v JSON** |
| `storageService.js` | 💾 Offline cache v AsyncStorage, oblíbené kontakty |

---

## 📦 Použité závislosti

```json
{
  "expo": "~51.0.0",
  "react": "18.2.0",
  "react-native": "0.74.5",
  "@react-native-async-storage/async-storage": "1.23.1",
  "expo-linking": "~6.3.1",
  "expo-status-bar": "~1.12.1",
  "@expo/vector-icons": "^14.0.2",
  "react-native-web": "~0.19.10"
}
```

---

## 🗂️ Schéma JSON souboru

URL: `https://pupen.org/kontakty.json`

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
      "klapka": "2001",         // 📞 4 čísla - doplní se na +420224382001
      "email": "jan.novak@fapp.czu.cz"
    }
  ]
}
```

⚠️ **Pravidla pro aktualizaci JSON:**
- Pokaždé zvýšete `version` o +1 (int)
- `lastUpdated` nastavte na aktuální čas
- `klapka` musí být **přesně 4 číslice** jako string
- `id` musí být unikátní a neměnná pro daný kontakt
- Vyhledávání pracuje přes všechna textová pole

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

## 🏭 Production build přes EAS Build

### Požadavky
- Účet na [expo.dev](https://expo.dev)
- Nainstalovaný EAS CLI: `npm install -g eas-cli`
- Přihlášení: `eas login`

### 1. Konfigurace projektu

```bash
# Spusť wizard - přidá ProjectId do app.json
eas build:configure
```

### 2. Build Android (AAB pro Google Play / APK pro distribuci)

```bash
# ⚠️ Pro distribuci zákazníkům (APK soubor, který lze rovnou nainstalovat)
npm run build:android   # nebo: eas build -p android --profile preview

# 📦 Pro Google Play Store (.aab bundle)
eas build -p android --profile production
```

### 3. Build iOS (IPA pro App Store / TestFlight)

```bash
# 🍎 IPA pro TestFlight / App Store
npm run build:ios      # nebo: eas build -p ios --profile production
```

### 4. Build obou platform najednou

```bash
npm run build:all
```

🏗️ Build probíhá v **cloudu Expo**, takže nepotřebuješ:
- ❌ Mac pro iOS build
- ❌ Android Studio nainstalované lokálně
- ❌ Xcode

---

## 🔐 Oprávnění a bezpečnost

| Platforma | Přístup k volání | Oprávnění |
|-----------|-----------------|-----------|
| **Android** | `Intent` pro otevření Dialeru | ❌ Žádné speciální oprávnění (nepoužíváme `CALL_PHONE`) |
| **iOS** | `tel://` URL scheme | ✅ Přidáno `LSApplicationQueriesSchemes: ["tel"]` v Info.plist |
| **Web (PWA)** | `tel:` odkaz | Žádné - záleží na prohlížeči |

> **Bezpečnostní rozhodnutí:** Nepoužíváme oprávnění `CALL_PHONE`, které by umožňovalo přímé volání bez uživatelské interakce. Otevíráme pouze **nativní telefonní aplikaci s předvyplněným číslem**, kdy uživatel musí potvrdit zmáčknutím zelené tlačítka. Toto je bezpečnější řešení a nevyžaduje žádná zvláštní oprávnění.

---

## 🔄 Jak aktualizovat JSON na webu

1. Upravte lokální soubor `kontakty.json`:
   - Přidejte/odeberte kontakty
   - ⚠️ **Zvýšte `version`** o +1
   - ⚠️ **Aktualizujte `lastUpdated`** na aktuální ISO datum

2. Nahrajte zpět na server přes FTP/SFTP/scp:
   ```bash
   scp kontakty.json uzivatel@server:/var/www/pupen.org/kontakty.json
   ```

3. V aplikaci klikněte na ikonu ☁️ (cloud sync) v hlavičce, nebo jen restartujte aplikaci.
   - ✅ Aplikace automaticky zjistí vyšší verzi a aktualizuje data
   - ✅ Stará data zůstanou funkční i když server selže

---

## 🧪 Klíčové funkce aplikace

| Funkce | Popis |
|--------|-------|
| ⚡ **Automatické vytáčení** | Po zadání 4 číslic se hovor spustí sám za 300ms |
| 📞 **Prefix +42022438** | Každá 4místná klapka → `+420 224 38X XXX` |
| 🔍 **Fulltext vyhledávání** | Hledá ve všech polích: jméno, oddělení, fakulta, budova, klapka, email |
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
