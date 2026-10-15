/**
 * Inspects model.glb: extracts glTF JSON metadata, meshes, morph targets / blendshapes,
 * bone hierarchies, skins, materials, and animations.
 */

import fs from 'fs';
import path from 'path';

const glbPath = path.resolve('model.glb');

if (!fs.existsSync(glbPath)) {
  console.error(`Error: GLB file not found at ${glbPath}`);
  process.exit(1);
}

const stats = fs.statSync(glbPath);
const buffer = fs.readFileSync(glbPath);

// Verify GLB magic
const magic = buffer.toString('utf8', 0, 4);
if (magic !== 'glTF') {
  console.error(`Error: Invalid GLB magic "${magic}", expected "glTF"`);
  process.exit(1);
}

const version = buffer.readUInt32LE(4);
const totalLength = buffer.readUInt32LE(8);

// First chunk: JSON
const jsonChunkLength = buffer.readUInt32LE(12);
const jsonChunkType = buffer.toString('utf8', 16, 20);

if (jsonChunkType !== 'JSON') {
  console.error(`Error: Expected JSON chunk, got "${jsonChunkType}"`);
  process.exit(1);
}

const jsonString = buffer.toString('utf8', 20, 20 + jsonChunkLength);
const gltf = JSON.parse(jsonString);

console.log('=================================================================');
console.log(' 3D MODEL GLB INSPECTION REPORT');
console.log('=================================================================');
console.log(`File: ${glbPath}`);
console.log(`Size: ${(stats.size / (1024 * 1024)).toFixed(2)} MB (${stats.size} bytes)`);
console.log(`GLB Version: ${version}`);
console.log(`Generator: ${gltf.asset?.generator || 'Unknown'}`);
console.log(`glTF Version: ${gltf.asset?.version || '2.0'}`);

// 1. Nodes & Hierarchy
console.log('\n--- Nodes & Hierarchy ---');
console.log(`Total nodes: ${gltf.nodes?.length || 0}`);
const boneNodes = [];
(gltf.nodes || []).forEach((node, idx) => {
  const isBone = node.name?.toLowerCase().includes('head') ||
                 node.name?.toLowerCase().includes('neck') ||
                 node.name?.toLowerCase().includes('spine') ||
                 node.name?.toLowerCase().includes('eye') ||
                 node.name?.toLowerCase().includes('jaw') ||
                 node.name?.toLowerCase().includes('arm');
  if (isBone) {
    boneNodes.push({ index: idx, name: node.name, children: node.children });
  }
});
console.log(`Identified key bones/nodes (${boneNodes.length}):`);
boneNodes.slice(0, 15).forEach(b => console.log(`  - [Node #${b.index}] ${b.name}`));

// 2. Meshes & Morph Targets (Blendshapes)
console.log('\n--- Meshes & Blendshapes (Morph Targets) ---');
console.log(`Total meshes: ${gltf.meshes?.length || 0}`);

const allMorphTargets = new Set();
(gltf.meshes || []).forEach((mesh, idx) => {
  const targetNames = mesh.extras?.targetNames || [];
  console.log(`  Mesh #${idx}: "${mesh.name || 'Unnamed'}" (Primitives: ${mesh.primitives?.length || 0}, Blendshapes: ${targetNames.length})`);
  targetNames.forEach(t => allMorphTargets.add(t));
});

console.log(`\nUnique Morph Targets / Blendshapes Found: ${allMorphTargets.size}`);
if (allMorphTargets.size > 0) {
  const sortedTargets = Array.from(allMorphTargets).sort();
  console.log('Sample blendshapes:');
  sortedTargets.slice(0, 25).forEach(t => console.log(`  * ${t}`));
  if (sortedTargets.length > 25) {
    console.log(`  ... and ${sortedTargets.length - 25} more blendshapes.`);
  }

  // Check for critical lip-sync and expression blendshapes
  const hasJawOpen = sortedTargets.some(t => /jaw.*open|mouth.*open|viseme.*aa|viseme.*O/i.test(t));
  const hasBlink = sortedTargets.some(t => /eye.*blink|blink/i.test(t));
  const hasSmile = sortedTargets.some(t => /smile|mouth.*smile/i.test(t));
  console.log('\nBlendshape Capabilities for Realistic HR Animation:');
  console.log(`  - Jaw/Mouth Open (Lip Sync): ${hasJawOpen ? 'YES (Supported)' : 'No direct match'}`);
  console.log(`  - Eye Blink (Natural Blinking): ${hasBlink ? 'YES (Supported)' : 'No direct match'}`);
  console.log(`  - Smile (Warm Expressions): ${hasSmile ? 'YES (Supported)' : 'No direct match'}`);
} else {
  console.log('  No morph targets declared in mesh extras. Bone-based deformation / rigged meshes available.');
}

// 3. Skins & Skeleton
console.log('\n--- Skins & Rigging ---');
console.log(`Total skins: ${gltf.skins?.length || 0}`);
(gltf.skins || []).forEach((skin, idx) => {
  console.log(`  Skin #${idx}: "${skin.name || 'Unnamed'}" - ${skin.joints?.length || 0} joints/bones`);
});

// 4. Materials & Textures
console.log('\n--- Materials & Textures ---');
console.log(`Materials: ${gltf.materials?.length || 0}`);
(gltf.materials || []).slice(0, 8).forEach((mat, idx) => {
  console.log(`  - [Material #${idx}] ${mat.name}`);
});
console.log(`Textures: ${gltf.textures?.length || 0}`);
console.log(`Images: ${gltf.images?.length || 0}`);

// 5. Animations
console.log('\n--- Embedded Animations ---');
console.log(`Total animations: ${gltf.animations?.length || 0}`);
(gltf.animations || []).forEach((anim, idx) => {
  console.log(`  - Animation #${idx}: "${anim.name || 'Unnamed'}" (${anim.channels?.length || 0} channels, ${anim.samplers?.length || 0} samplers)`);
});

console.log('=================================================================');
