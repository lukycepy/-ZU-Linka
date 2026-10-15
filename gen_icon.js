/**
 * Generuje ikonu aplikace: zelené pozadí + Pupen logo uprostřed + bílá telefonní sluchátka v pravém dolním rohu
 */
const Jimp = require("jimp-compact");
const { promisify } = require("util");

// Barvy
const ZELENA = 0x15803dff; // Pupen zelená
const BILA = 0xffffffff;   // bílá
const PRUHLEDNA = 0x00000000;

const writeAsync = (img, path) =>
  new Promise((resolve, reject) => img.write(path, (err) => (err ? reject(err) : resolve())));

// Pomocná funkce: vyplní obdélník
function fillRect(img, x, y, w, h, color) {
  const iw = img.bitmap.width;
  const ih = img.bitmap.height;
  for (let i = Math.max(0, x); i < Math.min(iw, x + w); i++) {
    for (let j = Math.max(0, y); j < Math.min(ih, y + h); j++) {
      img.setPixelColor(color, i, j);
    }
  }
}

// Pomocná funkce: vyplní kruh
function fillCircle(img, cx, cy, r, color) {
  const iw = img.bitmap.width;
  const ih = img.bitmap.height;
  for (let i = Math.max(0, cx - r); i <= Math.min(iw - 1, cx + r); i++) {
    for (let j = Math.max(0, cy - r); j <= Math.min(ih - 1, cy + r); j++) {
      const dx = i - cx;
      const dy = j - cy;
      if (dx * dx + dy * dy <= r * r) {
        img.setPixelColor(color, i, j);
      }
    }
  }
}

// Pomocná funkce: zaoblený obdélník
function fillRoundedRect(img, x, y, w, h, r, color) {
  fillRect(img, x + r, y, w - 2 * r, h, color);
  fillRect(img, x, y + r, w, h - 2 * r, color);
  fillCircle(img, x + r, y + r, r, color);
  fillCircle(img, x + w - r, y + r, r, color);
  fillCircle(img, x + r, y + h - r, r, color);
  fillCircle(img, x + w - r, y + h - r, r, color);
}

async function main() {
  const size = 1024;
  const bg = new Jimp(size, size, ZELENA);

  // 1. Načti Pupen logo a vycentruj ho
  const logo = await Jimp.read("pupen_logo.png");
  const maxLogo = 700;
  logo.scaleToFit(maxLogo, maxLogo, Jimp.RESIZE_BILINEAR);
  const logoX = Math.floor((size - logo.bitmap.width) / 2);
  const logoY = Math.floor((size - logo.bitmap.height) / 2);
  bg.composite(logo, logoX, logoY);

  // 2. Vytvoř telefonní sluchátko na samostatném plátně (zelené na průhledném)
  const ps = 256;
  const phone = new Jimp(ps, ps, PRUHLEDNA);
  const ZELENA_PHONE = ZELENA;

  // Vertikální rukojeť sluchátka (uprostřed)
  fillRoundedRect(phone, 112, 64, 32, 128, 16, ZELENA_PHONE);
  // Horní část (naslouchátko) – vodorovný pruh
  fillRoundedRect(phone, 64, 48, 128, 36, 18, ZELENA_PHONE);
  // Dolní část (mikrofon) – vodorovný pruh
  fillRoundedRect(phone, 64, 172, 128, 36, 18, ZELENA_PHONE);

  // Otoč sluchátko o 45° aby vypadalo jako telefon
  phone.rotate(45, false);

  // Změn velikost sluchátka
  const phoneTarget = 168;
  phone.scaleToFit(phoneTarget, phoneTarget, Jimp.RESIZE_BILINEAR);

  // Umísti do pravého dolního rohu s odsazením
  const padding = 56;
  const px = size - phone.bitmap.width - padding;
  const py = size - phone.bitmap.height - padding;

  // Bílý kruh za sluchátkem pro lepší čitelnost
  const circleR = Math.floor(phoneTarget / 2) + 14;
  const cx = Math.floor(px + phone.bitmap.width / 2);
  const cy = Math.floor(py + phone.bitmap.height / 2);
  fillCircle(bg, cx, cy, circleR, BILA);

  bg.composite(phone, px, py);

  // Ulož ikony
  await writeAsync(bg, "assets/icon.png");
  await writeAsync(bg, "assets/adaptive-icon.png");

  // Splash – jen logo na zeleném pozadí (bez sluchátka)
  const splash = new Jimp(size, size, ZELENA);
  const splashLogo = await Jimp.read("pupen_logo.png");
  const maxSplash = 600;
  splashLogo.scaleToFit(maxSplash, maxSplash, Jimp.RESIZE_BILINEAR);
  const sx = Math.floor((size - splashLogo.bitmap.width) / 2);
  const sy = Math.floor((size - splashLogo.bitmap.height) / 2);
  splash.composite(splashLogo, sx, sy);
  await writeAsync(splash, "assets/splash.png");

  console.log("OK: icon.png, adaptive-icon.png, splash.png vygenerovány");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
