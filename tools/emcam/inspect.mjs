// Read-only source inspection. Usage: node tools/emcam/inspect.mjs <file.emcam> [...]
// Outputs extracted candidates and a machine-readable report next to this script.
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const output = path.dirname(fileURLToPath(import.meta.url));
await fs.mkdir(path.join(output, 'extracted'), { recursive: true });
if (!process.argv.slice(2).length) throw new Error('Supply one or more EMCAM paths.');
const report = [];
for (const filename of process.argv.slice(2)) {
  const b = await fs.readFile(filename);
  const item = {
    name: path.basename(filename), bytes: b.length,
    sha256: crypto.createHash('sha256').update(b).digest('hex'),
    parasolid: [], meshes: [], zlib: [],
  };
  for (let p = b.indexOf(': TRANSMIT'); p >= 0; p = b.indexOf(': TRANSMIT', p + 1)) {
    // Observed envelope: uint32 payload length, B, uint32 version-string length.
    const start = p - 5;
    if (p < 9 || b[start] !== 0x42 || b.readUInt32LE(start + 1) !== 51) continue;
    const length = b.readUInt32LE(p - 9);
    if (length < 80 || start + length > b.length) continue;
    const payload = b.subarray(start, start + length);
    const schemaLength = payload.readUInt32LE(56);
    if (schemaLength > 256 || 60 + schemaLength > payload.length) continue;
    const name = `${path.basename(filename, path.extname(filename))}-solid-${item.parasolid.length + 1}.x_b`;
    await fs.writeFile(path.join(output, 'extracted', name), payload);
    item.parasolid.push({ start, length, name,
      version: payload.subarray(5, 56).toString('ascii'),
      schema: payload.subarray(60, 60 + schemaLength).toString('ascii'),
      terminator: payload.subarray(-4).toString('hex'),
      validatedGeometry: false });
  }
  for (let p = b.indexOf('binary surface'); p >= 0; p = b.indexOf('binary surface', p + 1)) {
    if (p + 22 > b.length) continue;
    const vertices = b.readUInt32LE(p + 14), triangles = b.readUInt32LE(p + 18);
    const end = p + 22 + vertices * 24 + triangles * 13;
    if (vertices > 1e6 || triangles > 2e6 || end > b.length) continue;
    const points = Array.from({ length: vertices }, (_, i) =>
      [0, 1, 2].map(c => b.readDoubleLE(p + 22 + i * 24 + c * 8)));
    const faces = Array.from({ length: triangles }, (_, i) =>
      [0, 1, 2].map(c => b.readUInt32LE(p + 22 + vertices * 24 + i * 13 + c * 4)));
    item.meshes.push({ offset: p, vertices, triangles, points, faces,
      validIndices: faces.flat().every(n => n >= 1 && n <= vertices),
      interpretation: 'Unidentified mesh; do not assume this is the finished part.' });
  }
  for (let p = 0; p < b.length - 2; p++) {
    if ((b[p] & 15) !== 8 || (b[p] >> 4) > 7 || ((b[p] << 8 | b[p + 1]) % 31)) continue;
    try {
      const decoded = zlib.inflateSync(b.subarray(p), { maxOutputLength: 32 * 1024 * 1024 });
      if (decoded.length > 128) item.zlib.push({ offset: p, decodedBytes: decoded.length });
    } catch { /* A coincidental zlib header is not a compressed stream. */ }
  }
  report.push(item);
}
await fs.writeFile(path.join(output, 'inspection.json'), JSON.stringify(report, null, 2));
console.log(report.map(r => `${r.name}: ${r.parasolid.length} solid candidates, ${r.meshes.length} mesh records, ${r.zlib.length} zlib streams`).join('\n'));
