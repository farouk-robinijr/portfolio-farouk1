import * as THREE from "./three.module.js";

const sections = [
  {
    id: "home",
    label: "Home",
    rocketName: "Home Rocket",
    position: new THREE.Vector3(-8.2, 0, 6.9),
    cameraOffset: new THREE.Vector3(4.1, 4.8, 6.0),
    paragraphs: [
      "Welcome to my portfolio. I am a computer science student passionate about Python, SQL, databases, and building creative technology projects. This portfolio is inspired by my dream of building a rocket from scratch.",
    ],
  },
  {
    id: "about",
    label: "About Me",
    rocketName: "About Me Rocket",
    position: new THREE.Vector3(6.8, 0, 6.2),
    cameraOffset: new THREE.Vector3(-4.0, 5.0, 6.4),
    paragraphs: [
      "My name is Farouk El Hammoumi. I am 21 years old, originally from Morocco, and currently studying Computer Science at Valencia College.",
      "My main skills are Python and SQL. I enjoy building projects that combine programming and databases, such as my casino project that uses Python and SQL to manage player and game data.",
      "I am always looking to improve my skills through real-world experience and new challenges. My goal is to grow as a developer and work on meaningful projects. One of my biggest dreams is to build a rocket from scratch, which inspired the futuristic rocket launch theme of my portfolio.",
    ],
  },
  {
    id: "projects",
    label: "Projects",
    rocketName: "Projects Rocket",
    position: new THREE.Vector3(-1.8, 0, 0.4),
    cameraOffset: new THREE.Vector3(4.6, 5.2, 6.1),
    intro: "Projects:",
    list: [
      "Casino project created with Python.",
      "SQL database developed for the casino project to store player data and everything related to the casino system.",
      "Gestion du stockage app for inventory and merchandise management.",
    ],
  },
  {
    id: "skills",
    label: "Skills",
    rocketName: "Skills Rocket",
    position: new THREE.Vector3(9.0, 0, -2.9),
    cameraOffset: new THREE.Vector3(-4.7, 5.2, 5.8),
    intro: "Skills:",
    list: ["Python", "SQL", "JavaScript", "HTML", "CSS", "Prompting", "AI tools", "Automations"],
  },
  {
    id: "experience",
    label: "Experience",
    rocketName: "Experience Rocket",
    position: new THREE.Vector3(-8.8, 0, -4.5),
    cameraOffset: new THREE.Vector3(4.4, 5.4, 6.2),
    paragraphs: [
      "Experience:",
      "Built practical database and inventory-management projects, including an app for gestion du stockage to organize products, stock levels, and related data in a cleaner way.",
    ],
  },
  {
    id: "contact",
    label: "Contact",
    rocketName: "Contact Rocket",
    position: new THREE.Vector3(2.4, 0, -8.1),
    cameraOffset: new THREE.Vector3(4.3, 5.5, 5.9),
    contact: [
      { label: "Email", value: "farouklheh@gmail.com", href: "mailto:farouklheh@gmail.com" },
      { label: "LinkedIn", value: "Farouk EL Hammoumi" },
      { label: "Phone", value: "321-424-0354", href: "tel:3214240354" },
    ],
  },
];

const byId = new Map(sections.map((section) => [section.id, section]));
const refs = new Map();
const hitTargets = [];
const vehicles = [];
const beacons = [];
const galaxyLayers = [];
const perf = {
  pixelRatio: Math.min(window.devicePixelRatio || 1, window.innerWidth <= 760 ? 1.15 : 1.35),
  animationScale: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0.45 : 1,
};

const canvas = document.querySelector("#scene-canvas");
const panel = document.querySelector("#section-panel");
const panelKicker = document.querySelector("#panel-kicker");
const panelTitle = document.querySelector("#panel-title");
const panelContent = document.querySelector("#panel-content");
const closeButton = document.querySelector("#close-panel");
const loading = document.querySelector("#loading");
const dockButtons = Array.from(document.querySelectorAll(".dock-button"));

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x01030a);
scene.fog = new THREE.FogExp2(0x03060d, 0.011);

const camera = new THREE.PerspectiveCamera(44, window.innerWidth / window.innerHeight, 0.1, 220);
const cameraViews = {
  desktop: {
    fov: 44,
    basePosition: new THREE.Vector3(0, 11.2, 22.4),
    baseLookAt: new THREE.Vector3(-0.4, 1.1, -1.6),
  },
  mobile: {
    fov: 54,
    basePosition: new THREE.Vector3(0, 18.2, 37.5),
    baseLookAt: new THREE.Vector3(-0.2, 0.95, -1.8),
  },
};
let responsiveMode = getResponsiveMode();
let targetFov = cameraViews[responsiveMode].fov;
const currentLookAt = cameraViews[responsiveMode].baseLookAt.clone();
const flight = {
  active: false,
  startPosition: new THREE.Vector3(),
  startLookAt: new THREE.Vector3(),
  endPosition: cameraViews[responsiveMode].basePosition.clone(),
  endLookAt: cameraViews[responsiveMode].baseLookAt.clone(),
  startedAt: 0,
  duration: 1,
  arc: 0,
};
camera.fov = targetFov;
camera.position.copy(cameraViews[responsiveMode].basePosition);
camera.updateProjectionMatrix();

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
renderer.setPixelRatio(perf.pixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.36;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const clock = new THREE.Clock();
const scratch = new THREE.Vector3();
const lookScratch = new THREE.Vector3();
const sideScratch = new THREE.Vector3();
const up = new THREE.Vector3(0, 1, 0);
const lookObject = new THREE.Object3D();

const softShadowTexture = createSoftDiscTexture();
const exhaustTexture = createExhaustTexture();
const steamTexture = createSteamTexture();

const materials = {
  base: standard(0x101116, 0.22, 0.78),
  deckPanel: standard(0x16171d, 0.28, 0.68),
  deckInset: standard(0x090a0d, 0.18, 0.86),
  road: standard(0x1a1b20, 0.18, 0.72),
  roadEdge: standard(0x2a2b30, 0.28, 0.55),
  bevel: standard(0x2b2c31, 0.32, 0.54),
  black: standard(0x0b0c10, 0.28, 0.7),
  tower: standard(0x111217, 0.42, 0.62),
  white: standard(0xfffdf4, 0.03, 0.22),
  glass: new THREE.MeshStandardMaterial({
    color: 0x080d12,
    emissive: 0x102238,
    emissiveIntensity: 0.36,
    metalness: 0.08,
    roughness: 0.12,
    transparent: true,
    opacity: 0.78,
  }),
  rocketBlack: standard(0x050506, 0.18, 0.46),
  red: new THREE.MeshStandardMaterial({
    color: 0xf0252d,
    emissive: 0xff1822,
    emissiveIntensity: 1.45,
    metalness: 0.24,
    roughness: 0.42,
  }),
  redLight: new THREE.MeshBasicMaterial({ color: 0xff3434 }),
  redGlow: new THREE.MeshBasicMaterial({
    color: 0xff3030,
    transparent: true,
    opacity: 0.26,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }),
  blueGlow: new THREE.MeshBasicMaterial({
    color: 0x61a8ff,
    transparent: true,
    opacity: 0.2,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }),
  hitbox: new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0, depthWrite: false }),
};

let hoveredId = null;
let selectedId = null;
let panelTimer = null;

init();
animate();

function standard(color, metalness, roughness) {
  return new THREE.MeshStandardMaterial({ color, metalness, roughness });
}

function fakeLight(intensity = 0) {
  const light = new THREE.Object3D();
  light.intensity = intensity;
  return light;
}

function getResponsiveMode() {
  return window.innerWidth <= 760 ? "mobile" : "desktop";
}

function baseCameraView() {
  const view = cameraViews[getResponsiveMode()];
  return {
    fov: view.fov,
    position: view.basePosition.clone(),
    lookAt: view.baseLookAt.clone(),
  };
}

function sectionCameraView(section) {
  const mode = getResponsiveMode();
  const lookAt = section.position.clone().add(new THREE.Vector3(0, mode === "mobile" ? 2.75 : 2.25, 0));

  if (mode === "mobile") {
    const horizontal = section.cameraOffset.clone();
    horizontal.y = 0;
    horizontal.normalize();
    return {
      fov: 55,
      position: section.position.clone().add(new THREE.Vector3(horizontal.x * 9.2, 8.4, horizontal.z * 12.2)),
      lookAt,
    };
  }

  const offset = section.cameraOffset.clone();
  return {
    fov: 44,
    position: section.position.clone().add(new THREE.Vector3(offset.x * 1.22, offset.y + 0.75, offset.z * 1.32)),
    lookAt,
  };
}

function startCameraFlight(view, preferredDuration) {
  const distance = camera.position.distanceTo(view.position);
  const duration = preferredDuration ?? THREE.MathUtils.clamp(0.86 + distance * 0.055, 1.05, 2.25);
  flight.active = true;
  flight.startPosition.copy(camera.position);
  flight.startLookAt.copy(currentLookAt);
  flight.endPosition.copy(view.position);
  flight.endLookAt.copy(view.lookAt);
  flight.startedAt = clock.elapsedTime;
  flight.duration = duration;
  flight.arc = THREE.MathUtils.clamp(distance * 0.045, 0.28, 2.35);
  targetFov = view.fov;
  return duration;
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - ((-2 * t + 2) ** 3) / 2;
}

function updateCameraFlight(elapsed, delta) {
  camera.fov = THREE.MathUtils.damp(camera.fov, targetFov, 4.8, delta);
  camera.updateProjectionMatrix();

  if (!flight.active) {
    camera.position.lerp(flight.endPosition, 1 - Math.exp(-2.9 * delta));
    currentLookAt.lerp(flight.endLookAt, 1 - Math.exp(-3.2 * delta));
    return;
  }

  const raw = THREE.MathUtils.clamp((elapsed - flight.startedAt) / flight.duration, 0, 1);
  const eased = easeInOutCubic(raw);
  camera.position.lerpVectors(flight.startPosition, flight.endPosition, eased);
  camera.position.y += Math.sin(raw * Math.PI) * flight.arc;
  currentLookAt.lerpVectors(flight.startLookAt, flight.endLookAt, eased);

  if (raw >= 1) {
    flight.active = false;
    camera.position.copy(flight.endPosition);
    currentLookAt.copy(flight.endLookAt);
  }
}

function init() {
  addBackground();
  addLights();
  addBase();
  addRoads();
  addBuildings();
  addLifeLayer();

  sections.forEach((section, index) => scene.add(createLaunchPad(section, index)));

  bindEvents();
  setTimeout(() => loading.classList.add("hidden"), 550);
}

function addLights() {
  scene.add(new THREE.AmbientLight(0xb6b0a8, 0.32));
  scene.add(new THREE.HemisphereLight(0x40536d, 0x100707, 0.72));

  const key = new THREE.DirectionalLight(0xffffff, 3.6);
  key.position.set(-12, 20, 15);
  key.castShadow = true;
  const shadowSize = window.innerWidth <= 760 ? 1024 : 1536;
  key.shadow.mapSize.set(shadowSize, shadowSize);
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 60;
  key.shadow.camera.left = -24;
  key.shadow.camera.right = 24;
  key.shadow.camera.top = 24;
  key.shadow.camera.bottom = -24;
  key.shadow.bias = -0.00008;
  key.shadow.normalBias = 0.052;
  scene.add(key);

  const coolRim = new THREE.DirectionalLight(0x9bc7ff, 0.82);
  coolRim.position.set(-14, 8, -16);
  scene.add(coolRim);

  const redWash = new THREE.PointLight(0xff2525, 0.92, 26, 2.1);
  redWash.position.set(0, 3.4, 1.2);
  scene.add(redWash);

  const lowFill = new THREE.PointLight(0xffffff, 0.52, 24, 2.2);
  lowFill.position.set(8, 4, 13);
  scene.add(lowFill);
}

function addBackground() {
  const skySphere = new THREE.Mesh(
    new THREE.SphereGeometry(92, 48, 24),
    new THREE.MeshBasicMaterial({
      map: createGalaxyTexture(),
      fog: false,
      depthWrite: false,
      side: THREE.BackSide,
    }),
  );
  skySphere.position.set(0, 10, 0);
  scene.add(skySphere);
  galaxyLayers.push({ object: skySphere, speed: 0.00018, drift: 0, axis: "y" });

  const starCount = window.innerWidth <= 760 ? 650 : 950;
  const positions = new Float32Array(starCount * 3);
  const colors = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i += 1) {
    const radius = THREE.MathUtils.randFloat(55, 87);
    const theta = THREE.MathUtils.randFloat(0, Math.PI * 2);
    const phi = THREE.MathUtils.randFloat(0.08, Math.PI * 0.88);
    positions[i * 3] = Math.cos(theta) * radius;
    positions[i * 3 + 1] = Math.cos(phi) * radius + 12;
    positions[i * 3 + 2] = Math.sin(theta) * Math.sin(phi) * radius;
    const blue = Math.random() > 0.7;
    colors[i * 3] = blue ? 0.55 : 1;
    colors[i * 3 + 1] = blue ? 0.75 : 0.95;
    colors[i * 3 + 2] = 1;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  const stars = new THREE.Points(
    geometry,
    new THREE.PointsMaterial({ size: 0.026, sizeAttenuation: true, vertexColors: true, transparent: true, opacity: 0.52, fog: false }),
  );
  scene.add(stars);
  galaxyLayers.push({ object: stars, speed: 0.0006, drift: 0, axis: "y" });
}

function createGalaxyTexture() {
  const canvasTexture = document.createElement("canvas");
  canvasTexture.width = 2048;
  canvasTexture.height = 1024;
  const ctx = canvasTexture.getContext("2d");
  const gradient = ctx.createLinearGradient(0, 0, canvasTexture.width, canvasTexture.height);
  gradient.addColorStop(0, "#020409");
  gradient.addColorStop(0.35, "#06101f");
  gradient.addColorStop(0.65, "#08172b");
  gradient.addColorStop(1, "#010307");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvasTexture.width, canvasTexture.height);
  ctx.globalCompositeOperation = "lighter";

  for (let i = 0; i < 190; i += 1) {
    const x = Math.random() * canvasTexture.width;
    const band = Math.sin((x / canvasTexture.width) * Math.PI * 2 - 0.9);
    const y = canvasTexture.height * 0.44 + band * 180 + (Math.random() - 0.5) * 220;
    const r = 55 + Math.random() * 170;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, "rgba(80, 145, 255, 0.11)");
    g.addColorStop(0.42, "rgba(38, 90, 180, 0.045)");
    g.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(x, y, r * 2.2, r * 0.2, -0.34 + band * 0.12, 0, Math.PI * 2);
    ctx.fill();
  }

  for (let i = 0; i < 1450; i += 1) {
    const x = Math.random() * canvasTexture.width;
    const y = Math.random() * canvasTexture.height;
    const s = Math.random() > 0.965 ? 2.6 : 0.75 + Math.random() * 1.2;
    ctx.fillStyle = Math.random() > 0.76 ? "rgba(146,190,255,0.82)" : "rgba(255,255,255,0.72)";
    ctx.beginPath();
    ctx.arc(x, y, s, 0, Math.PI * 2);
    ctx.fill();
  }

  drawPlanet(ctx, 35, 900, 265, "rgba(96,170,255,0.92)", true);
  drawPlanet(ctx, 1760, 210, 75, "rgba(78,150,255,0.72)", false);
  drawPlanet(ctx, 1820, 280, 17, "rgba(136,175,230,0.42)", false);
  drawPlanet(ctx, 510, 845, 34, "rgba(130,178,240,0.48)", false);

  const texture = new THREE.CanvasTexture(canvasTexture);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function drawPlanet(ctx, x, y, radius, rimColor, cityLights) {
  ctx.save();
  ctx.globalCompositeOperation = "source-over";
  const atmosphere = ctx.createRadialGradient(x + radius * 0.18, y - radius * 0.18, radius * 0.66, x, y, radius * 1.2);
  atmosphere.addColorStop(0, "rgba(0,0,0,0)");
  atmosphere.addColorStop(0.78, "rgba(0,0,0,0)");
  atmosphere.addColorStop(0.9, rimColor);
  atmosphere.addColorStop(1, "rgba(42,112,255,0)");
  ctx.fillStyle = atmosphere;
  ctx.beginPath();
  ctx.arc(x, y, radius * 1.2, 0, Math.PI * 2);
  ctx.fill();
  const body = ctx.createRadialGradient(x + radius * 0.32, y - radius * 0.28, radius * 0.1, x, y, radius);
  body.addColorStop(0, "#08172a");
  body.addColorStop(0.44, "#020407");
  body.addColorStop(1, "#000000");
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = "lighter";
  ctx.strokeStyle = rimColor;
  ctx.lineWidth = Math.max(2, radius * 0.018);
  ctx.beginPath();
  ctx.arc(x, y, radius * 1.006, -Math.PI * 0.08, Math.PI * 1.18);
  ctx.stroke();
  if (cityLights) {
    for (let i = 0; i < 90; i += 1) {
      const angle = -2.1 + Math.random() * 1.05;
      const distance = radius * (0.25 + Math.random() * 0.6);
      ctx.fillStyle = "rgba(255,150,72,0.62)";
      ctx.beginPath();
      ctx.arc(x + Math.cos(angle) * distance + Math.random() * 48, y + Math.sin(angle) * distance + Math.random() * 70, 1.2 + Math.random() * 2.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function addBase() {
  const deck = new THREE.Mesh(new THREE.BoxGeometry(31, 0.32, 28), materials.base);
  deck.position.set(0, -0.2, -0.6);
  deck.receiveShadow = true;
  scene.add(deck);

  addBox(31.5, 0.18, 0.26, 0, 0.03, 13.4, materials.bevel);
  addBox(31.5, 0.18, 0.26, 0, 0.03, -14.6, materials.bevel);
  addBox(0.26, 0.18, 28.4, -15.6, 0.03, -0.6, materials.bevel);
  addBox(0.26, 0.18, 28.4, 15.6, 0.03, -0.6, materials.bevel);

  [
    [-9.2, 7.0, 5.8, 3.7],
    [7.8, 6.1, 6.3, 3.3],
    [-10.3, -4.9, 4.6, 4.4],
    [7.1, -5.4, 5.2, 4.1],
    [-1.8, -10.6, 6.4, 2.1],
    [0.2, 10.2, 7.6, 2.0],
  ].forEach(([x, z, sx, sz]) => {
    const plate = addBox(sx, 0.026, sz, x, 0.006, z, materials.deckPanel);
    plate.castShadow = false;
  });

  [
    [-12.0, 1.7, 1.8, 0.16, 0],
    [11.8, 1.0, 2.0, 0.16, 0],
    [-4.9, 11.1, 2.4, 0.14, Math.PI * 0.5],
    [5.0, -12.4, 2.6, 0.14, Math.PI * 0.5],
    [-1.8, -1.8, 2.8, 0.12, 0.18],
    [3.7, 2.6, 2.2, 0.12, -0.32],
  ].forEach(([x, z, sx, sz, rotation]) => {
    const inset = addBox(sx, 0.018, sz, x, 0.026, z, materials.deckInset);
    inset.rotation.y = rotation;
    inset.castShadow = false;
  });

  for (let x = -13; x <= 13; x += 3.25) {
    const seam = addBox(0.018, 0.012, 26, x, 0.018, -0.6, materials.roadEdge);
    seam.castShadow = false;
  }
  for (let z = -12.5; z <= 11.5; z += 3.1) {
    const seam = addBox(29, 0.012, 0.018, 0, 0.02, z, materials.roadEdge);
    seam.castShadow = false;
  }

  [
    [-14.1, 0, -0.6, Math.PI * 0.5],
    [14.1, 0, -0.6, Math.PI * 0.5],
    [0, 0, 12.0, 0],
    [0, 0, -13.2, 0],
  ].forEach(([x, , z, rotation]) => {
    const rail = addBox(rotation ? 0.06 : 4.8, 0.055, rotation ? 4.8 : 0.06, x, 0.06, z, materials.roadEdge);
    rail.rotation.y = rotation;
  });

  for (let x = -13.4; x <= 13.4; x += 3.2) {
    addGlowDash(x, 0.12, 12.6, 0);
    addGlowDash(x, 0.12, -13.8, 0);
  }

  [
    [-6.0, 0.105, 11.7], [-2.0, 0.105, 11.7], [2.0, 0.105, 11.7], [6.0, 0.105, 11.7],
    [-6.0, 0.105, -12.9], [-2.0, 0.105, -12.9], [2.0, 0.105, -12.9], [6.0, 0.105, -12.9],
  ].forEach(([x, y, z]) => {
    const marker = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), materials.redLight);
    marker.position.set(x, y + 0.03, z);
    scene.add(marker);
  });
}

function addRoads() {
  const center = new THREE.Vector3(-1.8, 0.04, 0.4);
  sections.forEach((section) => {
    if (section.id !== "projects") {
      const bend = center.clone().lerp(section.position, 0.52);
      bend.x += section.position.x > center.x ? -0.75 : 0.75;
      bend.z += section.position.z > center.z ? -0.45 : 0.45;
      scene.add(createCurvedRoad(curve([center, bend, section.position.clone().setY(0.04)], false), 0.88, { segments: 14, dashEvery: 4 }));
    }
  });

  scene.add(createCurvedRoad(curve(vehicleRouteAPoints(0.04), true), 0.78, { segments: 58, dashEvery: 5, opacity: 0.88 }));
  scene.add(createCurvedRoad(curve(vehicleRouteBPoints(0.045), true), 0.6, { segments: 46, dashEvery: 5, opacity: 0.74 }));
}

function vehicleRouteAPoints(y = 0.075) {
  return [
    [-13.0, y, 8.2], [-8.0, y, 10.7], [-1.0, y, 10.7], [6.3, y, 9.1],
    [12.5, y, 5.2], [13.3, y, -1.8], [10.2, y, -8.7], [2.8, y, -12.0],
    [-5.7, y, -11.9], [-12.3, y, -7.8], [-13.8, y, -1.0],
  ];
}

function vehicleRouteBPoints(y = 0.082) {
  return [
    [10.3, y, -9.4], [5.8, y, -8.5], [1.6, y, -5.7], [-1.1, y, -1.4],
    [-4.6, y, 2.6], [-7.9, y, 5.1], [-9.1, y, 8.0], [-5.4, y, 9.8],
    [0.9, y, 8.7], [6.9, y, 5.1], [10.0, y, -0.1],
  ];
}

function createCurvedRoad(route, width, options = {}) {
  const group = new THREE.Group();
  const segments = options.segments ?? 48;
  const dashEvery = options.dashEvery ?? 6;
  const roadMaterial = options.opacity ? materials.road.clone() : materials.road;
  if (options.opacity) {
    roadMaterial.transparent = true;
    roadMaterial.opacity = options.opacity;
  }

  for (let i = 0; i < segments; i += 1) {
    const a = route.getPointAt(i / segments);
    const b = route.getPointAt((i + 1) / segments);
    const delta = b.clone().sub(a);
    const length = Math.max(delta.length(), 0.05);
    const slab = new THREE.Mesh(new THREE.BoxGeometry(width, 0.04, length * 1.04), roadMaterial);
    slab.position.copy(a).add(b).multiplyScalar(0.5);
    slab.position.y = 0.035;
    slab.rotation.y = Math.atan2(delta.x, delta.z);
    slab.receiveShadow = true;
    group.add(slab);

    if (options.edges !== false) {
      const rotation = slab.rotation.y;
      const side = new THREE.Vector3(Math.cos(rotation), 0, -Math.sin(rotation));
      [-1, 1].forEach((direction) => {
        const edge = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.026, length * 0.98), materials.roadEdge);
        edge.position.copy(slab.position).add(side.clone().multiplyScalar(direction * (width * 0.5 - 0.025)));
        edge.position.y = 0.064;
        edge.rotation.y = rotation;
        edge.receiveShadow = true;
        group.add(edge);
      });
    }

    if (i % dashEvery === 0) {
      const dash = new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.03, 0.36), materials.redLight);
      const t = (i + 0.5) / segments;
      const point = route.getPointAt(t);
      const tangent = route.getTangentAt(t).normalize();
      dash.position.set(point.x, 0.086, point.z);
      dash.rotation.y = Math.atan2(tangent.x, tangent.z);
      group.add(dash);
    }
  }

  return group;
}

function createRoad(from, to, width) {
  const route = curve([from.clone().setY(0.04), from.clone().lerp(to, 0.5).setY(0.04), to.clone().setY(0.04)], false);
  return createCurvedRoad(route, width, { segments: 14, dashEvery: 4 });
}

function addRoadDashes(route, group, segments, dashEvery) {
  for (let i = 0; i < segments; i += dashEvery) {
    const t = (i + 0.5) / segments;
    const point = route.getPointAt(t);
    const tangent = route.getTangentAt(t).normalize();
    const dash = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.028, 0.5), materials.redLight);
    dash.position.set(point.x, 0.085, point.z);
    dash.rotation.y = Math.atan2(tangent.x, tangent.z);
    group.add(dash);
  }
}

function addBuildings() {
  [
    [-12.4, 0.5, 0.8, 2.6, 1.1, 4.6],
    [12.1, 0.6, 1.9, 2.9, 1.2, 4.1],
    [-3.4, 0.45, 9.9, 4.2, 0.9, 1.7],
    [4.6, 0.42, -12.3, 4.8, 0.84, 1.6],
    [-12.6, 0.55, -10.4, 2.2, 1.1, 2.8],
  ].forEach(([x, y, z, sx, sy, sz]) => {
    const building = addBox(sx, sy, sz, x, y, z, materials.black);
    building.receiveShadow = true;
    for (let i = 0; i < Math.floor(sx); i += 1) addGlowDash(x - sx / 2 + 0.5 + i * 0.8, y + sy * 0.12, z + sz / 2 + 0.03, 0);
  });
}

function createLaunchPad(section, index) {
  const group = new THREE.Group();
  group.position.copy(section.position);

  const lower = new THREE.Mesh(new THREE.CylinderGeometry(2.45, 2.64, 0.46, 56), materials.black);
  lower.position.y = 0.16;
  lower.castShadow = true;
  lower.receiveShadow = true;
  group.add(lower);

  const top = new THREE.Mesh(new THREE.CylinderGeometry(2.12, 2.24, 0.16, 56), materials.base);
  top.position.y = 0.47;
  top.castShadow = true;
  top.receiveShadow = true;
  group.add(top);

  const outerRing = ring(2.22, 0.035, 0.18);
  outerRing.position.y = 0.59;
  group.add(outerRing);
  const innerRing = ring(1.2, 0.022, 0.14);
  innerRing.position.y = 0.61;
  group.add(innerRing);

  for (let i = 0; i < 10; i += 1) {
    const angle = (i / 10) * Math.PI * 2;
    const dash = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.04, 0.08), materials.redLight);
    dash.position.set(Math.cos(angle) * 1.78, 0.64, Math.sin(angle) * 1.78);
    dash.rotation.y = -angle;
    group.add(dash);
  }

  const shadow = contactShadow(3.45, 2.55, 0.42);
  shadow.position.y = 0.665;
  group.add(shadow);

  const rocket = createRocket(section.id);
  rocket.position.y = 0.58;
  group.add(rocket);

  const slide = createSlide(section, index);
  slide.group.position.set((index % 2 === 0 ? 1 : -1) * 2.72, 2.34, 1.28);
  group.add(slide.group);

  const exhaust = createExhaust();
  exhaust.group.position.set(0, 0.62, 0);
  group.add(exhaust.group);

  const tower = createTower(index);
  tower.position.set(index % 2 === 0 ? -2.6 : 2.6, 0.25, index % 3 === 0 ? -0.2 : 0.25);
  group.add(tower);

  const padLight = fakeLight(0.5);
  padLight.position.set(0, 1.25, 0);
  group.add(padLight);

  const activeHalo = ring(2.55, 0.055, 0);
  activeHalo.position.y = 0.73;
  group.add(activeHalo);

  refs.set(section.id, { group, rocket, slide, exhaust, padLight, outerRing, innerRing, activeHalo, phase: index * 0.72 });
  return group;
}

function createRocket(sectionId) {
  const group = new THREE.Group();
  group.userData.sectionId = sectionId;
  const body = addInteractive(new THREE.CylinderGeometry(0.31, 0.39, 3.05, 48, 5), materials.white, sectionId, group, 0, 2.06, 0);
  body.castShadow = true;
  const shoulder = addInteractive(new THREE.CylinderGeometry(0.36, 0.4, 0.34, 48), materials.white, sectionId, group, 0, 3.71, 0);
  shoulder.castShadow = true;
  addInteractive(new THREE.ConeGeometry(0.36, 0.98, 48), materials.white, sectionId, group, 0, 4.32, 0);
  addInteractive(new THREE.CylinderGeometry(0.365, 0.365, 0.2, 48), materials.rocketBlack, sectionId, group, 0, 2.98, 0);
  addInteractive(new THREE.CylinderGeometry(0.388, 0.388, 0.055, 48), materials.red, sectionId, group, 0, 1.18, 0);
  addInteractive(new THREE.CylinderGeometry(0.33, 0.37, 0.06, 48), materials.red, sectionId, group, 0, 3.58, 0);
  const nozzle = addInteractive(new THREE.ConeGeometry(0.31, 0.48, 32), materials.rocketBlack, sectionId, group, 0, 0.2, 0);
  nozzle.rotation.x = Math.PI;

  const panelAngles = [0, Math.PI * 0.5, Math.PI, Math.PI * 1.5];
  panelAngles.forEach((angle, i) => {
    const panel = addInteractive(new THREE.BoxGeometry(0.035, 0.52, 0.012), materials.rocketBlack, sectionId, group, Math.cos(angle) * 0.342, 2.08, Math.sin(angle) * 0.342);
    panel.rotation.y = -angle;
    panel.material = materials.rocketBlack;
    if (i % 2 === 0) {
      const redTick = addInteractive(new THREE.BoxGeometry(0.042, 0.18, 0.014), materials.red, sectionId, group, Math.cos(angle) * 0.349, 1.52, Math.sin(angle) * 0.349);
      redTick.rotation.y = -angle;
    }
  });

  [[-0.54, 0], [0.54, 0], [0, -0.54]].forEach(([x, z]) => {
    const booster = new THREE.Group();
    addInteractive(new THREE.CylinderGeometry(0.13, 0.155, 1.95, 32, 4), materials.white, sectionId, booster, 0, 0, 0);
    addInteractive(new THREE.ConeGeometry(0.145, 0.36, 32), materials.white, sectionId, booster, 0, 1.15, 0);
    const foot = addInteractive(new THREE.ConeGeometry(0.132, 0.28, 28), materials.rocketBlack, sectionId, booster, 0, -1.11, 0);
    foot.rotation.x = Math.PI;
    addInteractive(new THREE.CylinderGeometry(0.152, 0.152, 0.045, 32), materials.red, sectionId, booster, 0, 0.42, 0);
    booster.position.set(x, 1.55, z);
    group.add(booster);
  });
  [[0.42, 0, 0.12, 0.7, 0.28], [-0.42, 0, 0.12, 0.7, 0.28], [0, 0.42, 0.28, 0.7, 0.12], [0, -0.42, 0.28, 0.7, 0.12]].forEach(([x, z, sx, sy, sz]) => {
    const fin = addInteractive(new THREE.BoxGeometry(sx, sy, sz), materials.rocketBlack, sectionId, group, x, 0.72, z);
    fin.rotation.y = x ? Math.sign(x) * 0.06 : 0;
    fin.castShadow = true;
  });
  const hitbox = new THREE.Mesh(new THREE.CylinderGeometry(1.62, 1.34, 5.75, 18), materials.hitbox);
  hitbox.position.y = 2.52;
  hitbox.userData.sectionId = sectionId;
  hitTargets.push(hitbox);
  group.add(hitbox);
  return group;
}

function createSlide(section, index) {
  const group = new THREE.Group();
  const frame = new THREE.Mesh(new THREE.BoxGeometry(2.62, 1.62, 0.1), materials.black.clone());
  frame.material.emissive = new THREE.Color(0x350404);
  frame.material.emissiveIntensity = 0.42;
  frame.position.z = -0.045;
  frame.castShadow = true;
  group.add(frame);
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(2.36, 1.36), new THREE.MeshBasicMaterial({ map: createSlideTexture(section), transparent: true, opacity: 0.92 }));
  screen.position.z = 0.02;
  group.add(screen);
  const redLine = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.035, 0.04), materials.redLight);
  redLine.position.set(0, -0.61, 0.06);
  group.add(redLine);
  const glow = fakeLight(0.58);
  glow.position.set(0, 0.2, 0.5);
  group.add(glow);
  const hitbox = new THREE.Mesh(new THREE.BoxGeometry(2.82, 1.82, 0.28), materials.hitbox);
  hitbox.position.z = 0.08;
  hitbox.userData.sectionId = section.id;
  hitTargets.push(hitbox);
  group.add(hitbox);
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 1.42, 10), materials.tower);
  post.position.set(0, -1.06, -0.04);
  post.castShadow = true;
  group.add(post);
  group.rotation.y = index % 2 === 0 ? -0.55 : 0.55;
  return { group, screen, frame, glow, redLine };
}

function createSlideTexture(section) {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 304;
  const ctx = c.getContext("2d");
  const g = ctx.createLinearGradient(0, 0, c.width, c.height);
  g.addColorStop(0, "#111115");
  g.addColorStop(0.5, "#060608");
  g.addColorStop(1, "#170607");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.strokeStyle = "rgba(255, 74, 74, 0.84)";
  ctx.lineWidth = 4;
  ctx.strokeRect(18, 18, c.width - 36, c.height - 36);
  ctx.fillStyle = "rgba(255, 74, 74, 0.95)";
  ctx.fillRect(44, 70, 92, 7);
  ctx.fillStyle = "rgba(178,176,173,0.92)";
  ctx.font = "700 16px Arial, sans-serif";
  ctx.fillText("PORTFOLIO PAD", 34, 39);
  ctx.fillStyle = "#f7f6ef";
  ctx.font = "800 39px Arial, sans-serif";
  ctx.fillText(section.label.toUpperCase(), 34, 97);
  ctx.fillStyle = "rgba(255,74,74,0.9)";
  ctx.font = "700 16px Arial, sans-serif";
  ctx.fillText(section.rocketName, 34, 125);
  ctx.fillStyle = "rgba(247,246,239,0.82)";
  ctx.font = "500 19px Arial, sans-serif";
  wrapText(ctx, previewText(section), 34, 165, c.width - 68, 24, 3);
  ctx.fillStyle = "rgba(255,74,74,0.78)";
  ctx.font = "800 14px Arial, sans-serif";
  ctx.fillText("CLICK TO OPEN", 34, c.height - 33);
  const texture = new THREE.CanvasTexture(c);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function previewText(section) {
  if (section.contact) return "Email, LinkedIn, and phone contact details.";
  if (section.list) return section.list.slice(0, 2).join(" ");
  return section.paragraphs?.join(" ") ?? "";
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight, maxLines) {
  const words = text.split(/\s+/);
  let line = "";
  let lines = 0;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines += 1;
      if (lines >= maxLines) {
        ctx.fillText(`${line.replace(/[.,;:]?$/, "")}...`, x, y);
        return;
      }
      ctx.fillText(line, x, y);
      line = word;
      y += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, y);
}

function createTower(index) {
  const group = new THREE.Group();
  const height = 4.5;
  [[-0.32, -0.32], [0.32, -0.32], [-0.32, 0.32], [0.32, 0.32]].forEach(([x, z]) => {
    group.add(beam(new THREE.Vector3(x, 0, z), new THREE.Vector3(x, height, z), 0.045, materials.tower));
  });
  for (let y = 0.75; y < height - 0.35; y += 0.72) {
    group.add(beam(new THREE.Vector3(-0.32, y, -0.32), new THREE.Vector3(0.32, y + 0.42, -0.32), 0.026, materials.tower));
    group.add(beam(new THREE.Vector3(0.32, y, 0.32), new THREE.Vector3(-0.32, y + 0.42, 0.32), 0.026, materials.tower));
  }
  const deck = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.12, 0.95), materials.black);
  deck.position.y = height;
  deck.castShadow = true;
  group.add(deck);
  const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 6), materials.redLight);
  beacon.position.y = height + 0.18;
  group.add(beacon);
  const light = fakeLight(0.75);
  light.position.y = height + 0.2;
  group.add(light);
  beacons.push({ bulb: beacon, light, phase: index * 0.55 });
  return group;
}

function addLifeLayer() {
  const routeA = curve(vehicleRouteAPoints(0.075), true);
  const routeB = curve(vehicleRouteBPoints(0.082), true);
  const roverA = createRover(0xff3535, 0);
  const roverB = createRover(0xff4545, 1);
  scene.add(roverA, roverB);
  vehicles.push(vehicleAI(roverA, routeA, 0.031, 0.17, 0.13));
  vehicles.push(vehicleAI(roverB, routeB, 0.027, 0.56, -0.12));
}

function curve(points, closed = true) {
  return new THREE.CatmullRomCurve3(points.map((point) => new THREE.Vector3(...point)), closed, "centripetal", 0.45);
}

function vehicleAI(group, route, speed, progress, laneOffset) {
  const vehicle = {
    group,
    route,
    speed,
    targetSpeed: speed,
    progress,
    laneOffset,
    steer: 0,
    routeLength: route.getLength(),
    waitBias: 0.8 + Math.random() * 0.3,
  };
  lanePoint(vehicle, progress, scratch);
  group.position.copy(scratch);
  group.userData.lastPosition.copy(scratch);
  return vehicle;
}

function lanePoint(vehicle, progress, target) {
  const p = vehicle.route.getPointAt(((progress % 1) + 1) % 1);
  const tangent = vehicle.route.getTangentAt(((progress % 1) + 1) % 1).normalize();
  sideScratch.crossVectors(up, tangent).normalize().multiplyScalar(vehicle.laneOffset);
  return target.copy(p).add(sideScratch);
}

function createRover(accentColor, variant = 0) {
  const group = new THREE.Group();
  group.scale.setScalar(variant === 0 ? 0.82 : 0.78);

  const bodyMat = standard(0x090a0d, 0.5, 0.46);
  const panelMat = standard(0x1a1b20, 0.42, 0.48);
  const armorMat = standard(0x23242a, 0.46, 0.4);
  const edgeMat = standard(0x34353a, 0.5, 0.36);
  const tireMat = standard(0x020203, 0.08, 0.78);
  const treadMat = standard(0x17181c, 0.1, 0.7);
  const glassMat = materials.glass.clone();
  glassMat.color.setHex(0x070a0d);
  glassMat.emissive.setHex(0x142233);
  glassMat.emissiveIntensity = 0.28;
  glassMat.opacity = 0.68;
  const redMat = materials.redLight.clone();
  redMat.color.setHex(accentColor);
  const redGlowMat = materials.redGlow.clone();
  redGlowMat.color.setHex(accentColor);
  redGlowMat.opacity = 0.26;

  const belly = addChildBox(group, 1.56, 0.24, 2.36, 0, 0.43, 0.03, bodyMat);
  belly.receiveShadow = true;
  const chassis = addChildBox(group, 1.72, 0.16, 2.64, 0, 0.31, 0.05, edgeMat);
  chassis.rotation.x = 0.02;
  const nose = addChildBox(group, 1.34, 0.2, 0.82, 0, 0.64, -1.04, panelMat);
  nose.rotation.x = -0.2;
  const hoodPlate = addChildBox(group, 1.08, 0.035, 0.58, 0, 0.78, -1.04, armorMat);
  hoodPlate.rotation.x = -0.22;
  const bumper = addChildBox(group, 1.46, 0.18, 0.24, 0, 0.43, -1.42, edgeMat);
  bumper.rotation.x = 0.08;
  const lowerLip = addChildBox(group, 1.0, 0.12, 0.18, 0, 0.28, -1.55, bodyMat);
  lowerLip.rotation.x = 0.12;
  const cabin = addChildBox(group, 1.08, 0.56, 0.92, 0, 0.86, -0.28, panelMat);
  cabin.rotation.x = -0.07;
  const roof = addChildBox(group, 1.2, 0.14, 0.76, 0, 1.19, -0.23, armorMat);
  roof.rotation.x = -0.05;
  const roofPanel = addChildBox(group, 0.82, 0.075, 0.48, 0, 1.31, -0.18, bodyMat);
  roofPanel.rotation.x = -0.05;
  const rearBox = addChildBox(group, 1.18, 0.46, 0.78, 0, 0.73, 1.07, bodyMat);
  rearBox.rotation.x = 0.04;
  const cargoTop = addChildBox(group, 1.08, 0.08, 0.68, 0, 1.0, 1.08, armorMat);
  cargoTop.rotation.x = 0.03;
  const rearRail = addChildBox(group, 1.36, 0.13, 0.34, 0, 0.58, 1.52, edgeMat);
  rearRail.rotation.x = -0.03;

  const windshield = addChildBox(group, 1.0, 0.07, 0.72, 0, 0.99, -0.74, glassMat);
  windshield.rotation.x = -0.66;
  const windshieldTop = addChildBox(group, 1.08, 0.04, 0.055, 0, 1.18, -0.49, edgeMat);
  windshieldTop.rotation.x = -0.66;
  const windshieldBase = addChildBox(group, 1.08, 0.04, 0.055, 0, 0.78, -1.05, edgeMat);
  windshieldBase.rotation.x = -0.66;
  [-1, 1].forEach((side) => {
    const frame = addChildBox(group, 0.035, 0.045, 0.72, side * 0.52, 0.99, -0.74, edgeMat);
    frame.rotation.x = -0.66;
    frame.rotation.z = side * -0.08;
  });
  const roofGlass = addChildBox(group, 0.78, 0.055, 0.38, 0, 1.285, -0.2, glassMat);
  roofGlass.rotation.x = -0.04;
  [-1, 1].forEach((side) => {
    const sideGlass = addChildBox(group, 0.06, 0.34, 0.68, side * 0.58, 0.9, -0.18, glassMat);
    sideGlass.rotation.z = side * -0.22;
    sideGlass.rotation.x = -0.08;
    const door = addChildBox(group, 0.065, 0.5, 0.98, side * 0.74, 0.66, 0.1, panelMat);
    door.rotation.z = side * -0.2;
    const lowerArmor = addChildBox(group, 0.09, 0.2, 1.28, side * 0.84, 0.46, 0.28, armorMat);
    lowerArmor.rotation.z = side * -0.13;
    const rearCargoSide = addChildBox(group, 0.08, 0.36, 0.66, side * 0.7, 0.76, 1.13, armorMat);
    rearCargoSide.rotation.z = side * -0.08;
    const sill = addChildBox(group, 0.08, 0.1, 1.55, side * 0.86, 0.36, 0.14, edgeMat);
    sill.rotation.z = side * -0.08;
    const sideRed = addChildBox(group, 0.035, 0.08, 0.38, side * 0.91, 0.66, 1.28, redMat);
    sideRed.rotation.z = side * -0.08;
  });

  const frontBar = addChildBox(group, 0.92, 0.05, 0.052, 0, 0.58, -1.56, redMat);
  const roofBar = addChildBox(group, 0.54, 0.052, 0.06, 0, 1.36, -0.55, redMat);
  const leftHead = addChildBox(group, 0.24, 0.068, 0.045, -0.48, 0.52, -1.56, redMat);
  const rightHead = addChildBox(group, 0.24, 0.068, 0.045, 0.48, 0.52, -1.56, redMat);
  const cargoLight = addChildBox(group, 0.7, 0.05, 0.052, 0, 0.78, 1.59, redMat);
  [frontBar, roofBar, leftHead, rightHead, cargoLight].forEach((light) => {
    light.material = redMat;
  });

  const rearGlow = addChildBox(group, 0.62, 0.1, 0.045, 0, 0.64, 1.72, redGlowMat.clone());
  rearGlow.material.opacity = 0.34;
  const underglow = new THREE.Mesh(new THREE.PlaneGeometry(1.55, 1.9), redGlowMat.clone());
  underglow.material.opacity = 0.075;
  underglow.rotation.x = -Math.PI / 2;
  underglow.position.y = 0.055;
  group.add(underglow);

  const wheelRotators = [];
  const frontWheels = [];
  const tireRadius = 0.37;
  const wheelPositions = [[-0.94, -0.9, true], [0.94, -0.9, true], [-0.96, 0.9, false], [0.96, 0.9, false]];
  wheelPositions.forEach(([x, z, front]) => {
    const steering = new THREE.Group();
    steering.position.set(x, 0.34, z);
    const axle = new THREE.Group();
    steering.add(axle);

    const tire = new THREE.Mesh(new THREE.CylinderGeometry(tireRadius, tireRadius, 0.32, 28), tireMat);
    tire.rotation.z = Math.PI / 2;
    tire.castShadow = true;
    tire.receiveShadow = true;
    axle.add(tire);

    for (let i = 0; i < 12; i += 1) {
      const angle = (i / 12) * Math.PI * 2;
      const tread = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.052, 0.12), treadMat);
      tread.position.set(0, Math.cos(angle) * 0.382, Math.sin(angle) * 0.382);
      tread.rotation.x = angle;
      tread.castShadow = false;
      axle.add(tread);
    }

    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.35, 20), edgeMat);
    hub.rotation.z = Math.PI / 2;
    axle.add(hub);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.365, 16), bodyMat);
    cap.rotation.z = Math.PI / 2;
    axle.add(cap);
    const ringMesh = new THREE.Mesh(new THREE.TorusGeometry(0.265, 0.01, 6, 28), redGlowMat.clone());
    ringMesh.material.opacity = 0.32;
    ringMesh.rotation.y = Math.PI / 2;
    axle.add(ringMesh);

    const fender = addChildBox(group, 0.46, 0.12, 0.64, x, 0.67, z, armorMat);
    fender.rotation.z = Math.sign(x) * -0.08;
    fender.rotation.x = z < 0 ? -0.08 : 0.08;
    group.add(steering);
    group.add(beam(new THREE.Vector3(Math.sign(x) * 0.5, 0.52, z * 0.68), new THREE.Vector3(x * 0.92, 0.34, z), 0.035, edgeMat));
    group.add(beam(new THREE.Vector3(Math.sign(x) * 0.62, 0.66, z * 0.62), new THREE.Vector3(x * 0.88, 0.42, z), 0.015, redMat));
    wheelRotators.push(axle);
    if (front) frontWheels.push(steering);
  });

  const antennaBase = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 0.16, 8), edgeMat);
  antennaBase.position.set(0.46, 1.2, 1.18);
  group.add(antennaBase);
  const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.014, 0.78, 8), edgeMat);
  antenna.position.set(0.46, 1.62, 1.18);
  group.add(antenna);
  const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 6), redMat);
  beacon.position.set(0.46, 2.03, 1.18);
  group.add(beacon);
  const beaconLight = fakeLight(0.52);
  beaconLight.position.copy(beacon.position);
  group.add(beaconLight);

  const shadow = contactShadow(2.28, 2.45, 0.42);
  shadow.position.y = 0.008;
  group.add(shadow);
  group.userData = {
    wheelRotators,
    frontWheels,
    beacon,
    beaconLight,
    rearGlow,
    underglow,
    wheelRadius: tireRadius,
    currentSpeed: 0,
    lastPosition: new THREE.Vector3(),
  };
  return group;
}

function createExhaust() {
  const group = new THREE.Group();
  const core = sprite(exhaustTexture, 0xfff2f2, 0.2, 0.58, 1.45);
  const wide = sprite(exhaustTexture, 0xff3030, 0.1, 1.1, 1.95);
  wide.position.y = -0.2;
  group.add(core, wide);
  const glow = new THREE.Mesh(new THREE.CircleGeometry(0.8, 28), materials.redGlow.clone());
  glow.material.opacity = 0.08;
  glow.rotation.x = -Math.PI / 2;
  glow.position.y = -0.08;
  group.add(glow);
  const light = fakeLight(0.18);
  group.add(light);
  const puffs = [];
  for (let i = 0; i < 6; i += 1) {
    const puff = sprite(steamTexture, 0xd9d9d9, 0.04, 0.34, 0.34);
    puff.userData = { angle: (i / 6) * Math.PI * 2, radius: 0.34 + (i % 3) * 0.16, speed: 0.14 + i * 0.018, phase: i / 6 };
    group.add(puff);
    puffs.push(puff);
  }
  return { group, core, wide, glow, light, puffs };
}

function animate() {
  const delta = Math.min(clock.getDelta(), 0.05);
  const elapsed = clock.elapsedTime;
  const motion = perf.animationScale;
  updateCameraFlight(elapsed, delta);
  camera.lookAt(currentLookAt);

  galaxyLayers.forEach((layer) => {
    layer.object.rotation[layer.axis ?? "z"] += delta * layer.speed;
    layer.object.position.x += Math.sin(elapsed * 0.045 + layer.speed * 1000) * layer.drift * delta;
  });
  animateVehicles(elapsed, delta);
  beacons.forEach((beacon) => {
    const pulse = Math.max(0, Math.sin(elapsed * 4.4 + beacon.phase));
    beacon.light.intensity = 0.4 + pulse * 2.2;
    beacon.bulb.scale.setScalar(0.9 + pulse * 0.45);
  });

  refs.forEach((ref, id) => {
    const isActive = selectedId === id;
    const isHovered = hoveredId === id;
    const thrust = isActive ? 1 : isHovered ? 0.62 : 0.28;
    const bob = (isActive ? 0.12 : isHovered ? 0.08 : 0.045) * motion;
    const lift = (isActive ? 0.16 : isHovered ? 0.08 : 0.02) * motion;
    const flicker = 0.5 + Math.sin(elapsed * 13.2 + ref.phase * 2.1) * 0.5;
    ref.rocket.position.y = 0.58 + lift + Math.sin(elapsed * 1.55 + ref.phase) * bob;
    ref.rocket.rotation.y = Math.sin(elapsed * 0.52 + ref.phase) * (isActive ? 0.07 : 0.04);
    ref.rocket.rotation.x = Math.sin(elapsed * 0.82 + ref.phase) * (isActive ? 0.018 : 0.01);
    ref.padLight.intensity = THREE.MathUtils.damp(ref.padLight.intensity, isActive ? 3.45 : isHovered ? 2.15 : 0.48, 5.5, delta);
    dampOpacity(ref.outerRing.material, isActive ? 0.78 : isHovered ? 0.54 : 0.2, delta);
    dampOpacity(ref.innerRing.material, isActive ? 0.46 : isHovered ? 0.34 : 0.16, delta);
    dampOpacity(ref.activeHalo.material, isActive ? 0.52 : isHovered ? 0.28 : 0, delta);
    animateExhaust(ref.exhaust, thrust, flicker, elapsed, delta, ref.phase);
    animateSlide(ref.slide, isActive, isHovered, elapsed, delta, ref.phase);
  });

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

function animateVehicles(elapsed, delta) {
  vehicles.forEach((vehicle, index) => {
    lanePoint(vehicle, vehicle.progress, scratch);
    const tangent = vehicle.route.getTangentAt(vehicle.progress).normalize();
    const lookAhead = THREE.MathUtils.clamp(0.024 + vehicle.group.userData.currentSpeed * 0.9, 0.026, 0.058);
    const future = vehicle.route.getTangentAt((vehicle.progress + lookAhead) % 1).normalize();
    const farFuture = vehicle.route.getTangentAt((vehicle.progress + lookAhead * 2.1) % 1).normalize();
    const corner = Math.max(tangent.angleTo(future), future.angleTo(farFuture) * 0.72);
    let desired = vehicle.speed * vehicle.waitBias * THREE.MathUtils.clamp(1.08 - corner * 2.45, 0.44, 1.08);
    const centerDistance = Math.hypot(scratch.x + 1.8, scratch.z - 0.4);
    if (centerDistance < 3.4) desired *= THREE.MathUtils.lerp(0.7, 1, centerDistance / 3.4);

    vehicles.forEach((other) => {
      if (other !== vehicle) {
        const distance = scratch.distanceTo(other.group.position);
        if (distance < 3.1) {
          const otherTangent = other.route.getTangentAt(other.progress).normalize();
          const sameFlow = tangent.dot(otherTangent) > -0.35;
          const yieldAmount = THREE.MathUtils.clamp(THREE.MathUtils.mapLinear(distance, 1.0, 3.1, 0.16, sameFlow ? 0.92 : 0.78), 0.12, 0.94);
          desired *= yieldAmount;
        }
      }
    });
    const response = desired < vehicle.group.userData.currentSpeed ? 4.8 : 1.8;
    vehicle.group.userData.currentSpeed = THREE.MathUtils.damp(vehicle.group.userData.currentSpeed, desired, response, delta);
    vehicle.progress = (vehicle.progress + vehicle.group.userData.currentSpeed * delta) % 1;
    lanePoint(vehicle, vehicle.progress, scratch);
    lanePoint(vehicle, vehicle.progress + lookAhead, lookScratch);
    vehicle.group.position.copy(scratch);
    vehicle.group.position.y += Math.sin(elapsed * 6.2 + index) * 0.006;
    lookObject.position.copy(scratch);
    lookObject.lookAt(lookScratch);
    vehicle.group.quaternion.slerp(lookObject.quaternion, 1 - Math.exp(-4.6 * delta));
    const moved = scratch.distanceTo(vehicle.group.userData.lastPosition);
    vehicle.group.userData.lastPosition.copy(scratch);
    vehicle.group.userData.wheelRotators.forEach((wheel) => {
      wheel.rotation.x -= moved / vehicle.group.userData.wheelRadius;
    });
    const steer = Math.sign(tangent.clone().cross(future).y || 0) * THREE.MathUtils.clamp(corner * 2.05, 0, 0.34);
    vehicle.steer = THREE.MathUtils.damp(vehicle.steer, steer, 7.2, delta);
    vehicle.group.userData.frontWheels.forEach((wheelGroup) => {
      wheelGroup.rotation.y = vehicle.steer;
    });
    const pulse = 0.45 + Math.sin(elapsed * 8.5 + index) * 0.35;
    vehicle.group.userData.beaconLight.intensity = 0.42 + pulse * 0.56;
    vehicle.group.userData.beacon.scale.setScalar(1 + pulse * 0.5);
    vehicle.group.userData.rearGlow.material.opacity = 0.2 + (vehicle.group.userData.currentSpeed / vehicle.speed) * 0.18;
    vehicle.group.userData.underglow.material.opacity = 0.05 + pulse * 0.06;
  });
}

function animateSlide(slide, isActive, isHovered, elapsed, delta, phase) {
  slide.group.getWorldPosition(scratch);
  lookScratch.set(camera.position.x, scratch.y, camera.position.z);
  slide.group.lookAt(lookScratch);
  slide.group.position.y = 2.34 + Math.sin(elapsed * 1.2 + phase + 1.8) * (isActive ? 0.08 : isHovered ? 0.05 : 0.025);
  const scale = isActive ? 1.08 : isHovered ? 1.04 : 1;
  slide.group.scale.lerp(new THREE.Vector3(scale, scale, scale), 1 - Math.exp(-6 * delta));
  slide.glow.intensity = THREE.MathUtils.damp(slide.glow.intensity, isActive ? 1.8 : isHovered ? 1.05 : 0.48, 7, delta);
  slide.screen.material.opacity = THREE.MathUtils.damp(slide.screen.material.opacity, isActive ? 1 : isHovered ? 0.98 : 0.9, 7, delta);
  slide.redLine.scale.x = 1 + Math.sin(elapsed * 3 + phase) * (isActive ? 0.08 : 0.03);
}

function animateExhaust(exhaust, thrust, flicker, elapsed, delta, phase) {
  exhaust.core.material.opacity = THREE.MathUtils.damp(exhaust.core.material.opacity, 0.08 + thrust * 0.3 + flicker * 0.08, 9, delta);
  exhaust.wide.material.opacity = THREE.MathUtils.damp(exhaust.wide.material.opacity, 0.04 + thrust * 0.18 + flicker * 0.05, 9, delta);
  exhaust.glow.material.opacity = THREE.MathUtils.damp(exhaust.glow.material.opacity, 0.05 + thrust * 0.18 + flicker * 0.04, 9, delta);
  exhaust.light.intensity = THREE.MathUtils.damp(exhaust.light.intensity, 0.22 + thrust * 1.15, 8, delta);
  exhaust.core.scale.set(0.42 + thrust * 0.24 + flicker * 0.08, 1.05 + thrust * 0.9 + flicker * 0.28, 1);
  exhaust.wide.scale.set(0.86 + thrust * 0.32 + flicker * 0.12, 1.55 + thrust * 1.1 + flicker * 0.34, 1);
  exhaust.puffs.forEach((puff) => {
    const cycle = (elapsed * puff.userData.speed + puff.userData.phase + phase * 0.08) % 1;
    const angle = puff.userData.angle + elapsed * 0.18;
    const radius = puff.userData.radius + cycle * (0.72 + thrust * 0.28);
    puff.position.set(Math.cos(angle) * radius, -0.1 + cycle * 0.34, Math.sin(angle) * radius);
    puff.scale.setScalar((0.22 + cycle * 0.62) * (0.88 + thrust * 0.3));
    puff.material.opacity = (0.025 + thrust * 0.09) * Math.sin(cycle * Math.PI);
  });
}

function bindEvents() {
  window.addEventListener("resize", onResize);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerdown", (event) => {
    const id = getIdFromPointer(event);
    if (id) selectSection(id);
  });
  canvas.addEventListener("pointerleave", () => setHovered(null));
  closeButton.addEventListener("click", returnToBase);
  dockButtons.forEach((button) => {
    button.addEventListener("click", () => selectSection(button.dataset.section));
    button.addEventListener("mouseenter", () => setHovered(button.dataset.section));
    button.addEventListener("mouseleave", () => setHovered(null));
  });
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  perf.pixelRatio = Math.min(window.devicePixelRatio || 1, window.innerWidth <= 760 ? 1.15 : 1.35);
  renderer.setPixelRatio(perf.pixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  const nextMode = getResponsiveMode();
  if (nextMode !== responsiveMode) {
    responsiveMode = nextMode;
    const view = selectedId ? sectionCameraView(byId.get(selectedId)) : baseCameraView();
    startCameraFlight(view, 0.75);
  } else {
    targetFov = selectedId ? sectionCameraView(byId.get(selectedId)).fov : baseCameraView().fov;
  }
}

function onPointerMove(event) {
  const id = getIdFromPointer(event);
  setHovered(id);
  canvas.style.cursor = id ? "pointer" : "default";
}

function getIdFromPointer(event) {
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  return raycaster.intersectObjects(hitTargets, false)[0]?.object.userData.sectionId ?? null;
}

function setHovered(id) {
  if (hoveredId === id) return;
  hoveredId = id;
}

function selectSection(id) {
  const section = byId.get(id);
  if (!section) return;
  selectedId = id;
  document.body.classList.add("panel-open");
  panel.classList.remove("visible");
  panel.setAttribute("aria-hidden", "true");
  clearTimeout(panelTimer);
  updatePanel(section);
  updateDockButtons();
  const duration = startCameraFlight(sectionCameraView(section));
  const delay = Math.round(duration * 680);
  panelTimer = setTimeout(() => {
    panel.classList.add("visible");
    panel.setAttribute("aria-hidden", "false");
  }, delay);
}

function returnToBase() {
  selectedId = null;
  document.body.classList.remove("panel-open");
  clearTimeout(panelTimer);
  panel.classList.remove("visible");
  panel.setAttribute("aria-hidden", "true");
  startCameraFlight(baseCameraView(), 1.08);
  updateDockButtons();
}

function updatePanel(section) {
  panelKicker.textContent = `${section.label} Section`;
  panelTitle.textContent = section.rocketName;
  panelContent.replaceChildren();
  if (section.intro) panelContent.append(paragraph(section.intro));
  section.paragraphs?.forEach((text) => panelContent.append(paragraph(text)));
  if (section.list) {
    const list = document.createElement("ul");
    section.list.forEach((text) => {
      const item = document.createElement("li");
      item.textContent = text;
      list.append(item);
    });
    panelContent.append(list);
  }
  if (section.contact) {
    panelContent.append(paragraph("Contact:"));
    const list = document.createElement("div");
    list.className = "contact-list";
    section.contact.forEach((item) => {
      const row = item.href ? document.createElement("a") : document.createElement("span");
      row.textContent = `${item.label}: ${item.value}`;
      if (item.href) row.href = item.href;
      list.append(row);
    });
    panelContent.append(list);
  }
}

function paragraph(text) {
  const p = document.createElement("p");
  p.textContent = text;
  return p;
}

function updateDockButtons() {
  dockButtons.forEach((button) => button.classList.toggle("active", button.dataset.section === (selectedId ?? "home")));
}

function addInteractive(geometry, material, sectionId, parent, x, y, z) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  mesh.userData.sectionId = sectionId;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function addBox(sx, sy, sz, x, y, z, material) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), material);
  mesh.position.set(x, y, z);
  mesh.castShadow = false;
  mesh.receiveShadow = true;
  scene.add(mesh);
  return mesh;
}

function addChildBox(parent, sx, sy, sz, x, y, z, material) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), material);
  mesh.position.set(x, y, z);
  mesh.castShadow = false;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function addGlowDash(x, y, z, rotationY) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.035, 0.08), materials.redLight);
  mesh.position.set(x, y, z);
  mesh.rotation.y = rotationY;
  mesh.castShadow = false;
  scene.add(mesh);
  return mesh;
}

function ring(radius, tube, opacity) {
  const material = materials.redGlow.clone();
  material.opacity = opacity;
  const mesh = new THREE.Mesh(new THREE.TorusGeometry(radius, tube, 8, 48), material);
  mesh.rotation.x = Math.PI / 2;
  return mesh;
}

function contactShadow(width, depth, opacity) {
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(width, depth),
    new THREE.MeshBasicMaterial({ map: softShadowTexture, color: 0x000000, transparent: true, opacity, depthWrite: false }),
  );
  mesh.rotation.x = -Math.PI / 2;
  return mesh;
}

function beam(start, end, radius, material) {
  const direction = end.clone().sub(start);
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, direction.length(), 8), material);
  mesh.position.copy(start).add(end).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  mesh.castShadow = false;
  return mesh;
}

function sprite(texture, color, opacity, sx, sy) {
  const spriteMesh = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false }));
  spriteMesh.scale.set(sx, sy, 1);
  return spriteMesh;
}

function dampOpacity(material, target, delta) {
  material.opacity = THREE.MathUtils.damp(material.opacity, target, 7, delta);
}

function createSoftDiscTexture() {
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 128;
  const ctx = c.getContext("2d");
  const g = ctx.createRadialGradient(64, 64, 4, 64, 64, 64);
  g.addColorStop(0, "rgba(0,0,0,0.5)");
  g.addColorStop(0.46, "rgba(0,0,0,0.22)");
  g.addColorStop(0.78, "rgba(0,0,0,0.08)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

function createExhaustTexture() {
  const c = document.createElement("canvas");
  c.width = 96;
  c.height = 192;
  const ctx = c.getContext("2d");
  const g = ctx.createRadialGradient(48, 26, 2, 48, 94, 84);
  g.addColorStop(0, "rgba(255,255,255,0.86)");
  g.addColorStop(0.18, "rgba(255,70,70,0.72)");
  g.addColorStop(0.58, "rgba(255,24,24,0.24)");
  g.addColorStop(1, "rgba(255,24,24,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 96, 192);
  return new THREE.CanvasTexture(c);
}

function createSteamTexture() {
  const c = document.createElement("canvas");
  c.width = 96;
  c.height = 96;
  const ctx = c.getContext("2d");
  const g = ctx.createRadialGradient(48, 48, 4, 48, 48, 46);
  g.addColorStop(0, "rgba(255,255,255,0.28)");
  g.addColorStop(0.45, "rgba(170,170,170,0.11)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 96, 96);
  return new THREE.CanvasTexture(c);
}
