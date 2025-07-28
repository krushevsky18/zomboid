// assets/dummy.js - Static player character for reference

// SCALE FACTOR for 1.8m total height
const HEIGHT_SCALE = 0.9683;

export function createDummyCharacter() {
  // Create a sophisticated humanoid character (identical to player.js)
  const character = new THREE.Group();
  
  // Create wireframe capsule for traversal visualization
  const capsuleGeometry = new THREE.CylinderGeometry(0.3, 0.3, 1.2, 8, 1); // radiusTop, radiusBottom, height, radialSegments, heightSegments
  const capsuleMaterial = new THREE.MeshBasicMaterial({ 
    color: 0x00ff00, // Green wireframe
    wireframe: true,
    transparent: true,
    opacity: 0.7
  });
  const wireframeCapsule = new THREE.Mesh(capsuleGeometry, capsuleMaterial);
  wireframeCapsule.position.set(0, 0.6, 0); // Center of capsule at hip level (relative to character)
  character.add(wireframeCapsule);
  
  // Store reference to wireframe capsule for updating
  character.wireframeCapsule = wireframeCapsule;
  
  // Add blue arrow pointing down to visualize raycast
  const raycastArrowDir = new THREE.Vector3(0, -1, 0); // Point straight down
  const raycastArrowLength = 5.0; // Long enough to reach ground
  const raycastArrowColor = 0x0000ff; // Blue color
  const raycastArrowHelper = new THREE.ArrowHelper(raycastArrowDir, new THREE.Vector3(0, 0, 0), raycastArrowLength, raycastArrowColor, 0.2, 0.1);
  raycastArrowHelper.position.set(0, 0, 0); // Center of capsule (relative to character)
  character.add(raycastArrowHelper);
  
  // Store reference to raycast arrow for updating
  character.raycastArrow = raycastArrowHelper;
  
  // Materials
  const skinMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xfdbcb4, // Skin tone
    roughness: 0.9,
    metalness: 0.0
  });
  
  const shirtMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x4a90e2, // Blue shirt
    roughness: 0.8,
    metalness: 0.1
  });
  
  const pantsMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x2c3e50, // Dark pants
    roughness: 0.9,
    metalness: 0.0
  });
  
  const shoeMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x1a1a1a, // Black shoes
    roughness: 0.7,
    metalness: 0.0
  });
  
  // Create upper body group that will rotate as a unit around hip hinge
  const upperBody = new THREE.Group();
  upperBody.position.y = 0.82 * HEIGHT_SCALE; // Position at hip level (hinge point)
  upperBody.name = 'upperBody';
  
  // Head - oval shape (scaled sphere)
  const headGeometry = new THREE.SphereGeometry(0.22, 12, 8);
  const head = new THREE.Mesh(headGeometry, skinMaterial);
  head.scale.set(0.8, 1.2, 0.8); // Make it oval: taller and narrower
  const headOffset = 0.264 * HEIGHT_SCALE;
  head.position.y = headOffset;
  // Create a headPivot group at the top of the neck
  const headPivot = new THREE.Group();
  const headPivotY = 0.775 * HEIGHT_SCALE;
  headPivot.position.y = headPivotY;
  headPivot.name = 'headPivot';
  headPivot.add(head);
  upperBody.add(headPivot);
  
  // Neck - connecting head to body
  const neckGeometry = new THREE.CylinderGeometry(0.08, 0.12, 0.15, 8);
  const neck = new THREE.Mesh(neckGeometry, skinMaterial);
  neck.scale.y = HEIGHT_SCALE;
  neck.position.y = 0.70 * HEIGHT_SCALE;
  upperBody.add(neck);
  
  // Torso - smaller diameter for better proportions
  const torsoGeometry = new THREE.CylinderGeometry(0.22, 0.25, 0.6, 12);
  const torso = new THREE.Mesh(torsoGeometry, shirtMaterial);
  torso.scale.y = HEIGHT_SCALE;
  torso.position.y = 0.35 * HEIGHT_SCALE;
  upperBody.add(torso);
  
  // Shoulders - brought in closer to smaller torso
  const leftShoulderGeometry = new THREE.SphereGeometry(0.1, 8, 6);
  const leftShoulder = new THREE.Mesh(leftShoulderGeometry, shirtMaterial);
  leftShoulder.position.set(-0.32, 0.55 * HEIGHT_SCALE, 0); // Brought in from -0.35
  upperBody.add(leftShoulder);
  
  const rightShoulderGeometry = new THREE.SphereGeometry(0.1, 8, 6);
  const rightShoulder = new THREE.Mesh(rightShoulderGeometry, shirtMaterial);
  rightShoulder.position.set(0.32, 0.55 * HEIGHT_SCALE, 0); // Brought in from 0.35
  upperBody.add(rightShoulder);
  
  // Arms - more detailed with joints (normalized from ground level)
  const upperArmGeometry = new THREE.CylinderGeometry(0.07, 0.08, 0.25, 8);
  const lowerArmGeometry = new THREE.CylinderGeometry(0.06, 0.07, 0.25, 8);
  
  // Left arm
  const leftUpperArm = new THREE.Mesh(upperArmGeometry, shirtMaterial);
  leftUpperArm.position.set(-0.32, 0.32 * HEIGHT_SCALE, 0); // Adjusted to match new shoulder position
  leftUpperArm.rotation.z = 0; // Straight arm
  leftUpperArm.name = 'left_upper_arm';
  upperBody.add(leftUpperArm);
  
  const leftElbowGeometry = new THREE.SphereGeometry(0.08, 6, 4);
  const leftElbow = new THREE.Mesh(leftElbowGeometry, skinMaterial);
  leftElbow.position.set(-0.32, 0.12 * HEIGHT_SCALE, 0); // Adjusted to match new shoulder position
  leftElbow.name = 'left_elbow';
  upperBody.add(leftElbow);
  
  const leftLowerArm = new THREE.Mesh(lowerArmGeometry, skinMaterial);
  leftLowerArm.position.set(-0.32, -0.08 * HEIGHT_SCALE, 0); // Adjusted to match new shoulder position
  leftLowerArm.rotation.z = 0; // Straight arm
  leftLowerArm.name = 'left_lower_arm';
  upperBody.add(leftLowerArm);
  
  // Right arm
  const rightUpperArm = new THREE.Mesh(upperArmGeometry, shirtMaterial);
  rightUpperArm.position.set(0.32, 0.32 * HEIGHT_SCALE, 0); // Adjusted to match new shoulder position
  rightUpperArm.rotation.z = 0; // Straight arm
  rightUpperArm.name = 'right_upper_arm';
  upperBody.add(rightUpperArm);
  
  const rightElbowGeometry = new THREE.SphereGeometry(0.08, 6, 4);
  const rightElbow = new THREE.Mesh(rightElbowGeometry, skinMaterial);
  rightElbow.position.set(0.32, 0.12 * HEIGHT_SCALE, 0); // Adjusted to match new shoulder position
  rightElbow.name = 'right_elbow';
  upperBody.add(rightElbow);
  
  const rightLowerArm = new THREE.Mesh(lowerArmGeometry, skinMaterial);
  rightLowerArm.position.set(0.32, -0.08 * HEIGHT_SCALE, 0); // Adjusted to match new shoulder position
  rightLowerArm.rotation.z = 0; // Straight arm
  rightLowerArm.name = 'right_lower_arm';
  upperBody.add(rightLowerArm);
  
  // Hands
  const handGeometry = new THREE.SphereGeometry(0.06, 8, 6);
  const leftHand = new THREE.Mesh(handGeometry, skinMaterial);
  leftHand.position.set(-0.32, -0.25 * HEIGHT_SCALE, 0); // Adjusted to match new shoulder position
  leftHand.name = 'left_hand';
  upperBody.add(leftHand);
  
  const rightHand = new THREE.Mesh(handGeometry, skinMaterial);
  rightHand.position.set(0.32, -0.25 * HEIGHT_SCALE, 0); // Adjusted to match new shoulder position
  rightHand.name = 'right_hand';
  upperBody.add(rightHand);
  
  // Hips - connecting torso to legs (top diameter matches bottom of torso: 0.22)
  const hipGeometry = new THREE.CylinderGeometry(0.22, 0.25, 0.15, 10);
  const hips = new THREE.Mesh(hipGeometry, pantsMaterial);
  hips.position.y = 0.82 * HEIGHT_SCALE;
  hips.name = 'hips';
  character.add(hips);
  
  // Legs - more detailed with joints
  const upperLegGeometry = new THREE.CylinderGeometry(0.11, 0.12, 0.45, 8);
  // Lower leg: top = 0.11, bottom = 0.07 (smaller at ankle)
  const lowerLegGeometry = new THREE.CylinderGeometry(0.11, 0.07, 0.45, 8);
  
  // Left leg
  const leftUpperLeg = new THREE.Mesh(upperLegGeometry, pantsMaterial);
  leftUpperLeg.position.set(-0.12, 0.57, 0);
  leftUpperLeg.name = 'left_upper_leg';
  character.add(leftUpperLeg);
  
  const leftKneeGeometry = new THREE.SphereGeometry(0.11, 6, 4);
  const leftKnee = new THREE.Mesh(leftKneeGeometry, pantsMaterial);
  leftKnee.position.set(-0.12, 0.34, 0);
  leftKnee.name = 'left_knee';
  character.add(leftKnee);
  
  const leftLowerLeg = new THREE.Mesh(lowerLegGeometry, pantsMaterial);
  leftLowerLeg.position.set(-0.12, 0.11, 0);
  leftLowerLeg.name = 'left_lower_leg';
  leftLowerLeg.rotation.x = 0; // Ensure foot will be flat by default
  character.add(leftLowerLeg);
  
  // Right leg
  const rightUpperLeg = new THREE.Mesh(upperLegGeometry, pantsMaterial);
  rightUpperLeg.position.set(0.12, 0.57, 0);
  rightUpperLeg.name = 'right_upper_leg';
  character.add(rightUpperLeg);
  
  const rightKneeGeometry = new THREE.SphereGeometry(0.11, 6, 4);
  const rightKnee = new THREE.Mesh(rightKneeGeometry, pantsMaterial);
  rightKnee.position.set(0.12, 0.34, 0);
  rightKnee.name = 'right_knee';
  character.add(rightKnee);
  
  const rightLowerLeg = new THREE.Mesh(lowerLegGeometry, pantsMaterial);
  rightLowerLeg.position.set(0.12, 0.11, 0);
  rightLowerLeg.name = 'right_lower_leg';
  rightLowerLeg.rotation.x = 0;
  character.add(rightLowerLeg);
  
  // Feet
  const footGeometry = new THREE.BoxGeometry(0.08, 0.06, 0.25);
  const leftFoot = new THREE.Mesh(footGeometry, shoeMaterial);
  leftFoot.position.set(-0.12, 0.06, -0.05); // Offset by +0.03 so bottom sits at y=0
  leftFoot.name = 'left_foot';
  leftFoot.rotation.x = 0; // Always flat on ground
  character.add(leftFoot);
  
  const rightFoot = new THREE.Mesh(footGeometry, shoeMaterial);
  rightFoot.position.set(0.12, 0.06, -0.05); // Offset by +0.03 so bottom sits at y=0
  rightFoot.name = 'right_foot';
  rightFoot.rotation.x = 0;
  character.add(rightFoot);
  
  // Add a forward direction indicator (larger, more visible arrow)
  const arrowDir = new THREE.Vector3(0, 0, -1); // Point backward so it's visible from front
  const arrowLength = 1.0; // Longer arrow
  const arrowColor = 0x00ff00;
  const arrowHelper = new THREE.ArrowHelper(arrowDir, new THREE.Vector3(0, 0, 0), arrowLength, arrowColor, 0.2, 0.1);
  arrowHelper.position.set(0, 0.33, -0.3); // Position relative to upper body group (1.15 - 0.82)
  upperBody.add(arrowHelper);
  
  // Add a red vertical arrow from the hips
  const hipArrowDir = new THREE.Vector3(0, 1, 0); // Point upward
  const hipArrowLength = 2.0; // Much taller arrow for hip indicator
  const hipArrowColor = 0xff0000; // Red color
  const hipArrowHelper = new THREE.ArrowHelper(hipArrowDir, new THREE.Vector3(0, 0, 0), hipArrowLength, hipArrowColor, 0.15, 0.08);
  hipArrowHelper.position.set(0, 0.82, 0); // Position at hip level (hinge point)
  character.add(hipArrowHelper);
  
  // Add the upper body group to the character
  character.add(upperBody);
  
  // Add shadows
  character.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
  
  return character;
} 