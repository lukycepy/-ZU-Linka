# Co nahrát na pupen.org – návod (ELI5)

Tenhle balíček obsahuje vše, co je potřeba udělat, aby aplikace **Linka** fungovala naostro:
aby se dala stáhnout a aby fungovalo odesílání formuláře **Podpora** přímo z aplikace.

Jsou tu **dvě různé věci**, které se dělají na dvou různých místech. Nezaměňte je:

| Složka v balíčku | Kam patří | Co to je |
|---|---|---|
| `do-nextjs/` | do zdrojáků webu (`pupen 4.0`) | kód endpointu pro e-maily |
| `na-vps/` | na server do `/var/www/pupen.org/apps/linka/` | veřejné soubory ke stažení aplikace |

**Stav na produkci:** Část A (e-maily) je **už nasazená a funkční** – ověřeno.
Zbývá dokončit Část B a C (stránka ke stažení a nahrání APK).

---

## DŮLEŽITÉ: co NIKDY nenahrávat

**Soubor `odesli-mail.php` na server nepatří. Nikdy ho tam nedávejte.**

Web pupen.org běží na **Next.js** a na serveru **není spuštěné PHP**. Soubor
`.php` by se tedy nikdy nevykonal jako program.

Aplikace sice volá adresu `/apps/odesli-mail.php`, ale ve skutečnosti ji
obsluhuje soubor `route.ts` uvnitř Next.js (viz Část A). Je to jen název
adresy, žádné PHP za tím není. Kdybyste tam PHP soubor nahráli, jen by na
serveru zbytečně leželo heslo ke schránce.

---

## Část A – odesílání e-mailů z aplikace  ✅ HOTOVO

Aplikace posílá formulář **Podpora** na adresu
`https://www.pupen.org/apps/odesli-mail.php`. Tato adresa je na produkci
**už nasazená a funkční** – nic tam dělat nemusíte. Tato část je tu jen proto,
abyste věděli, jak to funguje a jak si to můžete ověřit.

Jak to na serveru funguje:

1. V Nginxu je pravidlo `location = /apps/odesli-mail.php`, které požadavek
   pošle do Next.js.
2. V projektu webu je soubor `app/apps/odesli-mail.php/route.ts`, který zprávu
   přijme a přepošle e-mailem.
3. Odesílání používá **stejné SMTP nastavení jako web** (bere se z administrace),
   takže v kódu ani v gitu není žádné heslo.

Soubor `route.ts` do projektu vkládat nemusíte – už tam je:

```
do-nextjs/app/apps/odesli-mail.php/route.ts   ->   pupen 4.0/app/apps/odesli-mail.php/route.ts
```

### Ověření

```bash
curl -s -o /dev/null -w "%{http_code}\n" -X OPTIONS https://www.pupen.org/apps/odesli-mail.php
```

Musí vypsat `204`. Kdyby vypsalo `405`, chybí v Nginxu pravidlo pro tuto
adresu. Vložte do server bloku pro `pupen.org` tento blok a načtěte Nginx
znovu (`sudo nginx -t && sudo systemctl reload nginx`):

```nginx
location = /apps/odesli-mail.php {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_read_timeout 60;
}
```

Funkčnost si pak vyzkoušejte přímo v aplikaci v záložce **Podpora**.

---

## Část B – stránka ke stažení a soubory aplikace

**Toto je jediná část, kterou ještě musíte udělat** (spolu s nahráním APK v Části C).

### B1. Přidejte do Nginxu pravidlo pro `/apps/linka/`

Nginx na tomto serveru posílá **všechny** adresy začínající `/apps/` do
Next.js. Ten o stránce ke stažení nic neví, a proto adresa vrací chybu 404.
Řekneme tedy Nginxu, že `/apps/linka/` má obsluhovat sám z disku.

Otevřete konfigurační soubor, kde je server blok pro `pupen.org`. Na tomto
serveru se jmenuje `WorkingON`:

```bash
sudo nano /etc/nginx/sites-available/WorkingON
```

(Pokud by cesta neseděla, najdete ji přes
`nginx -T 2>/dev/null | grep "configuration file"`.)

a **před** řádek `location / {` vložte tento blok:

```nginx
# Stránka ke stažení aplikace Linka + APK (statické soubory, mimo Next.js)
location = /apps/linka {
    return 301 /apps/linka/;
}

location ^~ /apps/linka/ {
    alias /var/www/pupen.org/apps/linka/;
    index index.html;
}
```

První pravidlo zajistí, že i adresa bez lomítka na konci funguje.
Druhé pravidlo obsluhuje samotné soubory.

Pak konfiguraci zkontrolujte a načtěte:

```bash
sudo nginx -t && sudo systemctl reload nginx
```

Když `nginx -t` vypíše `syntax is ok` a `test is successful`, je to správně.

### B2. Vytvořte složku

```bash
sudo mkdir -p /var/www/pupen.org/apps/linka
sudo chown -R www-data:www-data /var/www/pupen.org/apps
sudo chmod 755 /var/www/pupen.org/apps /var/www/pupen.org/apps/linka
```

### B3. Nahrajte soubory

Obsah složky `na-vps/linka/` z tohoto balíčku zkopírujte na server:

```bash
scp na-vps/linka/* root@<adresa-serveru>:/var/www/pupen.org/apps/linka/
```

Výsledek na serveru:

```
/var/www/pupen.org/apps/linka/index.html      <- stránka ke stažení
/var/www/pupen.org/apps/linka/verze.json      <- informace o verzi
/var/www/pupen.org/apps/linka/linka.apk       <- samotná aplikace (viz Část C)
```

Tyto soubory Nginx servíruje přímo, takže jsou dostupné i při zapnuté odstávce
webu. To je záměr – aplikace musí být ke stažení vždy.

---

## Část C – stažení a nahrání APK

Soubor APK je velký přibližně 60 MB, proto není součástí tohoto balíčku.
Stáhněte ho z EAS:

```powershell
npx eas-cli build:download --build-id <ID_BUILDU> --non-interactive
```

Stažený soubor přejmenujte na `linka.apk` a nahrajte na server jako:

```
/var/www/pupen.org/apps/linka/linka.apk
```

**Pozor:** název musí být přesně `linka.apk`, protože na něj odkazuje tlačítko
na stránce i QR kód.

### Až vyjde nová verze aplikace

1. V `app.json` zvyšte `version` a `android.versionCode`.
2. Postavte nové APK: `npx eas-cli build --platform android --profile apk`.
3. Nahraďte soubor na serveru novým `linka.apk`.
4. Přepište číslo ve `verze.json` (pole `verze` a `versionCode`).
5. Aktualizujte číslo verze v `index.html` a v seznamu změn.

Aplikace si nové verze všimne sama a nabídne stažení.

---

## Část D – jak ověřit, že to funguje

Postupně otevřete tyto adresy v prohlížeči:

| Adresa | Co má ukázat |
|---|---|
| `https://www.pupen.org/apps/linka/` | stránka s tlačítkem „Stáhnout aplikaci (APK)“ |
| `https://www.pupen.org/apps/linka/verze.json` | text s verzí `1.3.1` |
| `https://www.pupen.org/apps/linka/linka.apk` | stahování souboru |
| `https://www.pupen.org/apps/kontakty.json` | seznam kontaktů |

U poslední adresy pozor – když vrátí prázdný seznam kontaktů, znamená to, že
v administraci webu ještě nejsou vyplněné kontakty (viz níže).

Funkčnost odesílání pak vyzkoušejte přímo v aplikaci: otevřete záložku
**Podpora**, vyplňte formulář a odešlete. E-mail musí dorazit na
`tech@pupen.org`.

---

## Kontakty se přes tento balíček NEnahrávají

Soubor `kontakty.json` neřešte ručně. Web už má hotovou vlastní administraci
kontaktů:

- Adresa: `pupen.org/cs/admin` → záložka **Aplikace Linka**
- Web si data zapisuje sám do `/var/www/pupen.org/public/apps/kontakty.json`
- Načítá je aplikace z `https://www.pupen.org/apps/kontakty.json`

Ruční nahrávání souboru by tuto administraci přepsalo.

Kontakty v administraci vyplňte **před** spuštěním aplikace do provozu –
dokud jsou prázdné, aplikace nemá co zobrazit.

### Na co si dát pozor při plnění kontaktů

- Sloupec **Klapka** musí mít přesně 4 číslice (např. `1777`). Aplikace si
  z nich sama vytvoří celé číslo.
- Sloupec **Telefon** je nepovinný. Když ho vyplníte, aplikace u kontaktu
  nabídne volbu – volat na linku, nebo na telefon.
- Kontakt bez telefonního spojení se v aplikaci vůbec nezobrazí.
- Duplicitní linky administrace odmítne.
- Import toleruje i klíč **`linka`** (starší pojmenování) – převede se
  automaticky na `klapka`.

---

## Rychlý souhrn

1. Do Nginxu přidat blok pro `/apps/linka/` (Část B1) → `nginx -t` → reload.
2. Vytvořit složku `/var/www/pupen.org/apps/linka/` (Část B2).
3. Nahrát obsah `na-vps/linka/` do té složky (Část B3).
4. Stáhnout APK z EAS → nahrát jako `linka.apk` (Část C).
5. Vyplnit kontakty v administraci webu.
6. Ověřit podle Části D.
