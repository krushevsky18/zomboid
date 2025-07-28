// assets/basic_sword.js - Detailed sword creation

export function createBasicSword(position = new THREE.Vector3(2, 0.5, 0), rotation = 0) {
  const sword = new THREE.Group();
  
  // Materials
  const bladeMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xcccccc, // Steel gray
    roughness: 0.3,
    metalness: 0.8
  });
  
  const guardMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x8b4513, // Brown wood/leather
    roughness: 0.7,
    metalness: 0.1
  });
  
  const handleMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x654321, // Dark brown leather
    roughness: 0.8,
    metalness: 0.0
  });
  
  const pommelMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xffd700, // Gold
    roughness: 0.2,
    metalness: 0.9
  });
  
  // Cross guard - horizontal bar with realistic proportions
  const guardGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.35, 8);
  const guard = new THREE.Mesh(guardGeometry, guardMaterial);
  guard.position.y = 0.55; // Guard position (reference point)
  guard.rotation.z = Math.PI / 2; // Rotate to be horizontal
  sword.add(guard);
  
  // Blade - thin rectangular plane with realistic proportions
  // Blade starts above the guard, not below it
  const bladeGeometry = new THREE.BoxGeometry(0.08, 1.0, 0.01); // Wide, tall, very thin (shorter to make room for tip)
  const blade = new THREE.Mesh(bladeGeometry, bladeMaterial);
  blade.position.y = 1.05; // Position blade above guard (adjusted for shorter blade)
  sword.add(blade);
  
  // Blade tip - thin rectangular with triangular point
  const tipGeometry = new THREE.BoxGeometry(0.08, 0.15, 0.01); // Same width as blade, thin like blade
  const tip = new THREE.Mesh(tipGeometry, bladeMaterial);
  tip.position.y = 1.575; // Connected to the end of the blade (1.05 + 0.5 + 0.025)
  sword.add(tip);
  
  // Create triangular point by scaling the tip to narrow at the top
  tip.scale.x = 0.3; // Make it much narrower at the top for sharp triangular point
  tip.scale.y = 1.0; // Keep full height
  tip.scale.z = 1.0; // Keep full thickness
  
  // Handle - grip section (thinner than blade base)
  const handleGeometry = new THREE.CylinderGeometry(0.018, 0.018, 0.25, 8);
  const handle = new THREE.Mesh(handleGeometry, handleMaterial);
  handle.position.y = 0.425; // Below guard
  sword.add(handle);
  
  // Handle wrapping - decorative bands (adjusted for thinner handle)
  for (let i = 0; i < 3; i++) {
    const bandGeometry = new THREE.TorusGeometry(0.018, 0.003, 4, 8);
    const band = new THREE.Mesh(bandGeometry, guardMaterial);
    band.position.y = 0.325 + i * 0.08; // Space bands along handle
    band.rotation.x = Math.PI / 2; // Orient correctly
    sword.add(band);
  }
  
  // Pommel - decorative end cap (smaller to match handle)
  const pommelGeometry = new THREE.SphereGeometry(0.025, 8, 6);
  const pommel = new THREE.Mesh(pommelGeometry, pommelMaterial);
  pommel.position.y = 0.3; // At bottom of handle
  sword.add(pommel);
  
  // Blade fuller (blood groove) - decorative line down the blade
  const fullerGeometry = new THREE.BoxGeometry(0.02, 0.6, 0.002); // Thin rectangular groove (shorter to match blade)
  const fuller = new THREE.Mesh(fullerGeometry, bladeMaterial);
  fuller.position.y = 1.05; // Same as blade
  fuller.position.z = 0.006; // Slightly forward
  fuller.material = new THREE.MeshStandardMaterial({ 
    color: 0x999999, // Slightly darker
    roughness: 0.4,
    metalness: 0.7
  });
  sword.add(fuller);
  
  // Position and rotate the entire sword
  sword.position.copy(position);
  sword.rotation.y = rotation;
  
  // Add shadows
  sword.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
  // Mark as interactable
  sword.isInteractable = true;
  sword.interactType = 'equipable';
  
  return sword;
} 