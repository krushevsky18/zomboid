
// Use global THREE object (loaded from CDN in HTML)
import { createRedCube } from './red_cube.js';
import { createDummyCharacter } from './dummy.js';
import { createBasicSword } from './basic_sword.js';
import { createTreasureChest } from './treasure_chest.js';
import { createStoneWall } from './stone_wall.js';
import { createTorch } from './torch.js';

const GRASS_COLOR = 'assets/grass/Grass001_4K-JPG_Color.jpg';
const GRASS_NORMAL = 'assets/grass/Grass001_4K-JPG_NormalGL.jpg';
const GRASS_ROUGHNESS = 'assets/grass/Grass001_4K-JPG_Roughness.jpg';
const GRASS_AO = 'assets/grass/Grass001_4K-JPG_AmbientOcclusion.jpg';

export function createMap(size = 1000) {
  const mesh = new THREE.Group();
  mesh.collisionObjects = [];

  // Simple height function - defines terrain height at any X,Z coordinate
  function getTerrainHeight(x, z) {
    // Simple flat ground at y=0
    return 0;
  }
  
  // Store the height function in the map for player access
  mesh.getTerrainHeight = getTerrainHeight;

  // Create a simple flat ground plane
  const groundGeometry = new THREE.PlaneGeometry(size, size);
  const groundMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x7cb342, // Green color
    roughness: 0.8,
    metalness: 0.1
  });
  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2; // Rotate to be horizontal
  ground.position.y = 0; // At ground level
  ground.receiveShadow = true;
  mesh.add(ground);
  
  console.log('Simple flat ground created at y=0');

  // Add a basic sword near the red cube
  const sword = createBasicSword();
  sword.position.set(0, 2.0, 5); // Start higher so we can see it fall
  sword.castShadow = true;
  sword.receiveShadow = true;
  sword.isInteractable = true;
  sword.interactType = 'equipable';
  mesh.add(sword);
  
  // Add physics to the sword (will be applied in main.js when physics world is available)
  sword.needsPhysics = true;
  sword.physicsShape = 'box';
  sword.physicsMass = 1.0;
  sword.physicsSize = new THREE.Vector3(0.1, 0.5, 0.02);
  
  console.log('Sword physics properties set:', {
    needsPhysics: sword.needsPhysics,
    physicsShape: sword.physicsShape,
    physicsMass: sword.physicsMass,
    physicsSize: sword.physicsSize,
    position: sword.position
  });

  // Add collision detection for the sword
  if (mesh && mesh.collisionObjects) {
    const swordCollision = {
      type: 'box',
      position: new THREE.Vector3(0, 2.0, 5), // Center of the sword (updated position)
      size: new THREE.Vector3(0.2, 0.6, 0.04) // Approximate sword dimensions
    };
    mesh.collisionObjects.push(swordCollision);
  }

  // Add a treasure chest
  const chest = createTreasureChest(new THREE.Vector3(-5, 0, 5), 0); // Positioned to the left and in front
  mesh.add(chest);
  
  // Add a stone wall to the left of the chest
  const wall = createStoneWall(new THREE.Vector3(-8, 1, 5), 0);
  mesh.add(wall);
  // Add a torch to the wall (flame flush with wall face, handle/bracket in front)
  const torch = createTorch(new THREE.Vector3(-7.5, 2.9, 5.28), 0);
  mesh.add(torch);
  
  // Dummy character is now created in main.js to mirror player movements

  // Collision check method
  mesh.checkCollision = function(point) {
    for (const obj of mesh.collisionObjects) {
      if (obj.type === 'box') {
        // Handle rotated boxes (like the ramp)
        if (obj.rotation) {
          // Transform point to local coordinates
          const localPoint = point.clone().sub(obj.position);
          const cosRot = Math.cos(-obj.rotation);
          const sinRot = Math.sin(-obj.rotation);
          const rotatedX = localPoint.x * cosRot - localPoint.z * sinRot;
          const rotatedZ = localPoint.x * sinRot + localPoint.z * cosRot;
          
          // Check collision in local coordinates
          const halfSize = obj.size.clone().multiplyScalar(0.5);
          if (
            rotatedX > -halfSize.x && rotatedX < halfSize.x &&
            point.y > obj.position.y - halfSize.y && point.y < obj.position.y + halfSize.y &&
            rotatedZ > -halfSize.z && rotatedZ < halfSize.z
          ) {
            return true;
          }
        } else {
          // Original collision for non-rotated boxes
          const min = obj.position.clone().sub(obj.size.clone().multiplyScalar(0.5));
          const max = obj.position.clone().add(obj.size.clone().multiplyScalar(0.5));
          if (
            point.x > min.x && point.x < max.x &&
            point.y > min.y && point.y < max.y &&
            point.z > min.z && point.z < max.z
          ) {
            return true;
          }
        }
      }
    }
    return false;
  };

  return mesh;
}

export function createSkybox(scene, time = 0) {
  // time: 0 (midnight) to 1 (next midnight), 0.25 = 6am, 0.5 = noon, 0.75 = 6pm
  // We'll use a color gradient for simplicity
  let topColor, bottomColor;
  if (time < 0.25) { // Night to dawn
    topColor = new THREE.Color(0x0a0a2a).lerp(new THREE.Color(0x87ceeb), time / 0.25);
    bottomColor = new THREE.Color(0x222244).lerp(new THREE.Color(0xf0e68c), time / 0.25);
  } else if (time < 0.5) { // Dawn to noon
    topColor = new THREE.Color(0x87ceeb).lerp(new THREE.Color(0x87ceeb), (time-0.25)/0.25);
    bottomColor = new THREE.Color(0xf0e68c).lerp(new THREE.Color(0xffffff), (time-0.25)/0.25);
  } else if (time < 0.75) { // Noon to dusk
    topColor = new THREE.Color(0x87ceeb).lerp(new THREE.Color(0xffa500), (time-0.5)/0.25);
    bottomColor = new THREE.Color(0xffffff).lerp(new THREE.Color(0x222244), (time-0.5)/0.25);
  } else { // Dusk to night
    topColor = new THREE.Color(0xffa500).lerp(new THREE.Color(0x0a0a2a), (time-0.75)/0.25);
    bottomColor = new THREE.Color(0x222244).lerp(new THREE.Color(0x0a0a2a), (time-0.75)/0.25);
  }
  // Set scene background as a gradient (simulated with a canvas texture)
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, '#' + topColor.getHexString());
  grad.addColorStop(1, '#' + bottomColor.getHexString());
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1, 256);
  const skyTex = new THREE.Texture(canvas);
  skyTex.needsUpdate = true;
  scene.background = skyTex;
}


