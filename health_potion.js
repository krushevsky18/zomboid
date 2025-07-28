import * as THREE from 'https://unpkg.com/three@0.153.0/build/three.module.js';

export function createHealthPotion(position = new THREE.Vector3(0, 0, 0)) {
  const potionGroup = new THREE.Group();
  
  // Materials
  const glassMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x4a90e2, // Blue glass
    roughness: 0.1,
    metalness: 0.0,
    transparent: true,
    opacity: 0.7
  });
  
  const liquidMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xff6b6b, // Red liquid
    roughness: 0.3,
    metalness: 0.0,
    transparent: true,
    opacity: 0.8
  });
  
  const corkMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x8b4513, // Brown cork
    roughness: 0.9,
    metalness: 0.0
  });
  
  const labelMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xf5f5dc, // Beige label
    roughness: 0.8,
    metalness: 0.0
  });
  
  // Bottle body - tall cylindrical shape
  const bottleGeometry = new THREE.CylinderGeometry(0.08, 0.06, 0.3, 12);
  const bottle = new THREE.Mesh(bottleGeometry, glassMaterial);
  bottle.position.y = 0.15;
  potionGroup.add(bottle);
  
  // Bottle neck - thinner cylinder
  const neckGeometry = new THREE.CylinderGeometry(0.04, 0.08, 0.08, 8);
  const neck = new THREE.Mesh(neckGeometry, glassMaterial);
  neck.position.y = 0.34;
  potionGroup.add(neck);
  
  // Liquid inside bottle - slightly smaller than bottle
  const liquidGeometry = new THREE.CylinderGeometry(0.075, 0.055, 0.28, 12);
  const liquid = new THREE.Mesh(liquidGeometry, liquidMaterial);
  liquid.position.y = 0.14;
  potionGroup.add(liquid);
  
  // Cork stopper
  const corkGeometry = new THREE.CylinderGeometry(0.045, 0.045, 0.06, 8);
  const cork = new THREE.Mesh(corkGeometry, corkMaterial);
  cork.position.y = 0.41;
  potionGroup.add(cork);
  
  // Label on bottle
  const labelGeometry = new THREE.CylinderGeometry(0.081, 0.061, 0.12, 12);
  const label = new THREE.Mesh(labelGeometry, labelMaterial);
  label.position.y = 0.18;
  // Cut out the back of the label to make it wrap around
  label.geometry = labelGeometry;
  potionGroup.add(label);
  
  // Add a small cross symbol on the label (health symbol)
  const crossGeometry = new THREE.BoxGeometry(0.02, 0.04, 0.001);
  const crossVertical = new THREE.Mesh(crossGeometry, new THREE.MeshStandardMaterial({ color: 0xff0000 }));
  crossVertical.position.set(0, 0.18, 0.082);
  potionGroup.add(crossVertical);
  
  const crossHorizontal = new THREE.Mesh(crossGeometry, new THREE.MeshStandardMaterial({ color: 0xff0000 }));
  crossHorizontal.rotation.z = Math.PI / 2;
  crossHorizontal.position.set(0, 0.18, 0.082);
  potionGroup.add(crossHorizontal);
  
  // Add some bubbles in the liquid
  for (let i = 0; i < 5; i++) {
    const bubbleGeometry = new THREE.SphereGeometry(0.005 + Math.random() * 0.005, 6, 4);
    const bubble = new THREE.Mesh(bubbleGeometry, new THREE.MeshStandardMaterial({ 
      color: 0xffffff, 
      transparent: true, 
      opacity: 0.6 
    }));
    bubble.position.set(
      (Math.random() - 0.5) * 0.1,
      0.1 + Math.random() * 0.2,
      (Math.random() - 0.5) * 0.1
    );
    potionGroup.add(bubble);
  }
  
  // Position the potion
  potionGroup.position.copy(position);
  
  // Add shadows
  potionGroup.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
  
  // Make it interactable
  potionGroup.isInteractable = true;
  potionGroup.interactType = 'equipable';
  
  return potionGroup;
} 