// Defaultní kontaktní data pro případ nedostupnosti internetu
// při prvním spuštění aplikace. Pole kontaktů je prázdné – reálná data
// se stáhnou z https://www.pupen.org/apps/kontakty.json při první synchronizaci.
// Projekt Studentského spolku Pupen, z.s.
export const DEFAULT_CONTACTS = {
  version: 0,
  lastUpdated: new Date(0).toISOString(),
  contacts: []
};

// URL adresa pro stahování aktuálních kontaktů (spravuje Studentský spolek Pupen, z.s.)
export const CONTACTS_URL = "https://www.pupen.org/apps/kontakty.json";

// Prefix pro vytváření telefonního čísla z 4místné linky
export const TELEFONNI_PREFIX = "+42022438";
