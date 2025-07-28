// assets/red_cube.js

export function createRedCube(position = new THREE.Vector3(0, 1.5, 0), size = new THREE.Vector3(3, 3, 3)) {
  const geometry = new THREE.BoxGeometry(size.x, size.y, size.z);
  const material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
  const cube = new THREE.Mesh(geometry, material);
  cube.position.copy(position);
  cube.castShadow = true;

  // Collision info
  const collision = {
    type: 'box',
    position: position.clone(),
    size: size.clone()
  };

  return { mesh: cube, collision };
} 