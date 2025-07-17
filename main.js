import WindowManager from "./WindowManager.js";
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.124.0/build/three.module.js';

const t = THREE;
let rotationStart;
let camera, scene, renderer, world;
// let near, far;
let pixR = window.devicePixelRatio ? window.devicePixelRatio : 1;
let geometries = [];
let sceneOffsetTarget = {x: 0, y: 0};
let sceneOffset = {x:0, y: 0};

let windowManager;
let initialized = false;

// let today = new Date();
// today.setHours(0);
// today.setHours(0);
// today.setMinutes(0);
// today.setMilliseconds(0);
// today = today.getTime();  // milliseconds from 1 jan 1970 to today's day start

// function getTime() {
//     return (new Date().getTime() - today) / 1000.0; // seconds from the day start to this exact moment
// }

// if (new URLSearchParams(window.location.search).get("clear")) {
//     localStorage.clear();
// } else {
    window.onload = () => {
        if(document.visibilityState != 'hidden') {
            init();
        }
    }

    document.addEventListener("visibilitychange", () => {
        if(document.visibilityState != 'hidden' && !initialized) {
            init();
        }
    });

    function init() {
        initialized = true;

        if (!localStorage.getItem("rotationStart")) {
            localStorage.setItem("rotationStart", Date.now());
        }

		rotationStart = +localStorage.getItem("rotationStart");

        setTimeout(() => {
            setupScene();
            resize();
            updateWindowShape(false);
            setupWindowManager();
            render();
            window.addEventListener("resize", resize);
        }, 500);
    }

    function setupScene() {
        camera = new t.OrthographicCamera(0, window.innerWidth, 0, window.innerHeight, -10000, 10000);

        camera.position.z = 2.5;
        // near = camera.position.z - 0.5;
        // far  = camera.position.z + 0.5;

                // for perspective camera
        // const fov    = 75;
        // let aspect = window.innerWidth / window.innerHeight;
        // const near   = 0.1;
        // const far    = 10000;

        // camera = new t.PerspectiveCamera(fov, aspect, near, far);
        // camera.position.set(0, 0, 1000);
        // camera.lookAt(0, 0, 0);

        scene = new t.Scene();

        scene.background = new t.Color(0.0);
        // scene.background = new t.Color(0x09ff00);
        // scene.background = new t.Color('#abcdef');
        // scene.background = new t.Color(0.2,0.2,0.2);

        scene.add(camera);

        renderer = new t.WebGLRenderer({antialias: true, depthBuffer: true});
        renderer.setPixelRatio(pixR);

        world = new t.Object3D();
        scene.add(world);

        renderer.domElement.setAttribute("id", "scene");
        document.body.appendChild(renderer.domElement);
    }

    function resize() {
        let width  = window.innerWidth;
        let height = window.innerHeight;

        camera = new t.OrthographicCamera(0, width, 0, height, -10000, 10000);

        // aspect = width / height;
		// const fov    = 120;
        // const near   = 0.1;
        // const far    = 10000;
        // camera = new t.PerspectiveCamera(fov, aspect, near, far);
		// camera.position.set(1500, 600, 0);
        // camera.lookAt(0, 0, 0);

        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
    }

    function updateWindowShape(easing = true) {
        sceneOffsetTarget = {x: -window.screenX, y: -window.screenY};
        if(!easing) sceneOffset = sceneOffsetTarget;
    }

    function setupWindowManager() {
        windowManager = new WindowManager();
		windowManager.setWinShapeChangeCallback(updateWindowShape);
		windowManager.setWinChangeCallback(windowsUpdated);

        // let metaData = {foo: "bar"};
        let metaData = {
            role: "editor",
            createdAt: Date.now(),
            title: document.title
        };

        windowManager.init(metaData);
        windowsUpdated();
    }

    function windowsUpdated() {
        let wins = windowManager.getWindows();

		geometries.forEach((c) => {
			world.remove(c);
		})

		geometries = [];

        for(let i=0; i<wins.length; i++) {
            let win = wins[i];

            let c = new t.Color();
            c.setHSL(i*0.1, 1.0, 0.5);

            let s = 100 + i*50;
            // let typeOfGeometry = new t.BoxGeometry(s, s, s);
            let typeOfGeometry = new t.TorusGeometry(s, s*3/5, 16, 32);
            // let typeOfGeometry = new t.TorusKnotGeometry(s, s/5, 100, 16, 2, 3);

            let geometry = new t.Mesh(typeOfGeometry, new t.MeshBasicMaterial({color: c, wireframe:true}));
            geometry.position.x = win.shape.x + (win.shape.w * 0.5);
            geometry.position.y = win.shape.y + (win.shape.h * 0.5);

            world.add(geometry);
            geometries.push(geometry);
        }
    }

    function render() {
        // let ctime = getTime();
        let ctime = (Date.now() - rotationStart) / 1000;

        windowManager.update();

        let falloff = 0.05;
        sceneOffset.x += (sceneOffsetTarget.x - sceneOffset.x) * falloff;
        sceneOffset.y += (sceneOffsetTarget.y - sceneOffset.y) * falloff;

        world.position.x = sceneOffset.x;
        world.position.y = sceneOffset.y;

        let wins = windowManager.getWindows();

        for(let i=0; i<geometries.length; i++) {
            let geometry = geometries[i];
            let win = wins[i];

            let posTarget = {x: win.shape.x + (win.shape.w*0.5), y: win.shape.y + (win.shape.h*0.5)};

            geometry.position.x += (posTarget.x - geometry.position.x) * falloff;
            geometry.position.y += (posTarget.y - geometry.position.y) * falloff;
            geometry.rotation.x = ctime * 0.5;
            geometry.rotation.y = ctime * 0.3;
            geometry.rotation.z = ctime * 0.4;
            
            const scaleFactor = 1 + 0.2 * Math.sin(2*ctime);
            geometry.scale.set(scaleFactor, scaleFactor, scaleFactor);
        }

        renderer.render(scene, camera);
        requestAnimationFrame(render);
    }
// }
