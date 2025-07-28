// assets/treasure_chest.js - Detailed treasure chest creation

export function createTreasureChest(position = new THREE.Vector3(5, 0, 0), rotation = 0) {
  const chest = new THREE.Group();
  
  // Chest state
  chest.isOpen = false;
  chest.openAngle = 0;
  chest.targetOpenAngle = 0;
  chest.openSpeed = 2; // radians per second
  
  // Create wood texture
  const createWoodTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    
    // Base wood color
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(0, 0, 256, 256);
    
    // Add wood grain lines
    ctx.strokeStyle = '#654321';
    ctx.lineWidth = 1;
    for (let i = 0; i < 20; i++) {
      const y = Math.random() * 256;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(256, y + Math.random() * 20 - 10);
      ctx.stroke();
    }
    
    // Add some darker spots for wood knots
    ctx.fillStyle = '#654321';
    for (let i = 0; i < 5; i++) {
      const x = Math.random() * 256;
      const y = Math.random() * 256;
      const size = 10 + Math.random() * 20;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2);
    return texture;
  };
  
  const woodTexture = createWoodTexture();
  
  // Materials
  const woodMaterial = new THREE.MeshStandardMaterial({ 
    map: woodTexture,
    roughness: 0.8,
    metalness: 0.0
  });
  
  const metalMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xC0C0C0, // Silver metal
    roughness: 0.3,
    metalness: 0.8
  });
  
  const goldMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xFFD700, // Gold
    roughness: 0.2,
    metalness: 0.9
  });
  
  const darkWoodMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x654321, // Dark brown wood
    roughness: 0.9,
    metalness: 0.0
  });
  
  // Chest base (hollow)
  const baseGroup = new THREE.Group();
  // Dimensions
  const baseWidth = 1.2, baseHeight = 0.6, baseDepth = 0.8, wall = 0.06;
  // Bottom
  const bottom = new THREE.Mesh(new THREE.BoxGeometry(baseWidth, wall, baseDepth), woodMaterial);
  bottom.position.y = wall / 2;
  baseGroup.add(bottom);
  // Left wall
  const left = new THREE.Mesh(new THREE.BoxGeometry(wall, baseHeight, baseDepth), woodMaterial);
  left.position.set(-baseWidth/2 + wall/2, baseHeight/2, 0);
  baseGroup.add(left);
  // Right wall
  const right = left.clone();
  right.position.x = baseWidth/2 - wall/2;
  baseGroup.add(right);
  // Back wall
  const back = new THREE.Mesh(new THREE.BoxGeometry(baseWidth, baseHeight, wall), woodMaterial);
  back.position.set(0, baseHeight/2, -baseDepth/2 + wall/2);
  baseGroup.add(back);
  // Front wall
  const front = back.clone();
  front.position.z = baseDepth/2 - wall/2;
  baseGroup.add(front);
  // Position the hollow base
  baseGroup.position.y = 0;
  chest.add(baseGroup);
  
  // Create lid group for rotation
  const lidGroup = new THREE.Group();
  lidGroup.position.set(0, 0.6, -0.4); // Position at hinge point (back edge)
  chest.add(lidGroup);
  
  // Chest lid (top part)
  const lidGeometry = new THREE.BoxGeometry(1.2, 0.2, 0.8);
  const lid = new THREE.Mesh(lidGeometry, woodMaterial);
  lid.position.set(0, 0.1, 0.4); // Relative to lid group (moved forward from hinge)
  lidGroup.add(lid);
  
  // Lid hinge (back edge)
  const hingeGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.8, 8);
  const hinge = new THREE.Mesh(hingeGeometry, metalMaterial);
  hinge.position.set(0, 0.6, -0.4);
  hinge.rotation.z = Math.PI / 2;
  chest.add(hinge);
  
  // Front lock plate
  const lockPlateGeometry = new THREE.BoxGeometry(0.3, 0.1, 0.08);
  const lockPlate = new THREE.Mesh(lockPlateGeometry, metalMaterial);
  lockPlate.position.set(0, 0.65, 0.44);
  chest.add(lockPlate);
  
  // Lock mechanism
  const lockGeometry = new THREE.BoxGeometry(0.15, 0.08, 0.05);
  const lock = new THREE.Mesh(lockGeometry, goldMaterial);
  lock.position.set(0, 0.65, 0.485);
  chest.add(lock);
  
  // Lock keyhole
  const keyholeGeometry = new THREE.CylinderGeometry(0.01, 0.01, 0.06, 8);
  const keyhole = new THREE.Mesh(keyholeGeometry, darkWoodMaterial);
  keyhole.position.set(0, 0.65, 0.51);
  keyhole.rotation.x = Math.PI / 2;
  chest.add(keyhole);
  
  // Decorative metal bands around the chest
  const bandGeometry = new THREE.BoxGeometry(1.25, 0.05, 0.85);
  
  // Top band (moves with lid)
  const topBand = new THREE.Mesh(bandGeometry, metalMaterial);
  topBand.position.set(0, 0.2, 0.4); // Relative to lid group (aligned with chest when closed)
  lidGroup.add(topBand);
  
  // Bottom band
  const bottomBand = new THREE.Mesh(bandGeometry, metalMaterial);
  bottomBand.position.set(0, 0.1, 0);
  chest.add(bottomBand);
  
  // Side bands
  const sideBandGeometry = new THREE.BoxGeometry(0.05, 0.6, 0.85);
  
  // Left side band
  const leftBand = new THREE.Mesh(sideBandGeometry, metalMaterial);
  leftBand.position.set(-0.625, 0.3, 0);
  chest.add(leftBand);
  
  // Right side band
  const rightBand = new THREE.Mesh(sideBandGeometry, metalMaterial);
  rightBand.position.set(0.625, 0.3, 0);
  chest.add(rightBand);
  
  // Corner reinforcements
  const cornerGeometry = new THREE.BoxGeometry(0.12, 0.12, 0.12);
  
  // Front left corner
  const frontLeftCorner = new THREE.Mesh(cornerGeometry, metalMaterial);
  frontLeftCorner.position.set(-0.56, 0.3, 0.36);
  chest.add(frontLeftCorner);
  
  // Front right corner
  const frontRightCorner = new THREE.Mesh(cornerGeometry, metalMaterial);
  frontRightCorner.position.set(0.56, 0.3, 0.36);
  chest.add(frontRightCorner);
  
  // Back left corner
  const backLeftCorner = new THREE.Mesh(cornerGeometry, metalMaterial);
  backLeftCorner.position.set(-0.56, 0.3, -0.36);
  chest.add(backLeftCorner);
  
  // Back right corner
  const backRightCorner = new THREE.Mesh(cornerGeometry, metalMaterial);
  backRightCorner.position.set(0.56, 0.3, -0.36);
  chest.add(backRightCorner);
  
  // Lid handle
  const handleGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.2, 8);
  const handle = new THREE.Mesh(handleGeometry, metalMaterial);
  handle.position.set(0, 0.25, 0.7); // Relative to lid group (moved forward and up to protrude above band)
  handle.rotation.z = Math.PI / 2; // Rotate 90 degrees to be horizontal
  lidGroup.add(handle);
  
  // Handle supports
  const supportGeometry = new THREE.BoxGeometry(0.05, 0.05, 0.1);
  
  // Left handle support
  const leftSupport = new THREE.Mesh(supportGeometry, metalMaterial);
  leftSupport.position.set(-0.1, 0.25, 0.75); // Relative to lid group (moved forward and up)
  lidGroup.add(leftSupport);
  
  // Right handle support
  const rightSupport = new THREE.Mesh(supportGeometry, metalMaterial);
  rightSupport.position.set(0.1, 0.25, 0.75); // Relative to lid group (moved forward and up)
  lidGroup.add(rightSupport);
  
  // Decorative studs on the lid
  const studGeometry = new THREE.SphereGeometry(0.02, 6, 4);
  
  // Add studs in a pattern on the lid
  for (let x = -0.4; x <= 0.4; x += 0.2) {
    for (let z = -0.3; z <= 0.3; z += 0.2) {
      const stud = new THREE.Mesh(studGeometry, goldMaterial);
      stud.position.set(x, 0.21, z + 0.4); // Relative to lid group (moved forward)
      lidGroup.add(stud);
    }
  }
  
  // Position and rotate the entire chest
  chest.position.copy(position);
  chest.rotation.y = rotation;
  
  // Store reference to lid group for animation
  chest.lidGroup = lidGroup;
  
  // Add shadows
  chest.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
  // Mark as interactable
  chest.isInteractable = true;
  chest.interactType = 'searchable';
  
  // Update function for smooth opening animation
  chest.update = function(delta) {
    const angleDelta = this.targetOpenAngle - this.openAngle;
    const maxStep = this.openSpeed * delta;
    
    if (Math.abs(angleDelta) > maxStep) {
      this.openAngle += Math.sign(angleDelta) * maxStep;
    } else {
      this.openAngle = this.targetOpenAngle;
    }
    
    // Apply rotation to lid group
    this.lidGroup.rotation.x = this.openAngle;
  };
  
  // Toggle open/close
  chest.toggle = function() {
    this.isOpen = !this.isOpen;
    this.targetOpenAngle = this.isOpen ? -Math.PI / 3 : 0; // Open 60 degrees
  };
  
  return chest;
} 