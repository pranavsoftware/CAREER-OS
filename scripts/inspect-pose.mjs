import fs from 'fs';
import path from 'path';

const glbPath = path.resolve('public/avatars/hr-female.glb');
const buffer = fs.readFileSync(glbPath);
const jsonChunkLength = buffer.readUInt32LE(12);
const gltf = JSON.parse(buffer.toString('utf8', 20, 20 + jsonChunkLength));

const anim = gltf.animations[0];
console.log('Pose1 animation channels:');
anim.channels.forEach((ch, i) => {
  const node = gltf.nodes[ch.target.node];
  console.log(`  Channel ${i}: node=${node.name}, path=${ch.target.path}`);
});
