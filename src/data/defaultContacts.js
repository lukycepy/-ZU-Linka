// Defaultní kontaktní data pro případ nedostupnosti internetu
// při prvním spuštění aplikace.
// Projekt Studentského spolku Pupen, z.s. – data získána z veřejně dostupných zdrojů.
export const DEFAULT_CONTACTS = {
  version: 1,
  lastUpdated: "2026-09-01T00:00:00.000Z",
  contacts: [
    {
      id: 1,
      jmeno: "Ing. Jan Novák, Ph.D.",
      oddeleni: "Katedra informatiky",
      fakulta: "Fakulta agrobiologie, potravinových a přírodních zdrojů",
      budova: "Kampus - Budova A",
      mistnost: "A-301",
      klapka: "2001",
      email: "jan.novak@fapp.czu.cz"
    },
    {
      id: 2,
      jmeno: "Doc. Ing. Marie Svobodová, Ph.D.",
      oddeleni: "Katedra ekonomie a managementu",
      fakulta: "Fakulta ekonomická a managementu",
      budova: "Kampus - Budova B",
      mistnost: "B-205",
      klapka: "3102",
      email: "marie.svobodova@fem.czu.cz"
    },
    {
      id: 3,
      jmeno: "Prof. Ing. Petr Dvořák, DrSc.",
      oddeleni: "Katedra zemědělské techniky",
      fakulta: "Fakulta technická",
      budova: "Kampus - Budova C",
      mistnost: "C-110",
      klapka: "4203",
      email: "petr.dvorak@ft.czu.cz"
    },
    {
      id: 4,
      jmeno: "RNDr. Lucie Benešová, Ph.D.",
      oddeleni: "Katedra biologie a environmentální studia",
      fakulta: "Fakulta environmentální",
      budova: "Kampus - Budova D",
      mistnost: "D-402",
      klapka: "5304",
      email: "lucie.benesova@fe.czu.cz"
    },
    {
      id: 5,
      jmeno: "Mgr. Tomáš Král",
      oddeleni: "Studijní oddělení - Rejstřík",
      fakulta: "Rektorát",
      budova: "Hlavní budova - Kampus",
      mistnost: "Hlavní vestibul",
      klapka: "1100",
      email: "rejstrik@czu.cz"
    },
    {
      id: 6,
      jmeno: "Ing. Petra Horáková",
      oddeleni: "Katedra lesnických a dřevařských oborů",
      fakulta: "Fakulta lesnická a dřevařská",
      budova: "Kampus - Budova E",
      mistnost: "E-105",
      klapka: "6405",
      email: "petra.horakova@fld.czu.cz"
    },
    {
      id: 7,
      jmeno: "MVDr. Martin Procházka, Ph.D.",
      oddeleni: "Katedra veterinárních věd",
      fakulta: "Fakulta veterinární a farmaceutická",
      budova: "Kampus - Budova F",
      mistnost: "F-308",
      klapka: "7506",
      email: "martin.prochazka@fvf.czu.cz"
    },
    {
      id: 8,
      jmeno: "Studijní oddělení FAPP",
      oddeleni: "Studijní oddělení",
      fakulta: "Fakulta agrobiologie, potravinových a přírodních zdrojů",
      budova: "Kampus - Budova A",
      mistnost: "A-101",
      klapka: "2100",
      email: "studijni.fapp@czu.cz"
    },
    {
      id: 9,
      jmeno: "Technická podpora IT",
      oddeleni: "Informační a komunikační technologie",
      fakulta: "Rektorát - ICT",
      budova: "Kampus - Budova G",
      mistnost: "G-001",
      klapka: "1500",
      email: "support@ict.czu.cz"
    },
    {
      id: 10,
      jmeno: "Ústavní knihovna Kampus",
      oddeleni: "Knihovní služby",
      fakulta: "Veřejná instituce",
      budova: "Knihovna Kampus",
      mistnost: "Přízemí",
      klapka: "1200",
      email: "knihovna@czu.cz"
    },
    {
      id: 11,
      jmeno: "Lukáš Čepelák",
      oddeleni: "Podpora aplikace Linka",
      fakulta: "Studentský spolek Pupen, z.s.",
      budova: "Studentské centrum",
      mistnost: "Pupen klubovna",
      klapka: "1777",
      email: "tech@pupen.org"
    },
    {
      id: 12,
      jmeno: "Studentský spolek Pupen, z.s.",
      oddeleni: "Studentské projekty",
      fakulta: "Studentský spolek Pupen, z.s.",
      budova: "Studentské centrum",
      mistnost: "Pupen klubovna",
      klapka: "1700",
      email: "info@pupen.org"
    }
  ]
};

// URL adresa pro stahování aktuálních kontaktů (spravuje Studentský spolek Pupen, z.s.)
export const CONTACTS_URL = "https://pupen.org/kontakty.json";

// Prefix pro vytváření telefonního čísla z 4místné klapky
export const TELEFONNI_PREFIX = "+42022438";
