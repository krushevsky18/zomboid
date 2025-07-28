import * as THREE from 'https://unpkg.com/three@0.153.0/build/three.module.js';

// Creates a more realistic pine tree mesh with textures, billboards, and color variation
export function createBasicPineTree(position = new THREE.Vector3(), scale = 2) {
  const tree = new THREE.Group();
  const loader = new THREE.TextureLoader();

  // Trunk texture (fallback to color if not available)
  const trunkMaterial = new THREE.MeshStandardMaterial({
    color: 0x8b5a2b,
    roughness: 0.8,
  });
  const trunkGeometry = new THREE.CylinderGeometry(0.12 * scale, 0.16 * scale, 2.4 * scale, 8);
  const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
  trunk.position.y = 1.2 * scale;
  tree.add(trunk);

  // Consistent green color for all foliage
  const foliageColor = 0x2e8b57;

  // Foliage cones (randomize scale but keep same color)
  const coneHeights = [2.0, 1.6, 1.2];
  const coneRadii = [0.7, 0.5, 0.3];
  let y = 2.4 * scale;
  for (let i = 0; i < 3; i++) {
    const coneMaterial = new THREE.MeshStandardMaterial({ color: foliageColor, roughness: 0.6 });
    const coneGeometry = new THREE.ConeGeometry(
      coneRadii[i] * scale * (0.95 + Math.random() * 0.1),
      coneHeights[i] * scale * (0.95 + Math.random() * 0.1),
      12
    );
    const cone = new THREE.Mesh(coneGeometry, coneMaterial);
    cone.position.y = y + (coneHeights[i] * scale) / 2;
    cone.rotation.y = Math.random() * Math.PI * 2;
    tree.add(cone);
    y += coneHeights[i] * scale * 0.7;
  }

  // Billboard foliage planes (use built-in grass texture as a stand-in for pine needles)
  for (let i = 0; i < 3; i++) {
    const planeMaterial = new THREE.MeshStandardMaterial({
      color: foliageColor,
      map: undefined, // No texture map
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide,
      roughness: 0.7
    });
    const planeGeometry = new THREE.PlaneGeometry(2.2 * scale, 2.2 * scale);
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.position.y = 2.8 * scale + Math.random() * 1.5 * scale;
    plane.rotation.y = Math.random() * Math.PI;
    tree.add(plane);
  }

  tree.position.copy(position);
  tree.scale.set(scale, scale, scale);
  tree.traverse(obj => { if (obj.isMesh) { obj.castShadow = true; obj.receiveShadow = true; } });
  return tree;
} 