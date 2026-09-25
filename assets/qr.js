/* Juice Luxury Rentals — tiny QR encoder (byte mode, ECC L/M, versions 1–40) → inline SVG string.
   Written for this site after Project Nayuki's reference design (MIT). No network, no dependencies.
   Usage: JLRQR.svg("text", {ecl:"M", dark:"#070B14", light:"#fff", label:"…"}) */
(function (root) {
  "use strict";
  const ECW = { // ECC codewords per block, [version]
    L: [-1, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28, 30, 30, 26, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
    M: [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28]
  };
  const NB = { // number of ECC blocks, [version]
    L: [-1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8, 9, 9, 10, 12, 12, 12, 13, 14, 15, 16, 17, 18, 19, 19, 20, 21, 22, 24, 25],
    M: [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49]
  };
  const FMT = { L: 1, M: 0 };
  const bit = (x, i) => ((x >>> i) & 1) !== 0;
  const rawModules = v => { let r = (16 * v + 128) * v + 64; if (v >= 2) { const n = Math.floor(v / 7) + 2; r -= (25 * n - 10) * n - 55; if (v >= 7) r -= 36; } return r; };
  const dataCodewords = (v, ecl) => Math.floor(rawModules(v) / 8) - ECW[ecl][v] * NB[ecl][v];
  const gfMul = (x, y) => { let z = 0; for (let i = 7; i >= 0; i--) { z = (z << 1) ^ ((z >>> 7) * 0x11D); z ^= ((y >>> i) & 1) * x; } return z & 0xFF; };
  const rsDivisor = deg => { const r = new Array(deg).fill(0); r[deg - 1] = 1; let root = 1; for (let i = 0; i < deg; i++) { for (let j = 0; j < r.length; j++) { r[j] = gfMul(r[j], root); if (j + 1 < r.length) r[j] ^= r[j + 1]; } root = gfMul(root, 0x02); } return r; };
  const rsRemainder = (data, div) => { const r = div.map(() => 0); for (const b of data) { const f = b ^ r.shift(); r.push(0); div.forEach((c, i) => { r[i] ^= gfMul(c, f); }); } return r; };

  function encode(text, ecl) {
    ecl = ecl === "L" ? "L" : "M";
    const bytes = Array.from(new TextEncoder().encode(text));
    let ver = 1;
    for (; ver <= 40; ver++) { const cc = ver < 10 ? 8 : 16; if (bytes.length < (1 << cc) && 4 + cc + bytes.length * 8 <= dataCodewords(ver, ecl) * 8) break; }
    if (ver > 40) throw new Error("QR: text too long");
    const bb = []; const put = (val, len) => { for (let i = len - 1; i >= 0; i--) bb.push((val >>> i) & 1); };
    put(4, 4); put(bytes.length, ver < 10 ? 8 : 16); bytes.forEach(b => put(b, 8));
    const cap = dataCodewords(ver, ecl) * 8;
    put(0, Math.min(4, cap - bb.length)); put(0, (8 - bb.length % 8) % 8);
    for (let p = 0xEC; bb.length < cap; p ^= 0xEC ^ 0x11) put(p, 8);
    const data = []; for (let i = 0; i < bb.length; i += 8) { let v = 0; for (let j = 0; j < 8; j++) v = (v << 1) | bb[i + j]; data.push(v); }
    // ECC + interleave
    const nb = NB[ecl][ver], ecLen = ECW[ecl][ver], raw = Math.floor(rawModules(ver) / 8), nShort = nb - raw % nb, shortLen = Math.floor(raw / nb);
    const div = rsDivisor(ecLen), blocks = [];
    for (let i = 0, k = 0; i < nb; i++) { const dat = data.slice(k, k + shortLen - ecLen + (i < nShort ? 0 : 1)); k += dat.length; const ecc = rsRemainder(dat, div); if (i < nShort) dat.push(0); blocks.push(dat.concat(ecc)); }
    const cw = []; for (let i = 0; i < blocks[0].length; i++) blocks.forEach((b, j) => { if (i !== shortLen - ecLen || j >= nShort) cw.push(b[i]); });
    // modules
    const size = ver * 4 + 17, M = [], F = [];
    for (let y = 0; y < size; y++) { M.push(new Array(size).fill(false)); F.push(new Array(size).fill(false)); }
    const setF = (x, y, d) => { M[y][x] = d; F[y][x] = true; };
    for (let i = 0; i < size; i++) { setF(6, i, i % 2 === 0); setF(i, 6, i % 2 === 0); }
    const finder = (x, y) => { for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) { const d = Math.max(Math.abs(dx), Math.abs(dy)), xx = x + dx, yy = y + dy; if (xx >= 0 && xx < size && yy >= 0 && yy < size) setF(xx, yy, d !== 2 && d !== 4); } };
    finder(3, 3); finder(size - 4, 3); finder(3, size - 4);
    const align = [];
    if (ver > 1) { const n = Math.floor(ver / 7) + 2, step = Math.floor((ver * 8 + n * 3 + 5) / (n * 4 - 4)) * 2; align.push(6); for (let pos = size - 7; align.length < n; pos -= step) align.splice(1, 0, pos); }
    align.forEach((a, i) => align.forEach((b, j) => { if ((i === 0 && j === 0) || (i === 0 && j === align.length - 1) || (i === align.length - 1 && j === 0)) return; for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) setF(a + dx, b + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1); }));
    const drawFormat = mask => {
      const d = (FMT[ecl] << 3) | mask; let r = d; for (let i = 0; i < 10; i++) r = (r << 1) ^ ((r >>> 9) * 0x537);
      const b = ((d << 10) | r) ^ 0x5412;
      for (let i = 0; i <= 5; i++) setF(8, i, bit(b, i));
      setF(8, 7, bit(b, 6)); setF(8, 8, bit(b, 7)); setF(7, 8, bit(b, 8));
      for (let i = 9; i < 15; i++) setF(14 - i, 8, bit(b, i));
      for (let i = 0; i < 8; i++) setF(size - 1 - i, 8, bit(b, i));
      for (let i = 8; i < 15; i++) setF(8, size - 15 + i, bit(b, i));
      setF(8, size - 8, true);
    };
    drawFormat(0);
    if (ver >= 7) { let r = ver; for (let i = 0; i < 12; i++) r = (r << 1) ^ ((r >>> 11) * 0x1F25); const b = (ver << 12) | r; for (let i = 0; i < 18; i++) { const v = bit(b, i), a = size - 11 + i % 3, c = Math.floor(i / 3); setF(a, c, v); setF(c, a, v); } }
    // data
    let i = 0;
    for (let right = size - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5;
      for (let vert = 0; vert < size; vert++) for (let j = 0; j < 2; j++) {
        const x = right - j, up = ((right + 1) & 2) === 0, y = up ? size - 1 - vert : vert;
        if (!F[y][x] && i < cw.length * 8) { M[y][x] = bit(cw[i >>> 3], 7 - (i & 7)); i++; }
      }
    }
    const inv = (m, x, y) => [(x + y) % 2 === 0, y % 2 === 0, x % 3 === 0, (x + y) % 3 === 0, (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0, x * y % 2 + x * y % 3 === 0, (x * y % 2 + x * y % 3) % 2 === 0, ((x + y) % 2 + x * y % 3) % 2 === 0][m];
    const applyMask = m => { for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) if (!F[y][x] && inv(m, x, y)) M[y][x] = !M[y][x]; };
    const penalty = () => {
      let p = 0, dark = 0;
      const line = get => { let run = 1; for (let k = 1; k < size; k++) { if (get(k) === get(k - 1)) { run++; if (run === 5) p += 3; else if (run > 5) p++; } else run = 1; } };
      const pat = [true, false, true, true, true, false, true];
      const finderLike = get => { for (let k = 0; k + 7 <= size; k++) { let ok = true; for (let t = 0; t < 7; t++) if (get(k + t) !== pat[t]) { ok = false; break; } if (!ok) continue; const before = k >= 4 && [1, 2, 3, 4].every(t => !get(k - t)); const after = k + 11 <= size && [7, 8, 9, 10].every(t => !get(k + t)); if (before || after) p += 40; } };
      for (let y = 0; y < size; y++) { line(x => M[y][x]); finderLike(x => M[y][x]); }
      for (let x = 0; x < size; x++) { line(y => M[y][x]); finderLike(y => M[y][x]); }
      for (let y = 0; y < size - 1; y++) for (let x = 0; x < size - 1; x++) { const c = M[y][x]; if (c === M[y][x + 1] && c === M[y + 1][x] && c === M[y + 1][x + 1]) p += 3; }
      for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) if (M[y][x]) dark++;
      const total = size * size; p += (Math.ceil(Math.abs(dark * 20 - total * 10) / total) - 1) * 10;
      return p;
    };
    let best = 0, bestP = Infinity;
    for (let m = 0; m < 8; m++) { applyMask(m); drawFormat(m); const p = penalty(); if (p < bestP) { bestP = p; best = m; } applyMask(m); }
    applyMask(best); drawFormat(best);
    return { size, modules: M, version: ver };
  }

  function svg(text, o) {
    o = o || {};
    const q = encode(text, o.ecl || "M"), n = q.size, pad = 4;
    let d = "";
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (q.modules[y][x]) d += `M${x},${y}h1v1h-1z`;
    const label = (o.label || "QR code").replace(/[<&"]/g, "");
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-pad} ${-pad} ${n + pad * 2} ${n + pad * 2}" shape-rendering="crispEdges" role="img" aria-label="${label}"><rect x="${-pad}" y="${-pad}" width="${n + pad * 2}" height="${n + pad * 2}" fill="${o.light || "#fff"}"/><path d="${d}" fill="${o.dark || "#070B14"}"/></svg>`;
  }

  const api = { encode, svg };
  if (typeof module !== "undefined" && module.exports) module.exports = api; else root.JLRQR = api;
})(typeof window !== "undefined" ? window : this);
