// Original geometric application icon. PNG encoder uses only Node built-ins.
import { writeFileSync } from "node:fs";
import { deflateSync } from "node:zlib";
function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) {
    c ^= b;
    for (let i = 0; i < 8; i++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const t = Buffer.from(type),
    length = Buffer.alloc(4),
    crc = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  crc.writeUInt32BE(crc32(Buffer.concat([t, data])));
  return Buffer.concat([length, t, data, crc]);
}
for (const size of [192, 512]) {
  const data = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const dx = (x - size / 2) / size,
        dy = (y - size / 2) / size,
        r = Math.hypot(dx, dy);
      const ex = dx * 0.866 - dy * 0.5,
        ey = dx * 0.5 + dy * 0.866;
      const ellipse = Math.sqrt((ex / 0.37) ** 2 + (ey / 0.115) ** 2);
      const ring = Math.abs(r - 0.245) < 0.018 || Math.abs(ellipse - 1) < 0.065;
      const play =
        dx > -0.055 && dx < 0.105 && Math.abs(dy) < (0.105 - dx) * 0.75;
      const color = ring || play ? [223, 185, 125] : [23, 25, 28];
      const offset = y * (size * 4 + 1) + 1 + x * 4;
      for (let i = 0; i < 3; i++) data[offset + i] = color[i];
      data[offset + 3] = 255;
    }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8;
  header[9] = 6;
  writeFileSync(
    `public/icon-${size}.png`,
    Buffer.concat([
      Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
      chunk("IHDR", header),
      chunk("IDAT", deflateSync(data)),
      chunk("IEND", Buffer.alloc(0)),
    ]),
  );
}
