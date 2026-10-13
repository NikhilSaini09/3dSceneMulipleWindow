import WindowManager from "./WindowManager.js";

// Use local Three.js if loaded via index.html, otherwise fallback to CDN
let THREE = window.THREE;
if (!THREE) {
    const module = await import('https://cdn.jsdelivr.net/npm/three@0.124.0/build/three.module.js');
    THREE = module;
}

const t = THREE;
let rotationStart;
let camera, scene, renderer, world;
let pixR = window.devicePixelRatio ? window.devicePixelRatio : 1;
let geometries = [];
let sceneOffsetTarget = { x: 0, y: 0 };
let sceneOffset = { x: 0, y: 0 };

let windowManager;
let initialized = false;
let currentAnimIndex = 0;

// =========================================================================
// 3D Animation Definitions (6 Diverse Geometric Styles)
// =========================================================================
const ANIMATION_TYPES = [
    {
        name: "Breathing Torus",
        create: (s, color) => {
            const geo = new t.TorusGeometry(s, s * 0.6, 18, 36);
            const mat = new t.MeshBasicMaterial({ color, wireframe: true });
            return new t.Mesh(geo, mat);
        },
        update: (obj, ctime) => {
            obj.rotation.x = ctime * 0.5;
            obj.rotation.y = ctime * 0.3;
            obj.rotation.z = ctime * 0.4;
            const scaleFactor = 1 + 0.22 * Math.sin(2 * ctime);
            obj.scale.set(scaleFactor, scaleFactor, scaleFactor);
        }
    },
    {
        name: "Cosmic Torus Knot",
        create: (s, color) => {
            const geo = new t.TorusKnotGeometry(s * 0.75, s * 0.22, 110, 16, 2, 3);
            const mat = new t.MeshBasicMaterial({ color, wireframe: true });
            return new t.Mesh(geo, mat);
        },
        update: (obj, ctime) => {
            obj.rotation.x = ctime * 0.4;
            obj.rotation.y = ctime * 0.65;
            obj.rotation.z = ctime * 0.25;
            const scaleFactor = 1 + 0.16 * Math.sin(3 * ctime);
            obj.scale.set(scaleFactor, scaleFactor, scaleFactor);
        }
    },
    {
        name: "Geodesic Dual Orb",
        create: (s, color) => {
            const group = new t.Group();
            const geoOuter = new t.IcosahedronGeometry(s * 1.15, 1);
            const matOuter = new t.MeshBasicMaterial({ color, wireframe: true, transparent: true, opacity: 0.85 });
            const meshOuter = new t.Mesh(geoOuter, matOuter);

            const geoInner = new t.OctahedronGeometry(s * 0.6, 0);
            const matInner = new t.MeshBasicMaterial({ color: 0xffffff, wireframe: true });
            const meshInner = new t.Mesh(geoInner, matInner);

            group.add(meshOuter);
            group.add(meshInner);
            group.meshOuter = meshOuter;
            group.meshInner = meshInner;
            return group;
        },
        update: (group, ctime) => {
            group.rotation.x = ctime * 0.35;
            group.rotation.y = ctime * 0.5;
            if (group.meshInner) {
                group.meshInner.rotation.x = -ctime * 0.8;
                group.meshInner.rotation.y = -ctime * 0.6;
                const innerScale = 1 + 0.3 * Math.cos(3.5 * ctime);
                group.meshInner.scale.set(innerScale, innerScale, innerScale);
            }
            const scaleFactor = 1 + 0.18 * Math.sin(2 * ctime);
            group.scale.set(scaleFactor, scaleFactor, scaleFactor);
        }
    },
    {
        name: "Quantum Hypercube",
        create: (s, color) => {
            const group = new t.Group();
            const geoOuter = new t.BoxGeometry(s * 1.25, s * 1.25, s * 1.25);
            const matOuter = new t.MeshBasicMaterial({ color, wireframe: true });
            const meshOuter = new t.Mesh(geoOuter, matOuter);

            const geoInner = new t.BoxGeometry(s * 0.65, s * 0.65, s * 0.65);
            const matInner = new t.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: 0.7 });
            const meshInner = new t.Mesh(geoInner, matInner);

            group.add(meshOuter);
            group.add(meshInner);
            group.meshOuter = meshOuter;
            group.meshInner = meshInner;
            return group;
        },
        update: (group, ctime) => {
            group.rotation.x = ctime * 0.55;
            group.rotation.y = ctime * 0.45;
            group.rotation.z = ctime * 0.35;
            if (group.meshInner) {
                group.meshInner.rotation.x = -ctime * 0.9;
                group.meshInner.rotation.y = -ctime * 0.5;
            }
            const scaleFactor = 1 + 0.2 * Math.sin(2.4 * ctime);
            group.scale.set(scaleFactor, scaleFactor, scaleFactor);
        }
    },
    {
        name: "Gyroscopic Astrolabe",
        create: (s, color) => {
            const group = new t.Group();
            const r1 = new t.Mesh(new t.TorusGeometry(s * 1.2, s * 0.05, 8, 48), new t.MeshBasicMaterial({ color, wireframe: true }));
            const r2 = new t.Mesh(new t.TorusGeometry(s * 0.9, s * 0.05, 8, 48), new t.MeshBasicMaterial({ color: 0xffffff, wireframe: true }));
            const r3 = new t.Mesh(new t.TorusGeometry(s * 0.6, s * 0.05, 8, 48), new t.MeshBasicMaterial({ color, wireframe: true }));
            group.add(r1);
            group.add(r2);
            group.add(r3);
            group.r1 = r1;
            group.r2 = r2;
            group.r3 = r3;
            return group;
        },
        update: (group, ctime) => {
            if (group.r1) {
                group.r1.rotation.x = ctime * 0.8;
                group.r1.rotation.y = ctime * 0.2;
            }
            if (group.r2) {
                group.r2.rotation.y = ctime * 1.1;
                group.r2.rotation.z = ctime * 0.5;
            }
            if (group.r3) {
                group.r3.rotation.z = ctime * 1.4;
                group.r3.rotation.x = ctime * 0.7;
            }
            const scaleFactor = 1 + 0.15 * Math.sin(1.8 * ctime);
            group.scale.set(scaleFactor, scaleFactor, scaleFactor);
        }
    },
    {
        name: "Crystal Dodecahedron",
        create: (s, color) => {
            const geo = new t.DodecahedronGeometry(s * 1.05, 0);
            const mat = new t.MeshBasicMaterial({ color, wireframe: true });
            return new t.Mesh(geo, mat);
        },
        update: (obj, ctime) => {
            obj.rotation.x = ctime * 0.38;
            obj.rotation.y = ctime * 0.58;
            obj.rotation.z = ctime * 0.28;
            const scaleFactor = 1 + 0.2 * Math.sin(2.2 * ctime);
            obj.scale.set(scaleFactor, scaleFactor, scaleFactor);
        }
    }
];

// Check for reset query parameter
if (new URLSearchParams(window.location.search).get("clear")) {
    localStorage.clear();
}

// Lifecycle listeners
window.onload = () => {
    if (document.visibilityState !== "hidden") {
        init();
    }
};

document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "hidden" && !initialized) {
        init();
    }
});

function init() {
    initialized = true;

    if (!localStorage.getItem("rotationStart")) {
        localStorage.setItem("rotationStart", Date.now());
    }

    rotationStart = +localStorage.getItem("rotationStart");

    // Optional Wayland coordinate notice for Linux users
    if (window.screenX === 0 && window.screenY === 0) {
        console.warn(
            "[WindowManager] window.screenX/Y are 0. On Linux (Wayland), window positioning is isolated by the compositor. " +
            "Run on Windows, or an X11/Xorg session to enable cross-window tracking."
        );
    }

    setTimeout(() => {
        setupScene();
        resize();
        updateWindowShape(false);
        setupWindowManager();
        setupInteraction();
        render();
        window.addEventListener("resize", resize);
    }, 500);
}

function setupScene() {
    camera = new t.OrthographicCamera(0, window.innerWidth, 0, window.innerHeight, -10000, 10000);
    camera.position.z = 2.5;

    scene = new t.Scene();
    scene.background = new t.Color(0x000000);
    scene.add(camera);

    renderer = new t.WebGLRenderer({ antialias: true, depthBuffer: true });
    renderer.setPixelRatio(pixR);

    world = new t.Object3D();
    scene.add(world);

    renderer.domElement.setAttribute("id", "scene");
    document.body.appendChild(renderer.domElement);
}

function resize() {
    let width = window.innerWidth;
    let height = window.innerHeight;

    camera.left = 0;
    camera.right = width;
    camera.top = 0;
    camera.bottom = height;
    camera.updateProjectionMatrix();

    renderer.setSize(width, height);
}

function updateWindowShape(easing = true) {
    sceneOffsetTarget = { x: -window.screenX, y: -window.screenY };
    if (!easing) sceneOffset = sceneOffsetTarget;
}

function setupWindowManager() {
    windowManager = new WindowManager();
    windowManager.setWinShapeChangeCallback(updateWindowShape);
    windowManager.setWinChangeCallback(windowsUpdated);

    // Initial window metadata with default or staggered animation
    let existingWins = windowManager.getWindows() || [];
    currentAnimIndex = existingWins.length % ANIMATION_TYPES.length;

    let metaData = {
        role: "window",
        createdAt: Date.now(),
        title: document.title,
        animIndex: currentAnimIndex
    };

    windowManager.init(metaData);
    updateHud();
    windowsUpdated();
}

function windowsUpdated() {
    let wins = windowManager.getWindows();

    geometries.forEach((c) => {
        world.remove(c);
    });

    geometries = [];

    for (let i = 0; i < wins.length; i++) {
        let win = wins[i];

        let c = new t.Color();
        c.setHSL((i * 0.18) % 1.0, 1.0, 0.55);

        let s = 110 + (i % 5) * 30;

        let animIndex = (win.metaData && typeof win.metaData.animIndex === "number")
            ? win.metaData.animIndex
            : i % ANIMATION_TYPES.length;

        let animDef = ANIMATION_TYPES[animIndex % ANIMATION_TYPES.length];
        let obj = animDef.create(s, c);
        obj.animIndex = animIndex % ANIMATION_TYPES.length;

        obj.position.x = win.shape.x + (win.shape.w * 0.5);
        obj.position.y = win.shape.y + (win.shape.h * 0.5);

        world.add(obj);
        geometries.push(obj);
    }
}

// =========================================================================
// Interactive Controls (Click around center to switch animation)
// =========================================================================
function setupInteraction() {
    // Dynamic cursor feedback when hovering near the center
    window.addEventListener("pointermove", (e) => {
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        const dist = Math.hypot(e.clientX - centerX, e.clientY - centerY);
        const radius = Math.min(window.innerWidth, window.innerHeight) * 0.38;

        document.body.style.cursor = (dist <= radius) ? "pointer" : "default";
    });

    // Click near center to cycle animation
    window.addEventListener("pointerdown", (e) => {
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        const dist = Math.hypot(e.clientX - centerX, e.clientY - centerY);
        const radius = Math.min(window.innerWidth, window.innerHeight) * 0.38;

        if (dist <= radius) {
            cycleAnimation();
        }
    });

    // Keyboard support: Space / Arrow keys to cycle, 'C' to clear
    window.addEventListener("keydown", (e) => {
        if (e.code === "Space" || e.key === "ArrowRight") {
            e.preventDefault();
            cycleAnimation();
        } else if (e.key === "ArrowLeft") {
            e.preventDefault();
            currentAnimIndex = (currentAnimIndex - 1 + ANIMATION_TYPES.length) % ANIMATION_TYPES.length;
            applyAnimationChange();
        } else if (e.key >= "1" && e.key <= String(ANIMATION_TYPES.length)) {
            currentAnimIndex = parseInt(e.key, 10) - 1;
            applyAnimationChange();
        } else if (e.key.toLowerCase() === "c") {
            localStorage.clear();
            location.reload();
        }
    });
}

function cycleAnimation() {
    currentAnimIndex = (currentAnimIndex + 1) % ANIMATION_TYPES.length;
    applyAnimationChange();
}

function applyAnimationChange() {
    let thisData = windowManager.getThisWindowData();
    let meta = thisData ? { ...thisData.metaData, animIndex: currentAnimIndex } : { animIndex: currentAnimIndex };
    windowManager.setMetaData(meta);
    updateHud();
    windowsUpdated();
}

function updateHud() {
    const hudIndex = document.getElementById("hud-index");
    const hudName = document.getElementById("hud-name");
    const animDef = ANIMATION_TYPES[currentAnimIndex];
    if (hudIndex) hudIndex.textContent = `${currentAnimIndex + 1} / ${ANIMATION_TYPES.length}`;
    if (hudName) hudName.textContent = animDef ? animDef.name : "";
}

// =========================================================================
// Render Loop
// =========================================================================
function render() {
    let ctime = (Date.now() - rotationStart) / 1000;

    windowManager.update();

    let falloff = 0.05;
    sceneOffset.x += (sceneOffsetTarget.x - sceneOffset.x) * falloff;
    sceneOffset.y += (sceneOffsetTarget.y - sceneOffset.y) * falloff;

    world.position.x = sceneOffset.x;
    world.position.y = sceneOffset.y;

    let wins = windowManager.getWindows();

    for (let i = 0; i < geometries.length; i++) {
        let geometry = geometries[i];
        let win = wins[i];

        if (!win) continue;

        let posTarget = {
            x: win.shape.x + (win.shape.w * 0.5),
            y: win.shape.y + (win.shape.h * 0.5)
        };

        geometry.position.x += (posTarget.x - geometry.position.x) * falloff;
        geometry.position.y += (posTarget.y - geometry.position.y) * falloff;

        let animIndex = geometry.animIndex !== undefined ? geometry.animIndex : 0;
        let animDef = ANIMATION_TYPES[animIndex % ANIMATION_TYPES.length];
        if (animDef && animDef.update) {
            animDef.update(geometry, ctime);
        }
    }

    renderer.render(scene, camera);
    requestAnimationFrame(render);
}
