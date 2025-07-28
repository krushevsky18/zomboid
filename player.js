import * as THREE from 'https://unpkg.com/three@0.153.0/build/three.module.js';

// SCALE FACTOR for 1.8m total height
const HEIGHT_SCALE = 0.9683;

export function Player(camera, staminaBar) {
  this.camera = camera;
  this.staminaBar = staminaBar;
  this._playerPosition = new THREE.Vector3(0, 0, 20); // Will be set to correct height after map is available
  this.playerBody = null; // Reference to the player body mesh
  this.dummyCharacter = null; // Reference to the dummy character for mirroring movements
  this.velocity = new THREE.Vector3();
  this.direction = new THREE.Vector3();
  this.speed = 1.4; // average human walking speed in m/s
  this.sprintSpeed = 10.0; // average human sprint speed in m/s
  this.crouchSpeed = 1.0; // reasonable crouch speed
  this.currentSprintSpeed = 1.4; // Current sprint speed (starts at walk speed)
  this.sprintAcceleration = 3.0; // m/s^2 - how fast sprint builds up
  this.sprintDeceleration = 5.0; // m/s^2 - how fast sprint decreases
  // Realistic jump physics
  this.desiredJumpHeight = 2; // meters
  this.gravity = -9.81; // m/s^2
  this.jumpStrength = Math.sqrt(2 * -this.gravity * this.desiredJumpHeight); // physics formula
  console.log('Jump strength calculated:', this.jumpStrength, 'for height:', this.desiredJumpHeight, 'm');
  this.isCrouching = false;
  this.isSprinting = false;
  this.isJumping = false;
  this.jumpKeyHeld = false;
  this.lastJumpPressed = false;
  this.lastCrouchPressed = false;
  this.pitch = 0;
  this.yaw = 0; // Start facing away from the origin (positive Z direction)
  this.torsoYaw = 0; // Independent torso rotation
  this.legYaw = 0; // Leg rotation (follows torso when threshold exceeded)
  this.torsoTurnThreshold = Math.PI / 2; // 90 degrees threshold
  this.torsoTurnSpeed = 3.0; // radians per second for torso turning
  this.stamina = 1.0; // 1.0 = 100%
  this.staminaRegen = 0.2; // per second
  this.staminaDrain = 0.2; // per second
  this.height = 1.8; // standing eye height in meters
  this.standingEyeHeight = 1.8;
  this.standingHeadOffset = 1.65;
  this.standingHipHeight = 0.82;
  this.legSegmentLength = 0.45;
  this.halfLegLength = 0.225;
  this.currentHipHeight = this.standingHipHeight;
  this.currentHeadOffset = this.standingHeadOffset;
  this.currentReduction = 0;
  this.standingUpperLegCenterY = 0.57;
  this.lean = 0;
  this.leanTarget = 0;
  this.leanAmount = 0.5;
  this.grounded = true;
  this.maxLeanAngle = Math.PI / 6; // 30 degrees
  this.maxLean = 1; // normalized lean target
  this.leanSpeed = 1; // in normalized units per second (1 to max in 2 seconds)
  
  // Realistic crouch properties
  this.crouchForwardLean = 0; // Forward lean during crouch
  this.crouchForwardLeanTarget = 0;
  this.crouchForwardLeanSpeed = 3; // radians per second
  this.maxCrouchForwardLean = Math.PI / 12; // 15 degrees forward lean
  this.legBendAngle = 0; // Knee bend angle
  this.legBendTarget = 0;
  this.legBendSpeed = 5; // radians per second
  this.maxLegBendAngle = Math.PI / 3; // 60 degrees knee bend
  
  // Walking animation properties
  this.walkCycle = 0;
  this.walkFrequency = 4; // cycles per second at base speed
  this.thighAmp = Math.PI / 6; // thigh swing amplitude
  this.kneeAmp = Math.PI / 4; // knee bend amplitude for walking
  this.armAmp = Math.PI / 6; // arm swing amplitude
  this.elbowAmpBack = Math.PI * 70 / 180; // elbow bend for back swing (70 degrees for 110 angle)
  this.elbowAmpForward = Math.PI * 20 / 180; // elbow bend for forward swing (20 degrees for 160 angle)
  this.leftUpperLegRot = 0;
  this.leftLowerLegRot = 0;
  this.rightUpperLegRot = 0;
  this.rightLowerLegRot = 0;
  this.leftUpperArmRot = 0;
  this.leftLowerArmRot = 0;
  this.rightUpperArmRot = 0;
  this.rightLowerArmRot = 0;
  
  // Arm dimensions
  this.upperArmLength = 0.25;
  this.lowerArmLength = 0.25;
  this.halfUpperArm = 0.125;
  this.halfLowerArm = 0.125;
  this.shoulderY = 0.55;
  this.jumpVelocity = new THREE.Vector3(); // Store velocity at jump
  
  // Helper function to update upper leg position
  this.updateUpperLegPosition = function(child) {
    let angle;
    if (child.name === 'left_upper_leg') {
      angle = this.leftUpperLegRot;
    } else if (child.name === 'right_upper_leg') {
      angle = this.rightUpperLegRot;
    } else {
      return;
    }
    const half = this.halfLegLength;
    child.position.y = this.currentHipHeight - half * Math.cos(angle);
    child.position.z = - half * Math.sin(angle);
  };

  // Helper function to update knee position
  this.updateKneePosition = function(child) {
    let angle;
    if (child.name === 'left_knee') {
      angle = this.leftUpperLegRot;
    } else if (child.name === 'right_knee') {
      angle = this.rightUpperLegRot;
    } else {
      return;
    }
    const length = this.legSegmentLength;
    child.position.y = this.currentHipHeight - length * Math.cos(angle);
    child.position.z = - length * Math.sin(angle);
  };

  // Helper function to update lower leg position
  this.updateLowerLegPosition = function(child) {
    let angleUpper, angleLower;
    if (child.name === 'left_lower_leg') {
      angleUpper = this.leftUpperLegRot;
      angleLower = this.leftLowerLegRot;
    } else if (child.name === 'right_lower_leg') {
      angleUpper = this.rightUpperLegRot;
      angleLower = this.rightLowerLegRot;
    } else {
      return;
    }
    const half = this.halfLegLength;
    const kneeY = this.currentHipHeight - this.legSegmentLength * Math.cos(angleUpper);
    const kneeZ = - this.legSegmentLength * Math.sin(angleUpper);
    child.position.y = kneeY - half * Math.cos(angleLower);
    child.position.z = kneeZ - half * Math.sin(angleLower);
  };

  // Helper function to update foot position
  this.updateFootPosition = function(child) {
    let angleUpper, angleLower, kneeY, kneeZ, lowerY, lowerZ, endY, endZ;
    const half = this.halfLegLength;
    if (child.name === 'left_foot') {
      angleUpper = this.leftUpperLegRot;
      angleLower = this.leftLowerLegRot;
    } else if (child.name === 'right_foot') {
      angleUpper = this.rightUpperLegRot;
      angleLower = this.rightLowerLegRot;
    } else {
      return;
    }
    kneeY = this.currentHipHeight - this.legSegmentLength * Math.cos(angleUpper);
    kneeZ = - this.legSegmentLength * Math.sin(angleUpper);
    lowerY = kneeY - half * Math.cos(angleLower);
    lowerZ = kneeZ - half * Math.sin(angleLower);
    endY = lowerY - half * Math.cos(angleLower);
    endZ = lowerZ - half * Math.sin(angleLower);
    child.position.y = endY + 0.03; // Offset by half foot height so bottom sits at y=0
    child.position.z = endZ;
  };

  // Helper function to update upper arm position
  this.updateUpperArmPosition = function(child) {
    let angle, xSign = 1;
    if (child.name === 'left_upper_arm') {
      angle = this.leftUpperArmRot;
      xSign = -1;
    } else if (child.name === 'right_upper_arm') {
      angle = this.rightUpperArmRot;
    } else {
      return;
    }
    const half = this.halfUpperArm;
    child.position.y = this.shoulderY - half * Math.cos(angle);
    child.position.z = - half * Math.sin(angle);
  };

  // Helper function to update elbow position
  this.updateElbowPosition = function(child) {
    let angle, xSign = 1;
    if (child.name === 'left_elbow') {
      angle = this.leftUpperArmRot;
      xSign = -1;
    } else if (child.name === 'right_elbow') {
      angle = this.rightUpperArmRot;
    } else {
      return;
    }
    const length = this.upperArmLength;
    child.position.y = this.shoulderY - length * Math.cos(angle);
    child.position.z = - length * Math.sin(angle);
  };

  // Helper function to update lower arm position
  this.updateLowerArmPosition = function(child) {
    let angleUpper, angleLower, xSign = 1;
    if (child.name === 'left_lower_arm') {
      angleUpper = this.leftUpperArmRot;
      angleLower = this.leftLowerArmRot;
      xSign = -1;
    } else if (child.name === 'right_lower_arm') {
      angleUpper = this.rightUpperArmRot;
      angleLower = this.rightLowerArmRot;
    } else {
      return;
    }
    const half = this.halfLowerArm;
    const elbowY = this.shoulderY - this.upperArmLength * Math.cos(angleUpper);
    const elbowZ = - this.upperArmLength * Math.sin(angleUpper);
    child.position.y = elbowY - half * Math.cos(angleLower);
    child.position.z = elbowZ - half * Math.sin(angleLower);
  };

  // Helper function to update hand position
  this.updateHandPosition = function(child) {
    let angleUpper, angleLower, elbowY, elbowZ, lowerY, lowerZ, endY, endZ, xSign = 1;
    if (child.name === 'left_hand') {
      angleUpper = this.leftUpperArmRot;
      angleLower = this.leftLowerArmRot;
      xSign = -1;
    } else if (child.name === 'right_hand') {
      angleUpper = this.rightUpperArmRot;
      angleLower = this.rightLowerArmRot;
    } else {
      return;
    }
    elbowY = this.shoulderY - this.upperArmLength * Math.cos(angleUpper);
    elbowZ = - this.upperArmLength * Math.sin(angleUpper);
    lowerY = elbowY - this.halfLowerArm * Math.cos(angleLower);
    lowerZ = elbowZ - this.halfLowerArm * Math.sin(angleLower);
    endY = lowerY - this.halfLowerArm * Math.cos(angleLower);
    endZ = lowerZ - this.halfLowerArm * Math.sin(angleLower);
    child.position.y = endY;
    child.position.z = endZ;
  };

  this.updateStaminaBar = function() {
    if (this.staminaBar) {
      this.staminaBar.style.width = (this.stamina * 100) + '%';
    }
  };

  this.handleInput = function(keys) {
    // Debug all keys being pressed
    const jumpKeys = ['Space', 'Numpad0'];
    const pressedJumpKeys = jumpKeys.filter(key => keys[key]);
    if (pressedJumpKeys.length > 0) {
      console.log('Jump keys pressed:', pressedJumpKeys);
    }
    
    // Only set direction if movement keys are pressed
    let x = 0, z = 0;
    if (keys['KeyW'] || keys['ArrowUp']) z -= 1;
    if (keys['KeyS'] || keys['ArrowDown']) z += 1;
    if (keys['KeyA'] || keys['ArrowLeft']) x -= 1;
    if (keys['KeyD'] || keys['ArrowRight']) x += 1;
    if (x !== 0 || z !== 0) {
      this.direction.set(x, 0, z).normalize();
    } else {
      this.direction.set(0, 0, 0);
    }

    // Sprint
    this.isSprinting = (keys['ShiftLeft'] || keys['ShiftRight']) && this.stamina > 0 && !this.isCrouching && (x !== 0 || z !== 0);
    // Crouch toggle
    const crouchPressed = keys['KeyC'];
    if (crouchPressed && !this.lastCrouchPressed) {
      this.isCrouching = !this.isCrouching;
    }
    this.lastCrouchPressed = crouchPressed;
    // Jump
    const jumpPressed = keys['Space'] || keys['Numpad0'];
    
    // Debug jump state every frame
    if (jumpPressed || this.lastJumpPressed || this.isJumping) {
      console.log('Jump debug - Pressed:', jumpPressed, 'LastPressed:', this.lastJumpPressed, 'IsJumping:', this.isJumping, 'Grounded:', this.grounded, 'Velocity Y:', this.velocity.y);
    }
    
    // Only trigger jump on key release
    if (!jumpPressed && this.lastJumpPressed && this.grounded && !this.isJumping) {
      this.velocity.y = this.jumpStrength;
      this.isJumping = true;
      this.grounded = false;
      this.jumpKeyHeld = false;
      console.log('Jump triggered! Velocity:', this.velocity.y, 'Grounded:', this.grounded, 'IsJumping:', this.isJumping);
    }
    this.lastJumpPressed = jumpPressed;
    
    // Debug jump state
    if (jumpPressed && !this.lastJumpPressed) {
      console.log('Jump key pressed - Grounded:', this.grounded, 'IsJumping:', this.isJumping, 'Velocity Y:', this.velocity.y);
    }
    
    // Variable jump height: if jump is released early, cut velocity (no-op now, but keep for future)
    if (!jumpPressed) this.jumpKeyHeld = false;
    // Lean (Q right, E left)
    if (keys['KeyQ']) this.leanTarget = -1; // Right (negative for correct direction)
    else if (keys['KeyE']) this.leanTarget = 1; // Left (positive for correct direction)
    else this.leanTarget = 0;
  };

  this.update = function(delta) {
    // Clamp delta for safety, and convert to seconds
    delta = Math.max(0.01, Math.min(delta, 0.1));

    // If movement is prevented (e.g., inventory is open), stop all movement
    if (this.preventMovement) {
      this.direction.set(0, 0, 0);
      this.jumpVelocity.set(0, 0, 0);
      // Don't reset jump state - let gravity and physics continue
      // Only prevent horizontal movement
      this.isSprinting = false;
    }

    // Stamina and speed
    let moveSpeed = this.speed;
    if (this.isSprinting) {
      // Gradually build up sprint speed
      this.currentSprintSpeed += this.sprintAcceleration * delta;
      if (this.currentSprintSpeed > this.sprintSpeed) {
        this.currentSprintSpeed = this.sprintSpeed;
      }
      moveSpeed = this.currentSprintSpeed;
      this.stamina -= this.staminaDrain * delta;
      if (this.stamina < 0) this.stamina = 0;
    } else {
      // Gradually decrease sprint speed when not sprinting
      this.currentSprintSpeed -= this.sprintDeceleration * delta;
      if (this.currentSprintSpeed < this.speed) {
        this.currentSprintSpeed = this.speed;
      }
      if (this.isCrouching) {
        moveSpeed = this.crouchSpeed;
      } else {
        moveSpeed = this.currentSprintSpeed;
        this.stamina += this.staminaRegen * delta;
        if (this.stamina > 1) this.stamina = 1;
      }
    }
    this.updateStaminaBar();

    // Handle torso and leg rotation
    const yawDelta = this.yaw - this.torsoYaw;
    const yawDeltaAbs = Math.abs(yawDelta);
    
    // Normalize angle difference to [-π, π]
    let normalizedYawDelta = yawDelta;
    while (normalizedYawDelta > Math.PI) normalizedYawDelta -= 2 * Math.PI;
    while (normalizedYawDelta < -Math.PI) normalizedYawDelta += 2 * Math.PI;
    
    // Turn torso towards camera yaw
    const maxTorsoTurn = this.torsoTurnSpeed * delta;
    if (Math.abs(normalizedYawDelta) > maxTorsoTurn) {
      this.torsoYaw += Math.sign(normalizedYawDelta) * maxTorsoTurn;
    } else {
      this.torsoYaw = this.yaw;
    }
    
    // Check if torso has turned more than 90 degrees from legs
    const torsoLegDelta = Math.abs(this.torsoYaw - this.legYaw);
    let normalizedTorsoLegDelta = torsoLegDelta;
    while (normalizedTorsoLegDelta > Math.PI) normalizedTorsoLegDelta -= 2 * Math.PI;
    
    if (normalizedTorsoLegDelta > this.torsoTurnThreshold) {
      // Legs snap to torso direction
      this.legYaw = this.torsoYaw;
    }

    // Calculate intended movement direction (for grounded only)
    let intendedMove = new THREE.Vector3();
    if (this.direction.lengthSq() > 0) {
      intendedMove.copy(this.direction);
      const yawMatrix = new THREE.Matrix4().makeRotationY(this.yaw);
      intendedMove.applyMatrix4(yawMatrix);
    }

    // Only move if there is input (direction is not zero)
    if (this.grounded) {
      if (intendedMove.lengthSq() > 0) {
        // Set velocity based on intended move direction
        this.jumpVelocity.copy(intendedMove).normalize().multiplyScalar(moveSpeed);
      } else {
        this.jumpVelocity.set(0, 0, 0);
      }
    }
    // Apply velocity (always, even in air)
    this._playerPosition.x += this.jumpVelocity.x * delta;
    this._playerPosition.z += this.jumpVelocity.z * delta;

    // Check slope-based collision before finalizing position
    if (this.checkCollision && this.checkCollision(this.map)) {
      // Collision detected - revert movement
      this._playerPosition.x -= this.jumpVelocity.x * delta;
      this._playerPosition.z -= this.jumpVelocity.z * delta;
    }

    // Update leg direction to gradually follow torso, never snap
    // --- Helper for shortest angle difference ---
    function shortestAngleDiff(a, b) {
      let diff = a - b;
      while (diff > Math.PI) diff -= 2 * Math.PI;
      while (diff < -Math.PI) diff += 2 * Math.PI;
      return diff;
    }
    // --- End helper ---

    // Update leg direction to gradually follow torso, never snap
    // Normalize both angles first to ensure consistent calculations
    let normalizedTorsoYaw = this.torsoYaw;
    let normalizedLegYaw = this.legYaw;
    while (normalizedTorsoYaw > Math.PI) normalizedTorsoYaw -= 2 * Math.PI;
    while (normalizedTorsoYaw < -Math.PI) normalizedTorsoYaw += 2 * Math.PI;
    while (normalizedLegYaw > Math.PI) normalizedLegYaw -= 2 * Math.PI;
    while (normalizedLegYaw < -Math.PI) normalizedLegYaw += 2 * Math.PI;
    
    let torsoTwist = shortestAngleDiff(normalizedTorsoYaw, normalizedLegYaw);
    const maxLegTurn = this.torsoTurnSpeed * delta;
    let targetLegYaw = normalizedLegYaw;
    
    // Calculate target leg yaw to maintain ±90° threshold
    if (torsoTwist > this.torsoTurnThreshold) {
      targetLegYaw = normalizedTorsoYaw - this.torsoTurnThreshold;
    } else if (torsoTwist < -this.torsoTurnThreshold) {
      targetLegYaw = normalizedTorsoYaw + this.torsoTurnThreshold;
    } else {
      // Within threshold, legs stay where they are
      targetLegYaw = normalizedLegYaw;
    }
    
    // Snap legs to torso if moving forward (W)
    if ((this.direction.z < 0 || this.direction.y < 0) && this.direction.lengthSq() > 0) {
      targetLegYaw = normalizedTorsoYaw;
    }
    
    // Move legYaw toward targetLegYaw by at most maxLegTurn, always shortest path
    let legTurn = shortestAngleDiff(targetLegYaw, normalizedLegYaw);
    if (Math.abs(legTurn) > maxLegTurn) {
      normalizedLegYaw += Math.sign(legTurn) * maxLegTurn;
    } else {
      normalizedLegYaw = targetLegYaw;
    }
    // Update the actual legYaw with the normalized value
    this.legYaw = normalizedLegYaw;

    // Realistic crouch mechanics - feet stay on ground, legs bend at knees
    if (this.isCrouching) {
      // Set crouch targets
      this.crouchForwardLeanTarget = this.maxCrouchForwardLean;
      this.legBendTarget = this.maxLegBendAngle;
    } else {
      // Return to standing
      this.crouchForwardLeanTarget = 0;
      this.legBendTarget = 0;
    }
    
    // Smooth crouch forward lean interpolation
    const crouchLeanDelta = this.crouchForwardLeanTarget - this.crouchForwardLean;
    const maxCrouchLeanStep = this.crouchForwardLeanSpeed * delta;
    if (Math.abs(crouchLeanDelta) > maxCrouchLeanStep) {
      this.crouchForwardLean += Math.sign(crouchLeanDelta) * maxCrouchLeanStep;
    } else {
      this.crouchForwardLean = this.crouchForwardLeanTarget;
    }
    
    // Smooth leg bend interpolation
    const legBendDelta = this.legBendTarget - this.legBendAngle;
    const maxLegBendStep = this.legBendSpeed * delta;
    if (Math.abs(legBendDelta) > maxLegBendStep) {
      this.legBendAngle += Math.sign(legBendDelta) * maxLegBendStep;
    } else {
      this.legBendAngle = this.legBendTarget;
    }

    // Walking animation
    const isWalking = this.direction.lengthSq() > 0 && this.grounded && !this.isJumping;
    if (isWalking) {
      this.walkCycle += delta * moveSpeed * this.walkFrequency;
    } else {
      this.walkCycle = 0;
    }

    const sinLeft = Math.sin(this.walkCycle);
    const sinRight = Math.sin(this.walkCycle + Math.PI);

    const baseThigh = this.legBendAngle;
    const baseKnee = this.legBendAngle;

    this.leftUpperLegRot = baseThigh + sinLeft * this.thighAmp;
    this.leftLowerLegRot = -baseThigh - sinLeft * this.thighAmp - Math.max(0, -sinLeft) * this.kneeAmp;

    this.rightUpperLegRot = baseThigh + sinRight * this.thighAmp;
    this.rightLowerLegRot = -baseThigh - sinRight * this.thighAmp - Math.max(0, -sinRight) * this.kneeAmp;

    // Clamp knee angles to prevent backwards bending
    this.leftLowerLegRot = Math.min(0, this.leftLowerLegRot);
    this.rightLowerLegRot = Math.min(0, this.rightLowerLegRot);

    // Arm rotations - opposite to legs, swapped to correspond with leg movement
    this.leftUpperArmRot = -sinRight * this.armAmp; // Right leg phase for left arm
    this.leftLowerArmRot = Math.max(0, sinRight) * this.elbowAmpBack + Math.max(0, -sinRight) * this.elbowAmpForward;

    this.rightUpperArmRot = -sinLeft * this.armAmp; // Left leg phase for right arm
    this.rightLowerArmRot = Math.max(0, sinLeft) * this.elbowAmpBack + Math.max(0, -sinLeft) * this.elbowAmpForward;

    // Clamp elbow angles to prevent backwards bending
    this.leftLowerArmRot = Math.max(0, this.leftLowerArmRot);
    this.rightLowerArmRot = Math.max(0, this.rightLowerArmRot);

    // Update current hip height and related values
    this.currentHipHeight = this.standingHipHeight * Math.cos(this.legBendAngle);
    this.currentReduction = this.standingHipHeight - this.currentHipHeight;
    this.height = this.standingEyeHeight - this.currentReduction;
    this.currentHeadOffset = this.standingHeadOffset - this.currentReduction;
    
    // Apply gravity only if not grounded
    if (!this.grounded) {
      this.velocity.y += this.gravity * delta;
      console.log('In air - Velocity Y:', this.velocity.y, 'Delta:', delta);
    } else {
      this.velocity.y = 0;
    }
    this._playerPosition.y += this.velocity.y * delta;
    
    // Ground collision check using raycast
    const terrainHeight = this.getTerrainHeight ? this.getTerrainHeight(this.map) : 0;
    const feetY = this._playerPosition.y - this.height;
    
    if (feetY < terrainHeight) {
      // Player's feet are below ground - move them up to ground level
      this._playerPosition.y = terrainHeight + this.height;
      this.grounded = true;
      this.isJumping = false;
      this.velocity.y = 0;
    } else if (feetY === terrainHeight) {
      // Player's feet are exactly at ground level
      this.grounded = true;
      this.isJumping = false;
      this.velocity.y = 0;
    } else {
      // Player's feet are above ground
      this.grounded = false;
    }

    // Smooth lean interpolation (radians/second, frame-rate independent)
    var leanDelta = this.leanTarget - this.lean;
    var maxStep = this.leanSpeed * delta; // normalized units per second
    if (Math.abs(leanDelta) > maxStep) {
      this.lean += Math.sign(leanDelta) * maxStep;
    } else {
      this.lean = this.leanTarget;
    }
    if (Math.abs(this.lean) < 0.01 && this.leanTarget === 0) this.lean = 0;
    if (this.lean < -this.maxLean) this.lean = -this.maxLean;
    if (this.lean > this.maxLean) this.lean = this.maxLean;

    // Camera is now attached to the head, so it moves and rotates with the character
    // The camera's position and orientation are handled automatically by Three.js
    // since it's a child of the head mesh
  };

  // Set player body reference
  this.setPlayerBody = function(bodyMesh) {
    this.playerBody = bodyMesh;
    this.wireframeCapsule = bodyMesh.wireframeCapsule; // Store reference to wireframe capsule
    this.raycastArrow = bodyMesh.raycastArrow; // Store reference to raycast arrow
  };

  // Set dummy character reference
  this.setDummyCharacter = function(dummyMesh) {
    this.dummyCharacter = dummyMesh;
  };

  // Set map reference for terrain height sampling
  this.setMap = function(map) {
    this.map = map;
    // Set initial player position so feet are on the ground
    const terrainHeight = this.getTerrainHeight ? this.getTerrainHeight(this.map) : 0;
    this._playerPosition.y = terrainHeight;
  };

  // Update player body position and rotation
  this.updatePlayerBody = function() {
    if (this.playerBody) {
      // Position the character so feet are on the ground
      this.playerBody.position.x = this._playerPosition.x;
      this.playerBody.position.y = this._playerPosition.y - this.height;
      this.playerBody.position.z = this._playerPosition.z;
      
      // Apply leg rotation to the entire character (lower body)
      this.playerBody.rotation.y = this.legYaw;
      
      // Update wireframe capsule position to follow player
      if (this.wireframeCapsule) {
        // Position relative to character group (which is already positioned at feet level)
        this.wireframeCapsule.position.y = this.height / 2; // Center of capsule relative to character
      }
      
      // Update raycast arrow position to follow player
      if (this.raycastArrow) {
        // Position relative to character group (which is already positioned at feet level)
        this.raycastArrow.position.y = this.height / 2; // Center of capsule relative to character
      }
      
      // Find the upper body group and apply lean, crouch, and independent torso rotation
      this.playerBody.traverse((child) => {
        if (child.name === 'upperBody') {
          child.position.y = this.currentHipHeight;
          child.rotation.z = this.lean * this.maxLeanAngle;
          child.rotation.x = -this.crouchForwardLean; // Forward lean during crouch (negative for correct direction)
          // Apply independent torso rotation (relative to lower body)
          let torsoTwist = this.torsoYaw - this.legYaw;
          // Clamp to [-π, π]
          while (torsoTwist > Math.PI) torsoTwist -= 2 * Math.PI;
          while (torsoTwist < -Math.PI) torsoTwist += 2 * Math.PI;
          // Clamp to ±90°
          if (torsoTwist > this.torsoTurnThreshold) torsoTwist = this.torsoTurnThreshold;
          if (torsoTwist < -this.torsoTurnThreshold) torsoTwist = -this.torsoTurnThreshold;
          child.rotation.y = torsoTwist;
        }
        
        if (child.name === 'hips') {
          child.position.y = this.currentHipHeight;
        }
        
        // Apply pitch rotation to headPivot group only
        if (child.name === 'headPivot') {
          child.rotation.x = this.pitch;
        }
        
        // Apply leg rotations for crouch and walking
        if (child.name === 'left_upper_leg') {
          child.rotation.x = this.leftUpperLegRot;
          this.updateUpperLegPosition(child);
        } else if (child.name === 'right_upper_leg') {
          child.rotation.x = this.rightUpperLegRot;
          this.updateUpperLegPosition(child);
        } else if (child.name === 'left_lower_leg') {
          child.rotation.x = this.leftLowerLegRot;
          this.updateLowerLegPosition(child);
        } else if (child.name === 'right_lower_leg') {
          child.rotation.x = this.rightLowerLegRot;
          this.updateLowerLegPosition(child);
        } else if (child.name === 'left_knee') {
          this.updateKneePosition(child);
        } else if (child.name === 'right_knee') {
          this.updateKneePosition(child);
        } else if (child.name === 'left_foot' || child.name === 'right_foot') {
          this.updateFootPosition(child);
          child.position.y += 0.06; // Raise feet higher to prevent clipping
          child.position.z -= 0.125; // Move feet backward so back aligns with lower leg
        }

        // Apply arm rotations for walking
        if (child.name === 'left_upper_arm') {
          child.rotation.x = this.leftUpperArmRot;
          this.updateUpperArmPosition(child);
        } else if (child.name === 'right_upper_arm') {
          child.rotation.x = this.rightUpperArmRot;
          this.updateUpperArmPosition(child);
        } else if (child.name === 'left_lower_arm') {
          child.rotation.x = this.leftLowerArmRot;
          this.updateLowerArmPosition(child);
        } else if (child.name === 'right_lower_arm') {
          child.rotation.x = this.rightLowerArmRot;
          this.updateLowerArmPosition(child);
        } else if (child.name === 'left_elbow') {
          this.updateElbowPosition(child);
        } else if (child.name === 'right_elbow') {
          this.updateElbowPosition(child);
        } else if (child.name === 'left_hand' || child.name === 'right_hand') {
          this.updateHandPosition(child);
        }
      });
    }
  };

  // Update dummy character to mirror player movements
  this.updateDummyCharacter = function() {
    if (this.dummyCharacter) {
      // Keep dummy at fixed position but mirror all rotations and animations
      // Position stays at (0, 0, 15) but we apply the same transformations
      
      // Apply the same leg rotation to the entire dummy, but rotated 180 degrees to face the player
      this.dummyCharacter.rotation.y = this.legYaw + Math.PI;
      
      // Dummy should mirror player's vertical movement (jump)
      const jumpOffset = this._playerPosition.y - this.height;
      this.dummyCharacter.position.y = jumpOffset;
      
      // Update dummy's wireframe capsule position
      if (this.dummyCharacter.wireframeCapsule) {
        // Position relative to dummy character group (which is already positioned at feet level)
        this.dummyCharacter.wireframeCapsule.position.y = this.height / 2; // Center of capsule relative to character
      }
      
      // Update dummy's raycast arrow position
      if (this.dummyCharacter.raycastArrow) {
        // Position relative to dummy character group (which is already positioned at feet level)
        this.dummyCharacter.raycastArrow.position.y = this.height / 2; // Center of capsule relative to character
      }
      
      // Find the upper body group and apply lean, crouch, and independent torso rotation
      this.dummyCharacter.traverse((child) => {
        if (child.name === 'upperBody') {
          child.position.y = this.currentHipHeight;
          child.rotation.z = this.lean * this.maxLeanAngle;
          child.rotation.x = -this.crouchForwardLean; // Forward lean during crouch (negative for correct direction)
          // Apply independent torso rotation (relative to lower body)
          let torsoTwist = this.torsoYaw - this.legYaw;
          while (torsoTwist > Math.PI) torsoTwist -= 2 * Math.PI;
          while (torsoTwist < -Math.PI) torsoTwist += 2 * Math.PI;
          if (torsoTwist > this.torsoTurnThreshold) torsoTwist = this.torsoTurnThreshold;
          if (torsoTwist < -this.torsoTurnThreshold) torsoTwist = -this.torsoTurnThreshold;
          child.rotation.y = torsoTwist;
        }
        
        if (child.name === 'hips') {
          child.position.y = this.currentHipHeight;
        }
        
        // Apply pitch rotation to headPivot group only
        if (child.name === 'headPivot') {
          child.rotation.x = this.pitch;
        }
        
        // Apply leg rotations for crouch and walking
        if (child.name === 'left_upper_leg') {
          child.rotation.x = this.leftUpperLegRot;
          this.updateUpperLegPosition(child);
        } else if (child.name === 'right_upper_leg') {
          child.rotation.x = this.rightUpperLegRot;
          this.updateUpperLegPosition(child);
        } else if (child.name === 'left_lower_leg') {
          child.rotation.x = this.leftLowerLegRot;
          this.updateLowerLegPosition(child);
        } else if (child.name === 'right_lower_leg') {
          child.rotation.x = this.rightLowerLegRot;
          this.updateLowerLegPosition(child);
        } else if (child.name === 'left_knee') {
          this.updateKneePosition(child);
        } else if (child.name === 'right_knee') {
          this.updateKneePosition(child);
        } else if (child.name === 'left_foot' || child.name === 'right_foot') {
          this.updateFootPosition(child);
          child.position.y += 0.06; // Raise feet higher to prevent clipping
          child.position.z -= 0.125; // Move feet backward so back aligns with lower leg
        }

        // Apply arm rotations for walking
        if (child.name === 'left_upper_arm') {
          child.rotation.x = this.leftUpperArmRot;
          this.updateUpperArmPosition(child);
        } else if (child.name === 'right_upper_arm') {
          child.rotation.x = this.rightUpperArmRot;
          this.updateUpperArmPosition(child);
        } else if (child.name === 'left_lower_arm') {
          child.rotation.x = this.leftLowerArmRot;
          this.updateLowerArmPosition(child);
        } else if (child.name === 'right_lower_arm') {
          child.rotation.x = this.rightLowerArmRot;
          this.updateLowerArmPosition(child);
        } else if (child.name === 'left_elbow') {
          this.updateElbowPosition(child);
        } else if (child.name === 'right_elbow') {
          this.updateElbowPosition(child);
        } else if (child.name === 'left_hand' || child.name === 'right_hand') {
          this.updateHandPosition(child);
        }
      });
    }
  };

  // Player collision check
  this.checkCollision = function(map) {
    if (!map || !this.direction.lengthSq() > 0) return false;
    
    // Calculate intended movement direction
    const intendedMove = new THREE.Vector3();
    intendedMove.copy(this.direction);
    const yawMatrix = new THREE.Matrix4().makeRotationY(this.yaw);
    intendedMove.applyMatrix4(yawMatrix);
    
    // Check height at current position using height function
    const currentHeight = map.getTerrainHeight ? map.getTerrainHeight(this._playerPosition.x, this._playerPosition.z) : 0;
    
    // Check height at intended position (small step forward)
    const stepDistance = 0.1; // Small step to check slope
    const intendedX = this._playerPosition.x + intendedMove.x * stepDistance;
    const intendedZ = this._playerPosition.z + intendedMove.z * stepDistance;
    const intendedHeight = map.getTerrainHeight ? map.getTerrainHeight(intendedX, intendedZ) : 0;
    
    // Calculate height difference and slope
    const heightDifference = intendedHeight - currentHeight;
    const horizontalDistance = stepDistance;
    const slope = Math.abs(heightDifference) / horizontalDistance;
    
    // Define slope thresholds
    const maxClimbableSlope = 0.5; // 50% slope (about 26.6 degrees)
    const maxStepUpHeight = 0.3; // Maximum step up height (30cm)
    
    // Check if slope is too steep to climb
    if (heightDifference > 0 && slope > maxClimbableSlope) {
      return true; // Block movement
    }
    
    // Check if step up is too high
    if (heightDifference > maxStepUpHeight) {
      return true; // Block movement
    }
    
    // If we can move, automatically adjust height for small slopes
    if (Math.abs(heightDifference) > 0.01) { // Small threshold to avoid floating point issues
      this._playerPosition.y += heightDifference;
    }
    
    return false; // Allow movement
  };

  // Get terrain height using height function
  this.getTerrainHeight = function(map) {
    if (map && map.getTerrainHeight) {
      return map.getTerrainHeight(this._playerPosition.x, this._playerPosition.z);
    }
    return 0; // Default to ground level
  };
}

export function createPlayerBody(scene, camera) {
  // Create a sophisticated humanoid character (identical to dummy.js)
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
  raycastArrowHelper.position.set(0, 0.6, 0); // Center of capsule (relative to character)
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
  
  // Hips - connecting torso to legs
  const hipGeometry = new THREE.CylinderGeometry(0.28, 0.25, 0.15, 10);
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
  leftFoot.position.set(-0.12, 0.03, -0.05);
  leftFoot.name = 'left_foot';
  leftFoot.rotation.x = 0; // Always flat on ground
  character.add(leftFoot);
  
  const rightFoot = new THREE.Mesh(footGeometry, shoeMaterial);
  rightFoot.position.set(0.12, 0.03, -0.05);
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
  
  // Add the character to the scene
  scene.add(character);
  
  // Glue the camera to the front of the head (face)
  camera.position.set(0, 0, -0.22); // Position at front of head (face) - negative Z for front
  camera.rotation.set(0, 0, 0); // Camera stays neutral, transformations apply to the head
  head.add(camera);
  
  return character;
}