import type { CSSProperties } from "react";

type Aplikace = {
  id: string;
  nazev: string;
  popis: string;
  stav: string;
  platformy: string[];
  detailUrl: string;
  apkUrl?: string;
  iosUrl?: string;
};

const APLIKACE: Aplikace[] = [
  {
    id: "linka",
    nazev: "ČZU Linka",
    popis: "Rychlé vyhledávání a vytáčení interních linek v jednoduchém mobilním rozhraní.",
    stav: "Aktivní",
    platformy: ["Android APK", "iOS App Store"],
    detailUrl: "/apps/linka/",
    apkUrl: "/apps/linka/linka.apk",
    iosUrl: "https://apps.apple.com/cz/search?term=Linka%20od%20Pupenu",
  },
];

const styly = {
  stranka: {
    minHeight: "100vh",
    background:
      "linear-gradient(180deg, #ffffff 0%, #f0fdf4 100%)",
    color: "#000000",
    fontFamily:
      'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  wrap: {
    width: "min(1120px, calc(100% - 32px))",
    margin: "0 auto",
  },
  header: {
    borderBottom: "2px solid #000000",
    background: "rgba(255, 255, 255, 0.96)",
  },
  headerInner: {
    width: "min(1120px, calc(100% - 32px))",
    margin: "0 auto",
    minHeight: "74px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "16px",
    flexWrap: "wrap" as const,
    padding: "14px 0",
  },
  brand: {
    display: "inline-flex",
    alignItems: "center",
    gap: "12px",
    color: "#000000",
    textDecoration: "none",
    fontWeight: 900,
    letterSpacing: "-0.02em",
  },
  brandIcon: {
    width: "44px",
    height: "44px",
    border: "2px solid #000000",
    borderRadius: "14px",
    display: "grid",
    placeItems: "center",
  },
  brandTop: {
    display: "block",
    fontSize: "11px",
    textTransform: "uppercase" as const,
    letterSpacing: "0.18em",
    color: "#15803d",
  },
  brandTitle: {
    display: "block",
    fontSize: "19px",
    lineHeight: 1.05,
  },
  nav: {
    display: "flex",
    flexWrap: "wrap" as const,
    gap: "18px",
  },
  navLink: {
    color: "#000000",
    textDecoration: "none",
    fontSize: "12px",
    fontWeight: 900,
    textTransform: "uppercase" as const,
    letterSpacing: "0.16em",
  },
  hero: {
    padding: "56px 0 34px",
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    border: "2px solid #000000",
    borderRadius: "999px",
    padding: "10px 16px",
    fontSize: "11px",
    fontWeight: 900,
    letterSpacing: "0.16em",
    textTransform: "uppercase" as const,
    background: "#ffffff",
  },
  title: {
    margin: "18px 0 14px",
    fontSize: "clamp(40px, 8vw, 72px)",
    lineHeight: 0.96,
    letterSpacing: "-0.05em",
    fontWeight: 900,
    maxWidth: "900px",
  },
  lead: {
    maxWidth: "760px",
    margin: 0,
    fontSize: "clamp(16px, 2.4vw, 24px)",
    lineHeight: 1.45,
    fontWeight: 600,
  },
  section: {
    padding: "16px 0 72px",
  },
  sectionHead: {
    display: "flex",
    alignItems: "end",
    justifyContent: "space-between",
    gap: "16px",
    flexWrap: "wrap" as const,
    marginBottom: "24px",
  },
  sectionTitle: {
    margin: 0,
    fontSize: "clamp(24px, 4vw, 38px)",
    lineHeight: 1,
    letterSpacing: "-0.04em",
    fontWeight: 900,
  },
  sectionText: {
    margin: 0,
    maxWidth: "560px",
    fontSize: "15px",
    lineHeight: 1.65,
    fontWeight: 600,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "20px",
  },
  card: {
    border: "2px solid #000000",
    borderRadius: "30px",
    background: "#ffffff",
    padding: "24px",
  },
  cardHead: {
    display: "flex",
    alignItems: "start",
    justifyContent: "space-between",
    gap: "16px",
    flexWrap: "wrap" as const,
    marginBottom: "16px",
  },
  cardIntro: {
    display: "flex",
    gap: "16px",
    alignItems: "center",
  },
  cardIcon: {
    width: "62px",
    height: "62px",
    border: "2px solid #000000",
    borderRadius: "20px",
    display: "grid",
    placeItems: "center",
    fontSize: "28px",
    flexShrink: 0,
  },
  tags: {
    display: "flex",
    flexWrap: "wrap" as const,
    gap: "8px",
  },
  tag: {
    display: "inline-flex",
    alignItems: "center",
    minHeight: "34px",
    padding: "0 12px",
    border: "2px solid #000000",
    borderRadius: "999px",
    fontSize: "11px",
    fontWeight: 900,
    textTransform: "uppercase" as const,
    letterSpacing: "0.14em",
    background: "#ffffff",
  },
  tagActive: {
    background: "#dcfce7",
    border: "2px solid #16a34a",
    color: "#15803d",
  },
  cardTitle: {
    margin: "0 0 8px",
    fontSize: "30px",
    lineHeight: 1.02,
    letterSpacing: "-0.04em",
  },
  cardText: {
    margin: 0,
    fontSize: "15px",
    lineHeight: 1.65,
    fontWeight: 500,
  },
  meta: {
    display: "flex",
    flexWrap: "wrap" as const,
    gap: "10px",
    marginTop: "18px",
    marginBottom: "20px",
  },
  metaItem: {
    border: "2px solid #000000",
    borderRadius: "16px",
    padding: "10px 12px",
    fontSize: "13px",
    fontWeight: 700,
  },
  actions: {
    display: "flex",
    flexWrap: "wrap" as const,
    gap: "12px",
  },
  button: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "52px",
    padding: "0 18px",
    borderRadius: "18px",
    border: "2px solid #16a34a",
    background: "#16a34a",
    color: "#ffffff",
    textDecoration: "none",
    fontSize: "14px",
    fontWeight: 900,
    letterSpacing: "0.02em",
  },
  buttonSecondary: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "52px",
    padding: "0 18px",
    borderRadius: "18px",
    border: "2px solid #000000",
    background: "#ffffff",
    color: "#000000",
    textDecoration: "none",
    fontSize: "14px",
    fontWeight: 900,
    letterSpacing: "0.02em",
  },
  note: {
    marginTop: "28px",
    padding: "18px 20px",
    border: "2px solid #000000",
    borderRadius: "20px",
    fontSize: "14px",
    lineHeight: 1.65,
    fontWeight: 600,
    background: "#ffffff",
  },
} satisfies Record<string, CSSProperties>;

export default function AppsPage() {
  return (
    <div style={styly.stranka}>
      <header style={styly.header}>
        <div style={styly.headerInner}>
          <a href="https://www.pupen.org/" style={styly.brand}>
            <span style={styly.brandIcon}>P</span>
            <span>
              <span style={styly.brandTop}>Pupen</span>
              <span style={styly.brandTitle}>Aplikace</span>
            </span>
          </a>
          <nav aria-label="Navigace" style={styly.nav}>
            <a href="#aplikace" style={styly.navLink}>Seznam aplikací</a>
            <a href="/apps/linka/" style={styly.navLink}>ČZU Linka</a>
          </nav>
        </div>
      </header>

      <main style={styly.wrap}>
        <section style={styly.hero}>
          <span style={styly.badge}>Aplikace provozované Pupenem</span>
          <h1 style={styly.title}>
            Jedno místo pro aktuální appky a jejich <span style={{ color: "#16a34a" }}>stažení</span>.
          </h1>
          <p style={styly.lead}>
            Tady najdete přehled aktivních aplikací, které Pupen provozuje. U každé aplikace je rovnou
            odkaz na dostupné stažení podle platformy.
          </p>
        </section>

        <section id="aplikace" style={styly.section}>
          <div style={styly.sectionHead}>
            <h2 style={styly.sectionTitle}>Aktuální aplikace</h2>
            <p style={styly.sectionText}>
              Zatím je dostupná jedna aplikace. Stránka je připravená i pro další projekty
              a různé typy distribuce.
            </p>
          </div>

          <div style={styly.grid}>
            {APLIKACE.map((aplikace) => (
              <article key={aplikace.id} style={styly.card}>
                <div style={styly.cardHead}>
                  <div style={styly.cardIntro}>
                    <div style={styly.cardIcon}>☎</div>
                    <div>
                      <h3 style={styly.cardTitle}>{aplikace.nazev}</h3>
                      <p style={styly.cardText}>{aplikace.popis}</p>
                    </div>
                  </div>
                  <div style={styly.tags}>
                    <span style={{ ...styly.tag, ...styly.tagActive }}>{aplikace.stav}</span>
                    {aplikace.platformy.map((platforma) => (
                      <span key={platforma} style={styly.tag}>{platforma}</span>
                    ))}
                  </div>
                </div>

                <div style={styly.meta}>
                  <div style={styly.metaItem}>
                    Distribuce: {aplikace.iosUrl ? "APK + App Store" : "přímé stažení"}
                  </div>
                  <div style={styly.metaItem}>Detail: {aplikace.detailUrl}</div>
                </div>

                <div style={styly.actions}>
                  {aplikace.apkUrl ? (
                    <a href={aplikace.apkUrl} style={styly.button}>Stáhnout APK</a>
                  ) : null}
                  {aplikace.iosUrl ? (
                    <a href={aplikace.iosUrl} style={styly.button}>Otevřít v App Storu</a>
                  ) : null}
                  <a href={aplikace.detailUrl} style={styly.buttonSecondary}>Detail aplikace</a>
                </div>
              </article>
            ))}
          </div>

          <div style={styly.note}>
            Odkazy se u jednotlivých aplikací zobrazují podle toho, co je aktuálně dostupné:
            buď přímé stažení APK, nebo odkaz do App Storu pro iOS.
          </div>
        </section>
      </main>
    </div>
  );
}
