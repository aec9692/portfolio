# EMCAM investigation — 2026-10-29

## Result

The three files contain extractable Parasolid **bare-binary** solid payload candidates. They are not opaque, wholly encrypted files. Eight payloads were carved using an observed preceding 32-bit length field; all share the `B` signature, modeller version `3600142`, schema `SCH_3600142_36001`, and consistent four-byte termination. These are bounded candidates, **not independently validated CAD models**. No finished-part STL has been produced.

| Original | Payload count | Payload lengths (bytes) |
| --- | ---: | --- |
| 4X-Lesson-4.emcam | 4 | 17,145; 20,012; 157,562; 185,023 |
| Titan-8M-COLOMA.emcam | 2 | 4,489; 53,850 |
| Titan-9M-COLOMA.emcam | 2 | 4,489; 226,820 |

Candidates are in `extracted/`. Multiple payloads may represent stock, intermediate bodies, history, or finished parts; their identities have not been established. Do not merge or publish them as finished geometry without validation.

## Mesh findings

Each Titan file has a `binary surface` record. Its observed layout is: 14-byte marker, two little-endian uint32 counts, float64 XYZ vertices, then triangle records containing three one-based uint32 indices and a one-byte flag. Both records decode to eight finite vertices and twelve valid triangles forming rectangular boxes:

- Titan 8M: extents 5.55 × 2 × 0.98 in unspecified source units.
- Titan 9M: extents 6.1 × 2 × 0.98 in unspecified source units.

These appear to be stock geometry; that interpretation is inferred from the shape, not established by a decoded entity label. They were deliberately not installed as portfolio previews. No `binary surface` marker was found in 4X Lesson 4.

## Tests and limits

- Scanned all three full files for ZIP, PNG, JPEG, gzip, 7z, OLE, XZ, Zstandard and SQLite signatures: none found.
- Tested 420 / 237 / 3,172 possible zlib headers respectively. No valid stream producing more than 128 bytes was found, with a 32 MiB output limit. This does not rule out custom compression or headerless streams.
- File-wide entropy was approximately 3.53 / 3.85 / 4.00 bits per byte. Readable metadata and repeated structures contradict treating the entire file as encrypted; individual sections may still be encoded.
- Tested **parasolid-kit 0.3.8** against `Titan-8M-COLOMA-solid-2.x_b`. `inspect_xb` rejected it at offset 0: `binary.invalid_signature: expected X_B binary signature 'PS'`. Parsing did not proceed; geometry conversion was not attempted.
- The extracted streams use `B` bare binary, while that reader expects `PS` neutral binary. Replacing the signature alone is not a conversion: numeric byte order and field encoding must be handled correctly.
- The exact internal schema is not among the parser's published built-in profiles. A reader needs the matching schema or a verified implementation of those layouts. A nearby version must not be substituted without validation.
- No original source file was changed or uploaded. Extraction does not recover machining simulation or identify the finished body automatically.

## Reproduce

With Node.js available:

```powershell
node tools/emcam/inspect.mjs "C:/Users/Adria/Downloads/4X-Lesson-4.emcam" "C:/Users/Adria/Downloads/Titan-8M-COLOMA.emcam" "C:/Users/Adria/Downloads/Titan-9M-COLOMA.emcam"
```

This regenerates the payload candidates and `inspection.json`. `findings.json` records the initial hashes, signature scan, and parser test. The downloaded parser is isolated under ignored `runtime-packages/`; it is not a website dependency.

## What further work requires

A bare-binary reader for this exact Parasolid schema, followed by topology reconstruction and tessellation. A compatible Parasolid-based CAD reader might accept the carved streams, but this has not been tested. Another route is extending an open source parser with the bare-binary encoding and exact schema, then validating its output against known models. The evidence narrows the problem substantially but does not establish that a small converter is sufficient.

References consulted:

- [Parasolid XT format reference](https://www.13thmonkey.org/documentation/CAD/Parasolid-XT-format-reference.pdf): physical binary layout and `B` versus `PS` encodings.
- [parasolid-kit](https://github.com/monozukuri-ai/parasolid-kit): reader and conversion capabilities.
- [Schema catalog requirements](https://github.com/monozukuri-ai/parasolid-kit/blob/main/docs/schema-catalogs.md): exact schema selection.
- [ps-parser](https://github.com/khoanguyen-3fc/ps-parser): alternative parser also explicitly checks for `PS`, so it was not installed as a redundant test.
