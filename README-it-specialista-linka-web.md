# README pro IT specialistu: nasazení Linky na pupen.org

Tento dokument popisuje, jak správně zprovoznit webovou část aplikace Linka od Pupenu na serveru `pupen.org`, aby:

- veřejný JSON endpoint fungoval na `https://pupen.org/apps/kontakty.json`
- kontakty šly upravovat z webové administrace
- endpoint zůstal dostupný i během odstávky hlavního webu
- mobilní aplikace měla stabilní zdroj dat

## 1. Co už je v projektu hotové

Implementace už v kódu existuje. Není potřeba vytvářet nové řešení bokem.

Klíčové soubory ve webovém projektu:

- veřejný endpoint: `/app/apps/kontakty.json/route.ts`
- admin UI: `/app/[lang]/admin/dashboard/components/LinkaTab.tsx`
- admin API: `/app/api/admin/apps/linka/route.ts`
- práce se souborem a atomický zápis: `/lib/apps-linka/storage.ts`
- schéma, validace a CSV import/export: `/lib/apps-linka/types.ts`
- Nginx šablona pro `/apps/`: `/deploy/nginx-pupen-apps.conf.template`

Veřejný endpoint už nyní:

- vrací `Content-Type: application/json; charset=utf-8`
- vrací `Cache-Control: no-cache, must-revalidate`
- vrací `Access-Control-Allow-Origin: *`
- obsluhuje `OPTIONS`
- při chybě nebo neplatném souboru vrací fallback seed data místo HTML chyby

Admin rozhraní už nyní umí:

- načtení kontaktů
- přidání, úpravu, smazání kontaktu
- validaci polí
- import CSV/JSON
- export CSV/JSON
- inkrementaci `version`
- nastavení `lastUpdated`
- náhled veřejného JSON

## 2. Cíl nasazení

Po správném nasazení musí platit:

1. `https://pupen.org/apps/kontakty.json` vrací vždy validní JSON
2. webová administrace umí tento soubor upravovat
3. data jsou fyzicky ukládána do serverové složky mimo build artefakty
4. celá sekce `/apps/` je vyňata z odstávky webu
5. i při maintenance režimu musí `/apps/kontakty.json` vracet HTTP `200`

## 3. Kde mají být data na serveru

Doporučená cílová složka na VPS:

```text
/var/www/pupen.org/apps/
```

Soubor kontaktů:

```text
/var/www/pupen.org/apps/kontakty.json
```

Pokud soubor ještě neexistuje, veřejný endpoint vrátí fallback seed data. Přesto je doporučeno složku `/var/www/pupen.org/apps/` vytvořit předem a nastavit na ni správná práva.

## 4. Environment proměnná

V produkčním prostředí musí být nastavena:

```env
APPS_DATA_DIR=/var/www/pupen.org/apps
```

Bez této proměnné si aplikace bere výchozí lokální cestu `public/apps`, což nechceme používat jako hlavní produkční úložiště.

Po změně `.env` nezapomeňte restartovat běžící Node.js / PM2 proces.

## 5. Práva na soubory a složky

Proces, pod kterým běží Next.js aplikace, musí mít právo:

- číst ze složky `/var/www/pupen.org/apps`
- zapisovat do složky `/var/www/pupen.org/apps`
- přejmenovat dočasný soubor na `kontakty.json`

To je důležité, protože zápis probíhá atomicky:

1. vytvoření dočasného souboru
2. zápis JSON
3. rename na finální `kontakty.json`

Doporučený příklad:

```bash
sudo mkdir -p /var/www/pupen.org/apps
sudo chown -R www-data:www-data /var/www/pupen.org/apps
sudo chmod 775 /var/www/pupen.org/apps
```

Pokud aplikace neběží pod `www-data`, upravte vlastníka podle reálného systémového uživatele služby.

## 6. Seed soubor

Volitelné, ale doporučené: vytvořit počáteční soubor:

```json
{
  "version": 1,
  "lastUpdated": "2026-09-29T00:00:00.000Z",
  "contacts": [
    {
      "id": 11,
      "jmeno": "Lukáš Čepelák",
      "oddeleni": "Podpora aplikace Linka",
      "fakulta": "Studentský spolek Pupen, z.s.",
      "budova": "Studentské centrum",
      "mistnost": "Pupen klubovna",
      "klapka": "1777",
      "email": "tech@pupen.org"
    },
    {
      "id": 12,
      "jmeno": "Studentský spolek Pupen, z.s.",
      "oddeleni": "Studentské projekty",
      "fakulta": "Studentský spolek Pupen, z.s.",
      "budova": "Studentské centrum",
      "mistnost": "Pupen klubovna",
      "klapka": "1700",
      "email": "info@pupen.org"
    }
  ]
}
```

Soubor musí být:

- UTF-8 bez BOM
- validní JSON
- zakončený newline je v pořádku

## 7. Nginx: nejdůležitější část

Sekce `/apps/` nesmí být blokována odstávkou webu.

To znamená:

- žádné maintenance pravidlo nesmí vracet `503` pro `/apps/*`
- žádný redirect na `/cs/odstavka` nebo `/{lang}/odstavka` se nesmí vztahovat na `/apps/*`
- `/apps/kontakty.json` musí zůstat veřejně dostupné i při zapnuté odstávce

Použijte šablonu:

```text
/deploy/nginx-pupen-apps.conf.template
```

Klíčové pravidlo:

```nginx
location ^~ /apps/ {
    alias /var/www/pupen.org/apps/;
    try_files $uri $uri/ @nextjs_apps_fallback;
}
```

Speciálně pro `kontakty.json` musí být zachovány hlavičky:

```nginx
add_header Access-Control-Allow-Origin "*" always;
add_header Access-Control-Allow-Methods "GET, OPTIONS" always;
add_header Access-Control-Allow-Headers "Content-Type, Accept" always;
add_header Cache-Control "no-cache, must-revalidate" always;
add_header X-Content-Type-Options "nosniff" always;
```

Pokud používáte maintenance přes podmínku typu:

```nginx
if (-f $document_root/maintenance-on) { return 503; }
```

musí být přepsána tak, aby se na `/apps/` nevztahovala.

Příklad:

```nginx
set $maintenance "";
if (-f $document_root/maintenance-on) { set $maintenance "M"; }
if ($request_uri !~ ^/apps/) { set $maintenance "${maintenance}A"; }
if ($maintenance = MA) { return 503; }
```

## 8. Co se nesmí změnit

Tyto věci jsou kompatibilitně důležité:

- veřejná URL musí zůstat `/apps/kontakty.json`
- JSON klíč musí zůstat `klapka`, i když v UI se používá slovo `linka`
- struktura JSON musí zůstat:
  - `version`
  - `lastUpdated`
  - `contacts[]`
- každá položka kontaktu musí mít:
  - `id`
  - `jmeno`
  - `oddeleni`
  - `fakulta`
  - `budova`
  - `mistnost`
  - `klapka`
  - `email`

Nepřejmenovávat pole ani endpoint.

## 9. Validace dat

Administrace už validuje:

- `jmeno`, `oddeleni`, `fakulta`, `budova`: povinné, max 200 znaků
- `mistnost`: povinné, max 100 znaků
- `klapka`: povinné, přesně 4 číslice
- `email`: povinný, validní e-mail, max 200 znaků
- `id`: unikátní
- `klapka`: unikátní

Při ukládání:

- `version` se zvýší o `+1`
- `lastUpdated` se nastaví na aktuální ISO timestamp
- data se znovu validují proti schématu
- soubor se zapíše atomicky

## 10. Administrace

Kontakty se upravují přes existující administraci webu, ne ručně přepisováním route souboru.

Administrace:

- používá interní API `/api/admin/apps/linka`
- vyžaduje admin autentizaci
- umí import/export
- umí zobrazit cestu k reálnému souboru na serveru
- umí otevřít veřejný náhled JSON

Pokud admin funguje správně, nemá se nic editovat ručně v:

```text
/app/apps/kontakty.json/route.ts
```

Tento soubor je endpoint, ne datové úložiště.

## 11. Doporučený deploy postup

1. Nasadit aktuální verzi webového projektu na VPS
2. vytvořit složku `/var/www/pupen.org/apps`
3. nastavit `APPS_DATA_DIR=/var/www/pupen.org/apps`
4. nastavit práva pro proces aplikace
5. upravit Nginx tak, aby `/apps/` bylo před maintenance pravidly
6. reloadnout Nginx
7. restartovat PM2 / Node.js proces
8. otevřít admin a zkontrolovat načtení dat
9. provést testovací zápis
10. ověřit veřejný endpoint a chování při odstávce

## 12. Ověření po nasazení

### A. Veřejný endpoint

Musí fungovat:

```bash
curl https://pupen.org/apps/kontakty.json
```

Očekávání:

- HTTP `200`
- validní JSON
- pole `version`
- pole `lastUpdated`
- pole `contacts`

### B. CORS a OPTIONS

```bash
curl -I -X OPTIONS https://pupen.org/apps/kontakty.json
```

Očekávání:

- `204` nebo korektní bezobsahová odpověď
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: GET, OPTIONS`

### C. Admin zápis

V administraci:

1. přidat testovací kontakt
2. uložit
3. ověřit zvýšení `version`
4. ověřit změnu `lastUpdated`
5. otevřít náhled JSON
6. ověřit, že se změna propsala do veřejného endpointu

### D. Test odstávky

Při zapnuté odstávce webu musí stále fungovat:

```bash
curl -I https://pupen.org/apps/kontakty.json
curl https://pupen.org/apps/kontakty.json
```

Očekávání:

- ne `503`
- ne HTML maintenance page
- stále JSON a HTTP `200`

## 13. Nejčastější chyby

### `/apps/kontakty.json` vrací 503

Příčina:

- `/apps/` je stále uvnitř maintenance pravidel

Řešení:

- přesunout `location ^~ /apps/` nad maintenance logiku
- upravit podmínku odstávky tak, aby ignorovala `/apps/`

### Admin umí načíst data, ale neumí uložit

Příčina:

- špatná práva do `/var/www/pupen.org/apps`
- chybí `APPS_DATA_DIR`

Řešení:

- zkontrolovat env
- zkontrolovat vlastníka a chmod
- zkontrolovat logy Node.js / PM2

### Endpoint vrací fallback seed data místo produkčních

Příčina:

- soubor `kontakty.json` neexistuje
- nebo je nevalidní JSON
- nebo ho proces neumí přečíst

Řešení:

- ověřit existenci souboru
- ověřit validitu JSON
- ověřit práva ke čtení

### Mobilní aplikace stále čte starou URL

Příčina:

- v mobilní aplikaci ještě není přepnuto na `/apps/kontakty.json`

Řešení:

- v mobilním projektu změnit `CONTACTS_URL` na:

```text
https://pupen.org/apps/kontakty.json
```

## 14. Finální checklist

- [ ] Na serveru existuje `/var/www/pupen.org/apps`
- [ ] Proces aplikace do této složky umí zapisovat
- [ ] Je nastavena proměnná `APPS_DATA_DIR=/var/www/pupen.org/apps`
- [ ] Nginx má `location ^~ /apps/` před maintenance logikou
- [ ] `/apps/kontakty.json` vrací HTTP 200
- [ ] `OPTIONS /apps/kontakty.json` vrací CORS hlavičky
- [ ] Admin umí načíst kontakty
- [ ] Admin umí uložit změnu do souboru
- [ ] `version` se po uložení zvyšuje
- [ ] `lastUpdated` se aktualizuje
- [ ] Během odstávky webu zůstává `/apps/kontakty.json` dostupné

## 15. Shrnutí pro IT specialistu

Nevytvářejte nový systém. Řešení už je součástí webového projektu. Je potřeba správně:

- nasměrovat datový soubor do `/var/www/pupen.org/apps`
- nastavit `APPS_DATA_DIR`
- povolit zápis aplikaci
- vyjmout `/apps/` z odstávky v Nginxu
- po deployi vše otestovat podle checklistu výše

To je celé. Kritická část je opravdu hlavně Nginx a práva k zápisu.
