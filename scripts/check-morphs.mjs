import fs from 'fs';
import path from 'path';

const glbPath = path.resolve('public/avatars/hr-female.glb');
const buffer = fs.readFileSync(glbPath);
const jsonChunkLength = buffer.readUInt32LE(12);
const gltf = JSON.parse(buffer.toString('utf8', 20, 20 + jsonChunkLength));

for (const mesh of gltf.meshes) {
  if (mesh.primitives) {
    for (const prim of mesh.primitives) {
      if (prim.targets) {
        console.log(`Mesh ${mesh.name} has ${prim.targets.length} targets!`);
        console.log(prim.targets);
      }
    }
  }
}
