import { readFileSync } from "node:fs";

function parseGlb(path) {
  const buf = readFileSync(path);
  const magic = buf.readUInt32LE(0);
  if (magic !== 0x46546c67) throw new Error("not a glb");
  const length = buf.readUInt32LE(8);
  let offset = 12;
  let json = null;
  let binLen = 0;
  while (offset < length) {
    const chunkLen = buf.readUInt32LE(offset);
    const chunkType = buf.readUInt32LE(offset + 4);
    const data = buf.subarray(offset + 8, offset + 8 + chunkLen);
    if (chunkType === 0x4e4f534a) json = JSON.parse(data.toString("utf8"));
    else binLen = chunkLen;
    offset += 8 + chunkLen;
  }
  return { json, fileBytes: buf.length, binLen };
}

function summarize(path) {
  const { json, fileBytes } = parseGlb(path);
  const meshes = json.meshes ?? [];
  const nodes = json.nodes ?? [];
  const accessors = json.accessors ?? [];
  const animations = json.animations ?? [];

  // Bounding box from POSITION accessors (mesh-local; ignores node transforms).
  let min = [Infinity, Infinity, Infinity];
  let max = [-Infinity, -Infinity, -Infinity];
  for (const mesh of meshes) {
    for (const prim of mesh.primitives ?? []) {
      const posIdx = prim.attributes?.POSITION;
      if (posIdx == null) continue;
      const acc = accessors[posIdx];
      if (acc?.min && acc?.max) {
        for (let i = 0; i < 3; i++) {
          min[i] = Math.min(min[i], acc.min[i]);
          max[i] = Math.max(max[i], acc.max[i]);
        }
      }
    }
  }
  const size = [max[0] - min[0], max[1] - min[1], max[2] - min[2]];

  let triCount = 0;
  for (const mesh of meshes) {
    for (const prim of mesh.primitives ?? []) {
      const idx = prim.indices;
      if (idx != null && accessors[idx]) triCount += accessors[idx].count / 3;
    }
  }

  console.log("\n=== " + path + " ===");
  console.log("file MB:", (fileBytes / 1048576).toFixed(2));
  console.log("nodes:", nodes.length, "meshes:", meshes.length, "tris~:", Math.round(triCount));
  console.log("animations:", animations.map((a) => a.name ?? "(unnamed)"));
  console.log("local bbox min:", min.map((n) => +n.toFixed(2)));
  console.log("local bbox max:", max.map((n) => +n.toFixed(2)));
  console.log("local size (x,y,z):", size.map((n) => +n.toFixed(2)));
  console.log(
    "top node names:",
    nodes.slice(0, 25).map((n) => n.name ?? "(unnamed)"),
  );
}

for (const f of process.argv.slice(2)) summarize(f);
