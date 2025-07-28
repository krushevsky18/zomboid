import { createMap, createSkybox } from './assets/map.js';
import { Player, createPlayerBody } from './player.js';
import { createDummyCharacter } from './assets/dummy.js';
import { createBasicPineTree } from './assets/foliage/tree/basic_pinetree.js';
import { createHealthPotion } from './assets/health_potion.js';

// Initialize the game
function initGame() {
  // Physics variables (will be initialized if Ammo.js is available)
  let physicsWorld = null;
  let rigidBodies = [];
  let transformAux = null;
  
  // Try to initialize Ammo.js physics
  function initPhysics() {
    if (typeof Ammo !== 'undefined') {
      console.log('Ammo.js found, initializing physics...');
      const collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
      const dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration);
      const broadphase = new Ammo.btDbvtBroadphase();
      const solver = new Ammo.btSequentialImpulseConstraintSolver();
      physicsWorld = new Ammo.btDiscreteDynamicsWorld(dispatcher, broadphase, solver, collisionConfiguration);
      
      // Set gravity
      physicsWorld.setGravity(new Ammo.btVector3(0, -9.81, 0));
      
      // Create auxiliary transform for physics updates
      transformAux = new Ammo.btTransform();
      
      // Add static ground collision body
      const groundShape = new Ammo.btBoxShape(new Ammo.btVector3(500, 0.1, 500)); // Large flat box for ground
      const groundTransform = new Ammo.btTransform();
      groundTransform.setIdentity();
      groundTransform.setOrigin(new Ammo.btVector3(0, -0.1, 0)); // Slightly below ground level
      const groundMotionState = new Ammo.btDefaultMotionState(groundTransform);
      const groundBody = new Ammo.btRigidBody(new Ammo.btRigidBodyConstructionInfo(0, groundMotionState, groundShape, new Ammo.btVector3(0, 0, 0)));
      physicsWorld.addRigidBody(groundBody);
      console.log('Static ground collision body added to physics world');
      
      console.log('Ammo.js physics initialized successfully');
      return true;
    } else {
      console.log('Ammo.js not available, physics disabled');
      return false;
    }
  }
  
  // Helper function to create physics body
  function createPhysicsBody(mesh, mass, shape) {
    if (!physicsWorld || !transformAux) return null;
    
    // Check if this mesh already has physics
    const existingBody = rigidBodies.find(rb => rb.mesh === mesh);
    if (existingBody) {
      console.log('Physics body already exists for:', mesh.name || 'object');
      return existingBody.body;
    }
    
    console.log('Creating physics body for:', mesh.name || 'object', 'mass:', mass, 'position:', mesh.position);
    
    const transform = new Ammo.btTransform();
    transform.setIdentity();
    transform.setOrigin(new Ammo.btVector3(mesh.position.x, mesh.position.y, mesh.position.z));
    transform.setRotation(new Ammo.btQuaternion(mesh.quaternion.x, mesh.quaternion.y, mesh.quaternion.z, mesh.quaternion.w));
    
    const motionState = new Ammo.btDefaultMotionState(transform);
    const localInertia = new Ammo.btVector3(0, 0, 0);
    shape.calculateLocalInertia(mass, localInertia);
    
    const rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, shape, localInertia);
    const body = new Ammo.btRigidBody(rbInfo);
    
    physicsWorld.addRigidBody(body);
    rigidBodies.push({ mesh: mesh, body: body });
    
    console.log('Physics body created and added to world. Total bodies:', rigidBodies.length);
    
    return body;
  }

  // Get the canvas
  const canvas = document.querySelector('canvas') || document.createElement('canvas');
  document.body.appendChild(canvas);
  canvas.tabIndex = 0;
  canvas.focus();

  // Renderer
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x222222);
  renderer.shadowMap.enabled = true;

  // Scene
  const scene = new THREE.Scene();

  // Camera
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2000);
  camera.position.set(0, 1.8, 20); // Start above ground, at human height
  camera.lookAt(0, 0, 0); // Look at map center

  // Initialize physics BEFORE creating objects
  initPhysics();
  
  console.log('Physics initialization complete. Physics world available:', !!physicsWorld);

  // Lighting
  const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
  hemiLight.position.set(0, 200, 0);
  scene.add(hemiLight);
  const dirLight = new THREE.DirectionalLight(0xffffff, 1);
  dirLight.position.set(50, 200, 100);
  dirLight.castShadow = true;
  scene.add(dirLight);

  // Map
  const map = createMap(1000);
  scene.add(map);
  
  console.log('Map created. Starting physics application...');
  
  // Track if we've logged the initial physics state
  let physicsInitialized = false;
  
  // Add health potion next to the sword
  const healthPotion = createHealthPotion(new THREE.Vector3(3, 2.0, 5)); // Start higher so we can see it fall
  scene.add(healthPotion);
  
  // Add physics to the health potion
  if (physicsWorld) {
    const potionShape = new Ammo.btCylinderShape(new Ammo.btVector3(0.08, 0.15, 0.08));
    createPhysicsBody(healthPotion, 0.5, potionShape);
    console.log('Physics added to health potion');
  }
  
  // Add collision detection for the health potion
  if (map && map.collisionObjects) {
    const potionCollision = {
      type: 'box',
      position: new THREE.Vector3(3, 2.0, 5), // Center of the potion (updated position)
      size: new THREE.Vector3(0.16, 0.3, 0.16) // Approximate potion dimensions
    };
    map.collisionObjects.push(potionCollision);
    console.log('Collision added to health potion');
  }
  
  // Store chest reference for interaction
  let chest = null;
  let sword = null; // Reference to sword mesh for pickup

  // Get chest and sword references from map
  map.traverse((child) => {
    if (child.update && child.toggle) { // This is our chest
      chest = child;
      console.log('Chest found');
    }
    
    // Apply physics to any objects that need it
    if (child.needsPhysics && physicsWorld) {
      let shape;
      if (child.physicsShape === 'box') {
        const size = child.physicsSize || new THREE.Vector3(0.1, 0.1, 0.1);
        shape = new Ammo.btBoxShape(new Ammo.btVector3(size.x, size.y, size.z));
      } else if (child.physicsShape === 'cylinder') {
        const size = child.physicsSize || new THREE.Vector3(0.08, 0.15, 0.08);
        shape = new Ammo.btCylinderShape(new Ammo.btVector3(size.x, size.y, size.z));
      } else {
        // Default to box shape
        shape = new Ammo.btBoxShape(new Ammo.btVector3(0.1, 0.1, 0.1));
      }
      
      const mass = child.physicsMass || 1.0;
      createPhysicsBody(child, mass, shape);
      console.log('Physics added to', child.name || 'object', 'with shape:', child.physicsShape);
      
      // Clear the flag to prevent duplicate physics
      child.needsPhysics = false;
    }
    
    // Identify the sword by checking if it's a Group with interactable properties
    if (!sword && child.type === 'Group' && child.isInteractable && child.interactType === 'equipable') {
      sword = child;
      console.log('Sword found, children count:', child.children.length);
    }
  });
  
  console.log('Map traversal complete. Physics objects found:', rigidBodies.length, 'Sword:', !!sword, 'Chest:', !!chest);

  // Loot dot UI
  const lootDot = document.getElementById('loot-dot');
  let lootDotOpacity = 0;
  let lootDotTarget = 0;
  let canPickupItem = false;
  let interactTarget = null;

  // --- Generalized Item Interaction Logic ---
  function checkInteractablePickup() {
    let closest = null;
    let closestDist = Infinity;
    let camPos = new THREE.Vector3();
    camera.getWorldPosition(camPos);
    let camDir = new THREE.Vector3();
    camera.getWorldDirection(camDir);
    
    // Create a raycaster for proper intersection testing
    const raycaster = new THREE.Raycaster();
    raycaster.set(camPos, camDir);
    
    // Traverse all children of the map (could be extended to scene if needed)
    map.traverse((child) => {
      if (!child.isInteractable) return;
      
      // Proximity check first (optimization)
      let itemPos = new THREE.Vector3();
      child.getWorldPosition(itemPos);
      let dist = camPos.distanceTo(itemPos);
      if (dist > 2.0 || dist < 0.5) return;
      
      // Raycast check - test if camera ray intersects with any part of the object
      const intersects = raycaster.intersectObject(child, true); // true = recursive
      if (intersects.length === 0) return;
      
      // If closer than previous, set as candidate
      if (dist < closestDist) {
        closest = child;
        closestDist = dist;
      }
    });
    
    // Also check the health potion
    if (healthPotion && healthPotion.isInteractable) {
      let itemPos = new THREE.Vector3();
      healthPotion.getWorldPosition(itemPos);
      let dist = camPos.distanceTo(itemPos);
      if (dist <= 2.0 && dist >= 0.5) {
        const intersects = raycaster.intersectObject(healthPotion, true);
        if (intersects.length > 0 && dist < closestDist) {
          closest = healthPotion;
          closestDist = dist;
        }
      }
    }
    
    if (closest) {
      lootDotTarget = 1;
      canPickupItem = true;
      interactTarget = closest;
    } else {
      lootDotTarget = 0;
      canPickupItem = false;
      interactTarget = null;
    }
  }

  // Skybox
  let timeOfDay = 0.3; // Start at morning
  function updateSkyboxAndSun() {
    createSkybox(scene, timeOfDay);
    // Sun movement and color
    const sunAngle = (timeOfDay - 0.25) * Math.PI * 2; // -0.25 so 0.5 is overhead
    const radius = 100;
    dirLight.position.set(
      Math.cos(sunAngle) * radius,
      Math.sin(sunAngle) * radius,
      0
    );
    if (dirLight.position.y > 0) {
      dirLight.intensity = 1;
      // Color: orange at sunrise/sunset, white at noon
      const t = Math.abs(timeOfDay - 0.5) * 2; // 0 at noon, 1 at sunrise/sunset
      dirLight.color.setHSL(0.13 + 0.07 * t, 1, 0.5 + 0.2 * (1 - t));
    } else {
      dirLight.intensity = 0;
    }
    timeOfDay += 0.000025;
    if (timeOfDay > 1) timeOfDay = 0;
  }

  // Player
  const staminaBar = document.getElementById('stamina-fill');
  const player = new Player(camera, staminaBar);
  player.setMap(map); // Give player access to map for terrain height sampling
  // Add flag to track if player should be prevented from moving
  player.preventMovement = false;

  // Add visible player body at camera position
  const playerBody = createPlayerBody(scene, camera);
  player.setPlayerBody(playerBody);

  // Ensure player spawns on the ground after map and body are ready
  const terrainHeight = player.getTerrainHeight(map);
  player._playerPosition.y = terrainHeight + player.height;
  console.log('Player initialized - Position Y:', player._playerPosition.y, 'Terrain Height:', terrainHeight, 'Player Height:', player.height);
  player.updatePlayerBody();
  
  // Create a dummy character that mirrors the player's movements
  const dummyCharacter = createDummyCharacter();
  dummyCharacter.position.set(0, 0, 15); // Position directly in front of the player
  dummyCharacter.rotation.y = Math.PI; // Rotate 180 degrees to face the player
  scene.add(dummyCharacter);
  player.setDummyCharacter(dummyCharacter);

  // Add pine trees around the starting area
  scene.add(createBasicPineTree(new THREE.Vector3(-5, 0, 18), 1));
  scene.add(createBasicPineTree(new THREE.Vector3(5, 0, 22), 1.2));
  scene.add(createBasicPineTree(new THREE.Vector3(0, 0, 25), 0.9));

  // --- Patch player.update to add collision ---
  const origUpdate = player.update;
  player.update = function(delta) {
    const prevPos = player._playerPosition.clone();
    origUpdate.call(player, delta);
    if (player.checkCollision(map)) {
      player._playerPosition.copy(prevPos);
    }
  };

  // Pointer lock for mouse look
  let hasStartedGame = false; // Track if game has been started
  let isExitingMenu = false; // Track if we're in the process of exiting menu
  let isEnteringMenu = false; // Track if we're entering menu mode
  canvas.addEventListener('click', () => {
    canvas.requestPointerLock();
    hasStartedGame = true;
  });
  document.addEventListener('pointerlockchange', () => {
    if (document.pointerLockElement === canvas) {
      isExitingMenu = false; // Reset flag when pointer lock is successful
      isEnteringMenu = false; // Reset flag when pointer lock is successful
    }
  });

  // Mouse look
  function onMouseMove(e) {
    if (document.pointerLockElement !== canvas || chestMenuOpen || playerInventoryOpen) return;
    player.yaw -= e.movementX * 0.002;
    player.pitch -= e.movementY * 0.002;
    player.pitch = Math.max(-Math.PI/2, Math.min(Math.PI/2, player.pitch));
  }
  document.addEventListener('mousemove', onMouseMove);

  // Movement
  const keys = {};
  document.addEventListener('keydown', e => { 
    // Don't register movement keys if chest menu is open
    if (!chestMenuOpen && !playerInventoryOpen) {
      keys[e.code] = true; 
    }
    
    // Player inventory toggle with TAB
    if (e.code === 'Tab' && !chestMenuOpen) {
      e.preventDefault(); // Prevent default tab behavior
      if (playerInventoryOpen) {
        hidePlayerInventory();
      } else {
        showPlayerInventory();
      }
    }
    
    // Chest interaction is now handled by the generalized interaction system below
    // Generalized item pickup/interact
    if (canPickupItem && interactTarget && e.code === 'KeyF') {
      if (interactTarget.interactType === 'equipable') {
        // Remove from scene and physics
        if (physicsWorld && rigidBodies.length > 0) {
          const bodyIndex = rigidBodies.findIndex(rb => rb.mesh === interactTarget);
          if (bodyIndex !== -1) {
            physicsWorld.removeRigidBody(rigidBodies[bodyIndex].body);
            rigidBodies.splice(bodyIndex, 1);
          }
        }
        interactTarget.parent.remove(interactTarget);
        // Add to player inventory (find first available spot for 1x3 item)
        outer: for (let y = 0; y <= GRID_H_PLAYER - 3; y++) {
          for (let x = 0; x < GRID_W_PLAYER; x++) {
            if (placeItem(playerGrid, 'sword', x, y, refCounter++, 0)) break outer;
          }
        }
        renderInventoryGrid(playerGrid, playerGridEl, GRID_W_PLAYER, GRID_H_PLAYER);
        addDragListeners();
        lootDotTarget = 0;
        canPickupItem = false;
        interactTarget = null;
      } else if (interactTarget.interactType === 'searchable') {
        // Only allow searching if player is stationary
        if (player.direction.lengthSq() === 0) {
          // Open/search chest (simulate F key on chest)
          if (interactTarget.toggle) {
            interactTarget.toggle();
            if (interactTarget.isOpen) {
              showChestMenu();
            } else {
              hideChestMenu();
            }
          }
        }
      }
    }

    // Handle rotation key when menu is open
    if (chestMenuOpen && e.code === 'KeyR' && selected) {
      const selGrid = selected.gridType === 'player' ? playerGrid : chestGrid;
      const cell = selGrid[selected.y][selected.x];
      if (!cell || cell.topLeft[0] !== selected.x || cell.topLeft[1] !== selected.y) return;
      const item = itemDatabase[cell.itemId];
      if (item.width === item.height) return; // Don't rotate square items
      const currentOrient = cell.orientation || 0;
      const newOrient = currentOrient === 0 ? 90 : 0;
      const effW = newOrient === 0 ? item.width : item.height;
      const effH = newOrient === 0 ? item.height : item.width;
      // Check if can place with new orientation at same position
      if (selected.x + effW > selGrid[0].length || selected.y + effH > selGrid.length) return;
      let canPlace = true;
      checkLoop: for (let dy = 0; dy < effH; dy++) {
        for (let dx = 0; dx < effW; dx++) {
          const checkCell = selGrid[selected.y + dy][selected.x + dx];
          if (checkCell && checkCell.refId !== cell.refId) {
            canPlace = false;
            break checkLoop;
          }
        }
      }
      if (!canPlace) return;
      // Rotate: remove and place with new orientation
      removeItem(selGrid, selected.x, selected.y);
      placeItem(selGrid, cell.itemId, selected.x, selected.y, cell.refId, newOrient);
      // Re-render
      renderInventoryGrid(playerGrid, playerGridEl, GRID_W_PLAYER, GRID_H_PLAYER);
      renderInventoryGrid(chestGrid, chestGridEl, GRID_W_CHEST, GRID_H_CHEST);
      addDragListeners();
      // Re-select the item
      const gridId = selected.gridType === 'player' ? 'player-inventory-grid' : 'chest-contents-grid';
      const newSlot = document.querySelector(`#${gridId} .inventory-slot[data-x="${selected.x}"][data-y="${selected.y}"]`);
      if (newSlot) newSlot.classList.add('selected');
    }
  });
  document.addEventListener('keyup', e => { 
    // Don't register movement keys if chest menu is open
    if (!chestMenuOpen && !playerInventoryOpen) {
      keys[e.code] = false; 
    }
  });

  // Responsive
  window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  });

  // Inventory menu logic
  const chestMenu = document.getElementById('chest-inventory-menu');
  const playerGridEl = document.getElementById('player-inventory-grid');
  const chestGridEl = document.getElementById('chest-contents-grid');
  const closeChestMenuBtn = document.getElementById('close-chest-menu');
  let chestMenuOpen = false;
  // Player inventory menu logic
  const playerInventoryMenu = document.getElementById('player-inventory-menu');
  const playerInventoryGridEl = document.getElementById('player-inventory-grid-standalone');
  const closePlayerInventoryBtn = document.getElementById('close-player-inventory');
  let playerInventoryOpen = false;
  let selected = null; // {gridType: 'player'|'chest', x: number, y: number}

  // Item Database
  const itemDatabase = {
    "sword": {
      name: "Iron Sword",
      type: "weapon",
      icon: "sword",
      width: 1,
      height: 3,
      stats: { damage: 10, durability: 100 }
    },
    "potion": {
      name: "Health Potion",
      type: "consumable", 
      icon: "potion",
      width: 1,
      height: 1,
      effect: { health: 50 }
    },
    "gold": {
      name: "Gold Coin",
      type: "currency",
      icon: "gold",
      width: 1,
      height: 1,
      value: 1
    },
    "shield": {
      name: "Wooden Shield",
      type: "armor",
      icon: "shield", 
      width: 2,
      height: 2,
      stats: { defense: 5, durability: 80 }
    }
  };

  // 8x8 for player, 4x4 for chest
  const GRID_W_PLAYER = 8, GRID_H_PLAYER = 8;
  const GRID_W_CHEST = 4, GRID_H_CHEST = 4;

  function createEmptyGrid(w, h) {
    return Array.from({ length: h }, () => Array(w).fill(null));
  }

  // Example: Place a sword at (2,1), potion at (0,0), shield at (4,4)
  function placeItem(grid, itemId, x, y, refId, orientation = 0) {
    const item = itemDatabase[itemId];
    if (!item) return false;
    const effW = orientation === 0 ? item.width : item.height;
    const effH = orientation === 0 ? item.height : item.width;
    // Check bounds and collisions
    if (x + effW > grid[0].length || y + effH > grid.length) return false;
    for (let dy = 0; dy < effH; dy++) {
      for (let dx = 0; dx < effW; dx++) {
        if (grid[y + dy][x + dx]) return false;
      }
    }
    // Place item
    for (let dy = 0; dy < effH; dy++) {
      for (let dx = 0; dx < effW; dx++) {
        grid[y + dy][x + dx] = { itemId, refId, topLeft: [x, y], orientation };
      }
    }
    return true;
  }

  function removeItem(grid, x, y) {
    const cell = grid[y][x];
    if (!cell) return;
    const orientation = cell.orientation || 0;
    const item = itemDatabase[cell.itemId];
    const effW = orientation === 0 ? item.width : item.height;
    const effH = orientation === 0 ? item.height : item.width;
    const topX = cell.topLeft[0];
    const topY = cell.topLeft[1];
    for (let dy = 0; dy < effH; dy++) {
      for (let dx = 0; dx < effW; dx++) {
        grid[topY + dy][topX + dx] = null;
      }
    }
  }

  // Example inventories
  const playerGrid = createEmptyGrid(GRID_W_PLAYER, GRID_H_PLAYER);
  const chestGrid = createEmptyGrid(GRID_W_CHEST, GRID_H_CHEST);
  let refCounter = 1;
  placeItem(playerGrid, 'potion', 0, 0, refCounter++, 0);
  placeItem(playerGrid, 'gold', 1, 0, refCounter++, 0);
  placeItem(playerGrid, 'shield', 4, 4, refCounter++, 0);
  placeItem(chestGrid, 'sword', 0, 1, refCounter++, 0);
  placeItem(chestGrid, 'gold', 0, 0, refCounter++, 0);
  placeItem(chestGrid, 'potion', 2, 2, refCounter++, 0);

  function renderInventoryGrid(grid, gridEl, w, h) {
    gridEl.innerHTML = '';
    // Render grid
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const cell = grid[y][x];
        // Skip cells that are covered by multi-cell items (not the top-left)
        if (cell && (cell.topLeft[0] !== x || cell.topLeft[1] !== y)) continue;
        
        const slot = document.createElement('div');
        slot.className = 'inventory-slot';
        slot.dataset.x = x;
        slot.dataset.y = y;
        
        if (cell) {
          const orientation = cell.orientation || 0;
          const item = itemDatabase[cell.itemId];
          const effW = orientation === 0 ? item.width : item.height;
          const effH = orientation === 0 ? item.height : item.width;
          // Set grid span for multi-cell items
          slot.style.gridColumn = (x + 1) + ' / span ' + effW;
          slot.style.gridRow = (y + 1) + ' / span ' + effH;
          
          const itemIcon = document.createElement('div');
          itemIcon.className = 'item-icon';
          if (orientation === 90) {
            itemIcon.style.transform = 'rotate(90deg)';
          }
          if (item.icon) {
            itemIcon.innerHTML = `<svg preserveAspectRatio="xMidYMid meet"><use href=\"#${item.icon}\"/></svg>`;
          } else {
            itemIcon.className = 'item-icon item-text';
            itemIcon.textContent = item.name;
          }
          slot.appendChild(itemIcon);
        } else {
          // Empty slot
          slot.style.gridColumn = (x + 1) + ' / span 1';
          slot.style.gridRow = (y + 1) + ' / span 1';
        }
        
        gridEl.appendChild(slot);
      }
    }
  }

  function addDragListeners() {
    const allSlots = document.querySelectorAll('.inventory-slot');
    allSlots.forEach(slot => {
      slot.addEventListener('dragover', (e) => {
        e.preventDefault();
      });
      slot.addEventListener('drop', (e) => {
        e.preventDefault();
        const data = JSON.parse(e.dataTransfer.getData('text/plain'));
        const targetGridEl = slot.closest('.inventory-grid');
        const gridType = targetGridEl.id === 'player-inventory-grid' ? 'player' : 'chest';
        const targetGrid = gridType === 'player' ? playerGrid : chestGrid;
        const originGrid = data.gridType === 'player' ? playerGrid : chestGrid;
        const targetX = parseInt(slot.dataset.x);
        const targetY = parseInt(slot.dataset.y);
        removeItem(originGrid, data.x, data.y);
        if (!placeItem(targetGrid, data.itemId, targetX, targetY, data.refId, data.orientation)) {
          placeItem(originGrid, data.itemId, data.x, data.y, data.refId, data.orientation);
        }
        renderInventoryGrid(playerGrid, playerGridEl, GRID_W_PLAYER, GRID_H_PLAYER);
        renderInventoryGrid(chestGrid, chestGridEl, GRID_W_CHEST, GRID_H_CHEST);
        addDragListeners(); // Re-add listeners after re-render
        selected = null; // Reset selection after drop
      });
      // Add click listener for selection
      slot.addEventListener('click', (e) => {
        if (e.button !== 0) return; // Only left click
        const gridEl = slot.closest('.inventory-grid');
        const gridType = gridEl.id === 'player-inventory-grid' ? 'player' : 'chest';
        const x = parseInt(slot.dataset.x);
        const y = parseInt(slot.dataset.y);
        const cell = (gridType === 'player' ? playerGrid : chestGrid)[y][x];
        if (!cell) return; // Only select if there's an item
        // Deselect previous
        document.querySelectorAll('.inventory-slot.selected').forEach(s => s.classList.remove('selected'));
        // Select this
        slot.classList.add('selected');
        selected = { gridType, x, y };
      });
      if (slot.querySelector('.item-icon')) {
        slot.draggable = true;
        slot.addEventListener('dragstart', (e) => {
          const gridEl = slot.closest('.inventory-grid');
          const gridType = gridEl.id === 'player-inventory-grid' ? 'player' : 'chest';
          const x = parseInt(slot.dataset.x);
          const y = parseInt(slot.dataset.y);
          const cell = (gridType === 'player' ? playerGrid : chestGrid)[y][x];
          e.dataTransfer.setData('text/plain', JSON.stringify({
            gridType, 
            itemId: cell.itemId, 
            refId: cell.refId, 
            x, 
            y,
            orientation: cell.orientation || 0
          }));
        });
      }
    });
  }

  function showChestMenu() {
    renderInventoryGrid(playerGrid, playerGridEl, GRID_W_PLAYER, GRID_H_PLAYER);
    renderInventoryGrid(chestGrid, chestGridEl, GRID_W_CHEST, GRID_H_CHEST);
    addDragListeners();
    chestMenu.style.display = 'flex';
    chestMenuOpen = true;
    isEnteringMenu = true; // Set flag BEFORE exiting pointer lock
    // Exit pointer lock to allow cursor interaction with menu
    document.exitPointerLock();
  }
  function hideChestMenu() {
    chestMenu.style.display = 'none';
    chestMenuOpen = false;
    // Reset the flag so user can click to re-enter pointer lock
    isExitingMenu = false;
    // Automatically re-engage pointer lock when menu closes
    canvas.focus();
    setTimeout(() => {
      canvas.requestPointerLock();
    }, 100); // Increased delay to ensure it works reliably
    selected = null; // Reset selection when closing menu
  }
  function showPlayerInventory() {
    // Stop player movement when opening inventory
    player.direction.set(0, 0, 0);
    player.jumpVelocity.set(0, 0, 0);
    player.velocity.set(0, 0, 0);
    player.preventMovement = true; // Prevent movement when inventory is open
    
    renderInventoryGrid(playerGrid, playerInventoryGridEl, GRID_W_PLAYER, GRID_H_PLAYER);
    addDragListeners();
    playerInventoryMenu.style.display = 'flex';
    playerInventoryOpen = true;
    isEnteringMenu = true; // Set flag BEFORE exiting pointer lock
    // Exit pointer lock to allow cursor interaction with menu
    document.exitPointerLock();
  }
  function hidePlayerInventory() {
    playerInventoryMenu.style.display = 'none';
    playerInventoryOpen = false;
    player.preventMovement = false; // Allow movement when inventory is closed
    // Clear all movement keys to prevent resuming previous movement
    Object.keys(keys).forEach(key => {
      if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ShiftLeft', 'ShiftRight', 'Space', 'Numpad0', 'KeyC', 'KeyQ', 'KeyE'].includes(key)) {
        keys[key] = false;
      }
    });
    // Reset the flag so user can click to re-enter pointer lock
    isExitingMenu = false;
    // Automatically re-engage pointer lock when menu closes
    canvas.focus();
    setTimeout(() => {
      canvas.requestPointerLock();
    }, 100); // Increased delay to ensure it works reliably
    selected = null; // Reset selection when closing menu
  }
  closeChestMenuBtn.addEventListener('click', hideChestMenu);
  closePlayerInventoryBtn.addEventListener('click', hidePlayerInventory);
  document.addEventListener('keydown', e => {
    if (chestMenuOpen && e.code === 'Escape') {
      // Only close the search menu, don't affect chest state
      hideChestMenu();
      e.preventDefault();
    }
    if (playerInventoryOpen && e.code === 'Escape') {
      // Close the player inventory menu
      hidePlayerInventory();
      e.preventDefault();
    }
  });

  // Main loop
  let lastTime = performance.now();
  function animate() {
    requestAnimationFrame(animate);
    const now = performance.now();
    const delta = (now - lastTime) / 1000; // delta in seconds
    lastTime = now;
    
    // Update physics
    if (physicsWorld) {
      physicsWorld.stepSimulation(delta, 10);
      
      // Log initial physics state once
      if (!physicsInitialized && rigidBodies.length > 0) {
        console.log('Physics simulation started with', rigidBodies.length, 'objects:');
        rigidBodies.forEach((rb, i) => {
          const pos = rb.mesh.position;
          console.log(`  Object ${i}: ${rb.mesh.name || 'unnamed'} at (${pos.x.toFixed(2)}, ${pos.y.toFixed(2)}, ${pos.z.toFixed(2)})`);
        });
        physicsInitialized = true;
      }
      
      // Update physics objects
      for (let i = 0; i < rigidBodies.length; i++) {
        const objThree = rigidBodies[i].mesh;
        const objPhys = rigidBodies[i].body;
        const ms = objPhys.getMotionState();
        if (ms) {
          ms.getWorldTransform(transformAux);
          const p = transformAux.getOrigin();
          const q = transformAux.getRotation();
          objThree.position.set(p.x(), p.y(), p.z());
          objThree.quaternion.set(q.x(), q.y(), q.z(), q.w());
        }
      }
    }
    
    player.handleInput(keys);
    player.update(delta);
    player.updatePlayerBody();
    player.updateDummyCharacter();
    // --- Generalized interactable detection ---
    checkInteractablePickup();
    // Fade loot dot
    lootDotOpacity += (lootDotTarget - lootDotOpacity) * 0.08;
    lootDot.style.opacity = lootDotOpacity;
    
    // Update chest animation
    if (chest) {
      chest.update(delta);
      // Remove auto-show logic - menu only opens/closes via F key or escape
    }
    
    updateSkyboxAndSun();
    // --- Torch flicker animation ---
    scene.traverse((obj) => {
      if (obj.userData && obj.userData.flicker && obj.userData.light) {
        // Flicker intensity and color
        obj.userData.light.intensity = 1.1 + Math.sin(now * 0.012 + obj.position.x) * 0.25 + Math.random() * 0.12;
        obj.userData.light.color.setHSL(0.1 + Math.random() * 0.03, 1, 0.5 + Math.random() * 0.08);
        // Flicker position
        obj.userData.light.position.x = Math.sin(now * 0.008 + obj.position.y) * 0.04 + (Math.random() - 0.5) * 0.03;
        obj.userData.light.position.z = (Math.random() - 0.5) * 0.03;
      }
    });
    renderer.render(scene, camera);
  }
  
  animate();
}

// Start the game
initGame();
