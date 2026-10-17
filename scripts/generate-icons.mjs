// Membuat favicon, apple-touch-icon, ikon PWA, dan gambar OG default dari logo.
import sharp from "sharp";
import fs from "node:fs/promises";

const LOGO = "public/images/logo-footer.png";
const png = (size) =>
  sharp(LOGO)
    .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

// favicon.ico berisi PNG 16/32/48
const sizes = [16, 32, 48];
const images = await Promise.all(sizes.map((s) => png(s)));
const header = Buffer.alloc(6 + 16 * sizes.length);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(sizes.length, 4);
let offset = header.length;
sizes.forEach((s, i) => {
  const e = 6 + i * 16;
  header.writeUInt8(s, e);
  header.writeUInt8(s, e + 1);
  header.writeUInt16LE(1, e + 4);
  header.writeUInt16LE(32, e + 6);
  header.writeUInt32LE(images[i].length, e + 8);
  header.writeUInt32LE(offset, e + 12);
  offset += images[i].length;
});
await fs.writeFile("src/app/favicon.ico", Buffer.concat([header, ...images]));
await fs.writeFile("src/app/icon.png", await png(512));
await fs.writeFile("src/app/apple-icon.png", await sharp(await png(150)).extend({ top: 15, bottom: 15, left: 15, right: 15, background: "#ffffff" }).flatten({ background: "#ffffff" }).png().toBuffer());
await fs.writeFile("public/icon-192.png", await png(192));
await fs.writeFile("public/icon-512.png", await png(512));

// Gambar OG default 1200x630
const bg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7cf5d3"/><stop offset="0.55" stop-color="#d9fbf1"/><stop offset="1" stop-color="#e6dcff"/></linearGradient></defs>
<rect width="1200" height="630" fill="url(#g)"/>
<text x="560" y="290" font-family="Helvetica, Arial, sans-serif" font-weight="700" font-size="76" fill="#3a3a3a">Info Banten</text>
<text x="560" y="350" font-family="Helvetica, Arial, sans-serif" font-size="30" fill="#4b4f58">Berita terpercaya seputar Banten</text>
<text x="560" y="410" font-family="Helvetica, Arial, sans-serif" font-weight="700" font-size="28" fill="#0274be">infobanten.my.id</text>
</svg>`);
const logo = await png(380);
await sharp(bg).composite([{ input: logo, left: 120, top: 125 }]).jpeg({ quality: 85, mozjpeg: true }).toFile("public/images/og-default.jpg");
console.log("ikon & og-default dibuat");
