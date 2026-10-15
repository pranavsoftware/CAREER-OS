import fs from 'fs';
import path from 'path';

// Parse glTF JSON chunk to inspect morph targets and animations
const glbPath = path.resolve('public/avatars/hr-female.glb');
const buffer = fs.readFileSync(glbPath);

// GLB header is 12 bytes: magic (4), version (4), length (4)
const jsonChunkLength = buffer.readUInt32LE(12);
const jsonChunkType = buffer.readUInt32LE(16);
const jsonStr = buffer.toString('utf8', 20, 20 + jsonChunkLength);
const gltf = JSON.parse(jsonStr);

console.log('Meshes:');
gltf.meshes.forEach((mesh, i) => {
  console.log(`\nMesh ${i}: ${mesh.name}`);
  if (mesh.primitives) {
    mesh.primitives.forEach((prim, j) => {
      if (prim.targets) {
        console.log(`  Primitive ${j} has ${prim.targets.length} morph targets.`);
      }
    });
  }
  if (mesh.extras && mesh.extras.targetNames) {
    console.log(`  Target Names: ${mesh.extras.targetNames.join(', ')}`);
  }
});

console.log('\nAnimations:');
if (gltf.animations) {
  gltf.animations.forEach((anim, i) => {
    console.log(`  Animation ${i}: ${anim.name}, channels: ${anim.channels.length}`);
  });
} else {
  console.log('  No animations');
}

console.log('\nNodes / Bones:');
gltf.nodes.forEach((node, i) => {
  if (node.name && (node.name.toLowerCase().includes('arm') || node.name.toLowerCase().includes('hand') || node.name.toLowerCase().includes('shoulder') || node.name.toLowerCase().includes('jaw') || node.name.toLowerCase().includes('mouth') || node.name.toLowerCase().includes('head'))) {
    console.log(`  Node ${i}: ${node.name}, rot: ${JSON.stringify(node.rotation)}, trans: ${JSON.stringify(node.translation)}`);
  }
});
