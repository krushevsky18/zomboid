import * as THREE from 'https://unpkg.com/three@0.153.0/build/three.module.js';

export function createTorch(position = new THREE.Vector3(), rotation = 0) {
  const torch = new THREE.Group();

  // Bracket (sconce) - flush with wall at back of group
  const bracketMaterial = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.8, roughness: 0.4 });
  const bracket = new THREE.Group();
  // Wall plate
  const plate = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.04), bracketMaterial);
  plate.position.set(0, -0.3, 0);
  bracket.add(plate);
  // U arms (hold the handle)
  for (let i = -1; i <= 1; i += 2) {
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.18, 6), bracketMaterial);
    arm.position.set(i * 0.07, -0.3, 0.06);
    arm.rotation.z = Math.PI / 2;
    bracket.add(arm);
  }
  // Crossbar
  const crossbar = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.14, 6), bracketMaterial);
  crossbar.position.set(0, -0.3, 0.12);
  crossbar.rotation.x = Math.PI / 2;
  bracket.add(crossbar);
  torch.add(bracket);

  // Handle (thin, uniform, vertically aligned, in front of wall)
  const handleGeometry = new THREE.CylinderGeometry(0.04, 0.04, 0.7, 10);
  const handleMaterial = new THREE.MeshStandardMaterial({ color: 0x8B5A2B, roughness: 0.7 });
  const handle = new THREE.Mesh(handleGeometry, handleMaterial);
  handle.position.set(0, -0.45, 0.08); // Centered below flame, in front of wall
  torch.add(handle);

  // Flame (emissive) at top, vertically above handle, in front of wall
  const flameMaterial = new THREE.MeshStandardMaterial({ color: 0xffa500, emissive: 0xffa500, emissiveIntensity: 1.5 });
  const flame = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), flameMaterial);
  flame.position.set(0, 0, 0.08);
  torch.add(flame);

  // Optionally add a cone for a more flame-like shape
  const flameConeMaterial = new THREE.MeshStandardMaterial({ color: 0xffe066, emissive: 0xffe066, emissiveIntensity: 1.2 });
  const flameCone = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.18, 8), flameConeMaterial);
  flameCone.position.set(0, 0.1, 0.08);
  torch.add(flameCone);

  // Flickering point light at flame
  const light = new THREE.PointLight(0xffa040, 1.2, 4, 2);
  light.position.set(0, 0.05, 0.08);
  torch.add(light);
  torch.userData.flicker = true;
  torch.userData.light = light;

  torch.position.copy(position);
  torch.rotation.y = rotation;
  torch.name = 'Torch';
  return torch;
} 