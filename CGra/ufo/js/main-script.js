import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { VRButton } from "three/addons/webxr/VRButton.js";
//import * as Stats from "three/addons/libs/stats.module.js";
//import { GUI } from "three/addons/libs/lil-gui.module.min.js";

//////////////////////
/* GLOBAL CONSTANTS */
//////////////////////
const COLORS = {
    background: 0x000000,

    field: 0x41734c,

    flowerWhite: 0xffffff,
    flowerYellow: 0xffff00,
    flowerLilac: 0xc7a7e7,
    flowerBlue: 0xaadeed,

    starWhite: 0xffffff,

    skyBlue: { r: 0.00, g: 0.00, b: 0.28 },
    skyViolet: { r: 0.25, g: 0.00, b: 0.28 },

    moon: 0xe3d9b1,
    moonEmissive: 0xede1af,

    treeTrunk: 0xc98f7d,
    treeLeaves: 0x787171,

    wall: 0xffffff,
    roof: 0xb08064,
    chimney: 0x4f3627,
    window: 0x737373,
    door: 0x6996c9,

    ufoBaseDome: 0xa7a7a7,
    ufoTopDome: 0x808080,

    ufoSphere: 0xffffff,
    ufoSphereEmissive: 0x00ff00,

    ufoCylinder: 0xb0a878
};

const INFO = {
    pCameraFrustum: { fov: 65, near: 1, far: 1000 },
    pCameraPosition: { x: -75, y: 75, z: -100 },
    pCameraTarget: { x: 0, y: 30, z: 0 },

    rCameraFrustum: { scalingFactor: 70, near: -10, far: 1000 },
    rCameraPosition: { x: 0, y: 0, z: 15 },

    flowerRadius: 0.05,
    startRadius: 0.02,

    flowerSegments: 16,
    startSegments: 8,

    flowerCount: 500,
    starCount: 300,

    uniqueFlowerCount: 4,
    flowerCountPerType: 125,

    flowerMaterials: [
        new THREE.MeshBasicMaterial({ color: COLORS.flowerWhite }),
        new THREE.MeshBasicMaterial({ color: COLORS.flowerYellow }),
        new THREE.MeshBasicMaterial({ color: COLORS.flowerLilac }),
        new THREE.MeshBasicMaterial({ color: COLORS.flowerBlue }),
    ],

    starMaterial: new THREE.MeshBasicMaterial({ color: COLORS.starWhite }),

    dome: {
        radius: 150,
        widthSegments: 32,
        heightSegments: 32,
        phiStart: 0,
        phiLength: Math.PI * 2,
        thetaStart: 0,
        thetaLength: Math.PI / 2
    },

    moonPosition: { x: 85, y: 90, z: 60 },
    moonGeometry: {
        radius: 20,
        widthSegments: 100,
        heightSegments: 100
    },
    moonMeshParameters: {
        color: COLORS.moon,
        emissive: COLORS.moonEmissive,
        emissiveIntensity: 0.5
    },

    housePosition: { x: -25, y: 17, z: -30 },
    //housePosition: { x: -25, y: 17, z: -50 },

    ufoHeight: 10,
    ufoPosition: { x: -5, y: 20, z: -20 },

    ufoBaseDomePosition: { x: 0, y: 40, z: 0 },
    ufoTopDomePosition: { x: 0, y: 42.5, z: 0 },
    
    ufoBaseDomeRadius: 10,
    ufoTopDomeRadius: 5,
    ufoSphereRadius: 0.7,
    ufoCylinderRadius: 2.5,

    ufoSphereCount: 10,
    
    ufoSphereIntensity: 0.3,
    ufoSpherePosition: { x: 4.5, y: 36.75, z: 4.5 },

    leftArrow: 37,
    rightArrow: 39,
    upArrow: 38,
    downArrow: 40,

    heightmapPath: "terrain/heightmap.png",
};

//////////////////////
/* GLOBAL VARIABLES */
//////////////////////
let renderer;
let scene;
let fieldScene, skyScene;
let fieldTexture, skyTexture;
let camera, renderCamera;
let terrain, sky, moon;
let treeStems = [];
let treeLeaves = [];
let houseRoof, houseChimney, houseWalls, houseWindow, houseDoor;
let ufo, ufoBaseDome, ufoTopDome, ufoSphereLight, ufoCylinder, ufoCylinderLight;
let spheres = [];
let ufoSphereLights = [];
let moonDirectionalLight, moonAmbientLight;
let terrainHeightMap;
let ufoKeys = {};
let delta;
const clock = new THREE.Clock();

/////////////////////
/* CREATE LIGHT(S) */
/////////////////////
function createLights() {
    moonDirectionalLight = new THREE.DirectionalLight(COLORS.moon, 0.2);
    moonDirectionalLight.position.set(
        INFO.moonPosition.x,
        INFO.moonPosition.y,
        INFO.moonPosition.z
    );
    moonAmbientLight = new THREE.AmbientLight(COLORS.moon, 0.5);
    scene.add(moonDirectionalLight);
    scene.add(moonAmbientLight);
}

////////////////////////
/* CREATE OBJECT3D(S) */
////////////////////////

////////////////////////////
/* RESIZE WINDOW CALLBACK */
////////////////////////////
/** callback function for window resize event */
function onResize() {
    // the window variable is a global object in browsers that represents the browser window or tab
    renderer.setSize(window.innerWidth, window.innerHeight);
    if (window.innerHeight > 0 && window.innerWidth > 0) {
        // if the window has a valid height and width,
        // update the camera aspect ratio in respect to the windows new size
        camera.aspect = window.innerWidth / window.innerHeight;
        // cameras (ortographic and perspective) have a projection matrix
        // that defines how the camera projects 3D points into 2D points
        // this matrix needs to be updated when the camera's aspect ratio changes
        camera.updateProjectionMatrix();
    }
}

///////////////////////
/* KEY DOWN CALLBACK */
///////////////////////
function onKeyDown(e) {
    // prevent default action for keys that are not handled
    if (!ufoKeys[e.keyCode]) {
        switch (e.keyCode) {
            case 49: // key '1'
                console.log("generate flower field texture.");
                disposeSceneChildren(fieldScene);           // clear previous flowers
                generateFlowerFieldTexture();               // generate new flower field arrengement in fieldSCENE
                renderer.setRenderTarget(fieldTexture);     // set the render target to fieldTexture
                renderer.render(fieldScene, renderCamera);  // render the fieldScene to the fieldTexture
                renderer.setRenderTarget(null);             // reset render target to default
                terrain.material.map = fieldTexture.texture;// apply the generated texture to the terrain
                terrain.material.needsUpdate = true;        // notify the renderer that the material needs to be updated
                break;
            case 50: // key '2'
                console.log("generate starry sky texture.");
                disposeSceneChildren(skyScene); // clear previous stars
                generateStarrySkyTexture();
                renderer.setRenderTarget(skyTexture);
                renderer.render(skyScene, renderCamera);
                renderer.setRenderTarget(null); // reset render target to default
                sky.material.map = skyTexture.texture; // apply the generated texture to the sky
                sky.material.needsUpdate = true; // notify the renderer that the material needs to be updated
                break;
            case 68: // key 'D'
            case 100: // key 'd'
                console.log("Toggle light source.");
                moonDirectionalLight.visible = !moonDirectionalLight.visible;
                break
            case 80: // key 'P'
            case 112: // key 'p'
                console.log("Toggle point light source.");
                for (let i = 0; i < ufoSphereLights.length; i++) {
                    ufoSphereLights[i].visible = !ufoSphereLights[i].visible;
                }
                break;
            case 83: // key 'S'
            case 115: // key 's'
                console.log("Toggle spot light source.");
                ufoCylinderLight.visible = !ufoCylinderLight.visible;
                break;
            case 81: // key 'Q'
            case 113: // key 'q'
                console.log("Switch to Lambert material.");
                switchToLambertMaterial();
                break;
            case 87: // key 'W'
            case 119: // key 'w'
                console.log("Switch to Phong material.");
                switchToPhongMaterial();
                break;
            default:
                break;
        }
    }
    ufoKeys[e.keyCode] = true; // mark the key as pressed
}

function disposeSceneChildren(scene) {
    for (const obj of scene.children) {
        if (obj instanceof THREE.Group) {
            disposeSceneChildren(obj); // recursively dispose children of groups
        }
        else {
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) {
                if (Array.isArray(obj.material)) { obj.material.forEach(m => m.dispose()); }
                else { obj.material.dispose(); }
            }
        }
    }
    scene.clear();
}

function switchToLambertMaterial() {
    moon.material = new THREE.MeshLambertMaterial({
        color: COLORS.moon,
        emissive: COLORS.moonEmissive,
        emissiveIntensity: 0.5
    });

    for (let i = 0; i < treeStems.length; i++) {
        treeStems[i].material = new THREE.MeshLambertMaterial({ color: COLORS.treeTrunk });
    }
    for (let i = 0; i < treeLeaves.length; i++) {
        treeLeaves[i].material = new THREE.MeshLambertMaterial({ color: COLORS.treeLeaves });
    }

    ufoTopDome.material = new THREE.MeshLambertMaterial({ color: COLORS.ufoTopDome });
    ufoBaseDome.material = new THREE.MeshLambertMaterial({ color: COLORS.ufoBaseDome });

    for (let i = 0; i < spheres.length; i++) {
        spheres[i].material = new THREE.MeshLambertMaterial({
            color: COLORS.ufoSphere,
            emissive: COLORS.ufoSphereEmissive,
            emissiveIntensity: INFO.ufoSphereIntensity
        });
    }

    ufoCylinder.material = new THREE.MeshLambertMaterial({
        color: 'yellow',
        emissive: 'yellow',
        emissiveIntensity: 0.3
    });

    houseWalls.material = new THREE.MeshLambertMaterial({ color: 'white' });
    houseRoof.material = new THREE.MeshLambertMaterial({ color: COLORS.roof });
    houseDoor.material = new THREE.MeshLambertMaterial({ color: COLORS.door });
    houseDoor.material = new THREE.MeshLambertMaterial({ color: COLORS.door });
    houseChimney.material = new THREE.MeshLambertMaterial({ color: COLORS.chimney });
    
}

function switchToPhongMaterial() {
    moon.material = new THREE.MeshPhongMaterial({
        color: COLORS.moon,
        emissive: COLORS.moonEmissive,
        emissiveIntensity: 0.5
    });

    for (let i = 0; i < treeStems.length; i++) {
        treeStems[i].material = new THREE.MeshPhongMaterial({ color: COLORS.treeTrunk });
    }
    for (let i = 0; i < treeLeaves.length; i++) {
        treeLeaves[i].material = new THREE.MeshPhongMaterial({ color: COLORS.treeLeaves });
    }

    ufoTopDome.material = new THREE.MeshPhongMaterial({ color: COLORS.ufoTopDome });
    ufoBaseDome.material = new THREE.MeshPhongMaterial({ color: COLORS.ufoBaseDome });

    for (let i = 0; i < spheres.length; i++) {
        spheres[i].material = new THREE.MeshPhongMaterial({
            color: COLORS.ufoSphere,
            emissive: COLORS.ufoSphereEmissive,
            emissiveIntensity: INFO.ufoSphereIntensity
        });
    }

    ufoCylinder.material = new THREE.MeshPhongMaterial({
        color: 'yellow',
        emissive: 'yellow',
        emissiveIntensity: 0.3
    });

    houseWalls.material = new THREE.MeshPhongMaterial({ color: 'white' });
    houseRoof.material = new THREE.MeshPhongMaterial({ color: COLORS.roof });
    houseDoor.material = new THREE.MeshPhongMaterial({ color: COLORS.door });
    houseDoor.material = new THREE.MeshPhongMaterial({ color: COLORS.door });
    houseChimney.material = new THREE.MeshPhongMaterial({ color: COLORS.chimney });
}

///////////////////////
/* KEY UP CALLBACK */
///////////////////////
function onKeyUp(e) {
    ufoKeys[e.keyCode] = false; // mark the key as released
}

//////////////////////
/* CREATE CAMERA(S) */
//////////////////////
function getPerspectiveCamera(fov, near, far, x = 0, y = 0, z = 0, targetX = 0, targetY = 0, targetZ = 0) {
    const aspect = window.innerWidth / window.innerHeight;
    const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.set(x, y, z);
    camera.lookAt(targetX, targetY, targetZ);
    return camera;
}

function getOrthographicCamera(scalingFactor, near, far, x = 0, y = 0, z = 0) {
    const left = window.innerWidth / -scalingFactor;
    const right = -left;
    const top = window.innerHeight / scalingFactor;
    const bottom = -top;
    const camera = new THREE.OrthographicCamera(left, right, top, bottom, near, far);
    camera.position.set(x, y, z);
    return camera;
}

function prepareCameras() {
    camera = getPerspectiveCamera(
        INFO.pCameraFrustum.fov,
        INFO.pCameraFrustum.near,
        INFO.pCameraFrustum.far,
        INFO.pCameraPosition.x,
        INFO.pCameraPosition.y,
        INFO.pCameraPosition.z,
        INFO.pCameraTarget.x,
        INFO.pCameraTarget.y,
        INFO.pCameraTarget.z
    );
    renderCamera = getOrthographicCamera(
        INFO.rCameraFrustum.scalingFactor,
        INFO.rCameraFrustum.near,
        INFO.rCameraFrustum.far,
        INFO.rCameraPosition.x,
        INFO.rCameraPosition.y,
        INFO.rCameraPosition.z
    );
}

/////////////////////
/* CREATE SCENE(S) */
/////////////////////
function createScene() {
    /**
     * main scene that contains the terrain, sky, moon, trees, house and UFO that are rendered
     */
    scene = new THREE.Scene();
    scene.add(new THREE.AxesHelper(5));

    /**
     * scene to generate the flower field texture using offscreen rendering using a separate camera
     * the resulting texture is applied to the terrain
     * we only need to update the texture when the user presses the '1' key rather than every frame
     */
    fieldScene = new THREE.Scene();
    fieldScene.background = new THREE.Color(COLORS.field);

    /**
     * scene to generate the starry sky texture using offscreen rendering using a separate camera
     * the resulting texture is applied to the sky
     * we only need to update the texture when the user presses the '2' key rather than every frame
     */
    skyScene = new THREE.Scene();

    createRenderTargets();
    prepareCameras();
    createLights();
    createTerrain();
    createSky();
    createMoon();
    prepareTrees();
    createHouse();
    createUfo();
}

/**
 * create render targets for offscreen rendering
 * we will render the fieldScene and skyScene to these targets/textures
 * these textures will be used to apply the flower field and starry sky textures to the terrain and sky respectively
 * 
 * A THREE.WebGLRenderTarget is an off-screen buffer (a texture) that we can render the scene into, instead of rendering directly to the screen.
 *
 * fieldSCENE is the scene you build and render off-screen.
 * fieldTEXTURE is the texture you get by rendering fieldSCENE, and you use it as a texture on your main terrain mesh.
 *
 * The process is as follows:
 * Build fieldScene (flowers, etc.).
 * Render fieldScene to fieldTexture.
 * Apply fieldTexture.texture to the terrain material in your main scene
 */
function createRenderTargets() {
    fieldTexture = new THREE.WebGLRenderTarget(512, 512);
    skyTexture = new THREE.WebGLRenderTarget(512, 512);
}

/** * generate a flower field texture */
function generateFlowerFieldTexture() {
    const geometry = new THREE.CircleGeometry(INFO.flowerRadius, INFO.flowerSegments);
    const group = new THREE.Group();

    for (let c = 0; c < INFO.uniqueFlowerCount; c++) {  // unique flower type = 4
        const material = INFO.flowerMaterials[c];
        const count = INFO.flowerCountPerType;  // 125 flowers per type

        const instancedMesh = new THREE.InstancedMesh(geometry, material, count);
        const dummy = new THREE.Object3D();

        for (let i = 0; i < count; i++) {   // 125 flowers per type
            dummy.position.set(
                Math.random() * window.innerWidth / 35 - window.innerWidth / 70,
                Math.random() * window.innerHeight / 35 - window.innerHeight / 70,
                0
            );
            dummy.updateMatrix();
            instancedMesh.setMatrixAt(i, dummy.matrix);
        }
        group.add(instancedMesh);
    }
    fieldScene.add(group);
}

/** * generate a starry sky texture */
function generateStarrySkyTexture() {
    const geometry = new THREE.CircleGeometry(INFO.startRadius, INFO.startSegments);
    const material = INFO.starMaterial;
    const instancedMesh = new THREE.InstancedMesh(geometry, material, INFO.starCount);
    const dummy = new THREE.Object3D();

    for (let i = 0; i < INFO.starCount; i++) {
        dummy.position.set(
            Math.random() * window.innerWidth / 35 - window.innerWidth / 70,
            Math.random() * window.innerHeight / 35 - window.innerHeight / 70,
            0
        );
        dummy.updateMatrix();
        instancedMesh.setMatrixAt(i, dummy.matrix);
    }

    // Add gradient first (behind stars)
    const gradientGeometry = new THREE.PlaneGeometry(window.innerWidth / 35, window.innerHeight / 35);
    const colors = new Float32Array([
        COLORS.skyBlue.r, COLORS.skyBlue.g, COLORS.skyBlue.b,
        COLORS.skyBlue.r, COLORS.skyBlue.g, COLORS.skyBlue.b,
        COLORS.skyViolet.r, COLORS.skyViolet.g, COLORS.skyViolet.b,
        COLORS.skyViolet.r, COLORS.skyViolet.g, COLORS.skyViolet.b
    ]);
    gradientGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const gradientMaterial = new THREE.MeshBasicMaterial({ vertexColors: true });
    const gradientMesh = new THREE.Mesh(gradientGeometry, gradientMaterial);
    gradientMesh.position.z = -1;

    skyScene.add(gradientMesh);
    skyScene.add(instancedMesh);
}


function createTerrain() {
    const geometry = new THREE.PlaneGeometry(300, 300, 100, 100);
    const loader = new THREE.TextureLoader();                       // texture loader to load the heightmap
    terrainHeightMap = loader.load(INFO.heightmapPath);             // load the heightmap texture from the specified path
    const material = new THREE.MeshPhongMaterial({
        displacementMap: terrainHeightMap,
        displacementScale: 50
    });
    
    terrain = new THREE.Mesh(geometry, material);
    terrain.rotation.x = -Math.PI / 2; // rotate the plane to be horizontal
    scene.add(terrain);
}

/** * create a sky dome - a large, hollow hemisphere that acts as the sky */
function createSky() {
    const geometry = new THREE.SphereGeometry(
        INFO.dome.radius,
        INFO.dome.widthSegments,
        INFO.dome.heightSegments,
        INFO.dome.phiStart,
        INFO.dome.phiLength,
        INFO.dome.thetaStart,
        INFO.dome.thetaLength
    );

    // render the inside of the sphere
    const material = new THREE.MeshPhongMaterial({ side: THREE.BackSide });

    sky = new THREE.Mesh(geometry, material);
    scene.add(sky);
}

function createMoon() {
    const geometry = new THREE.SphereGeometry(
        INFO.moonGeometry.radius,
        INFO.moonGeometry.widthSegments,
        INFO.moonGeometry.heightSegments
    );
    const material = new THREE.MeshPhongMaterial(INFO.moonMeshParameters);
    moon = new THREE.Mesh(geometry, material);
    moon.position.set(INFO.moonPosition.x, INFO.moonPosition.y, INFO.moonPosition.z);
    scene.add(moon);
}

function createTree({ x, y, z, scaleFactor = 1, rotationFactor = 0 }) {
    const tree = new THREE.Object3D();

    /* * * * * * stems * * * * * */
    const bigStemGeometry = new THREE.CylinderGeometry(1.5, 1.5, 15, 100);  // creates a cylinder with a radius of 1.5 and height of 15
    const bigStemMaterial = new THREE.MeshPhongMaterial({ color: COLORS.treeTrunk });
    const bigStem = new THREE.Mesh(bigStemGeometry, bigStemMaterial);

    const smallStemGeometry = new THREE.CylinderGeometry(1, 1, 7, 100);
    const smallStemMaterial = new THREE.MeshPhongMaterial({ color: COLORS.treeTrunk });
    const smallStem = new THREE.Mesh(smallStemGeometry, smallStemMaterial);

    bigStem.rotation.x = -Math.PI / 10; // rotate the big stem to lean it slightly along the x-axis
    smallStem.position.z = 2.5;
    smallStem.rotation.x = Math.PI / 5;

    treeStems.push(bigStem);
    treeStems.push(smallStem);

    bigStem.add(smallStem);
    tree.add(bigStem);
    /* * * * * * stems * * * * * */

    /* * * * * * leaves * * * * * */
    const leafGeometry = new THREE.SphereGeometry(5, 100, 100);
    const leafMaterial = new THREE.MeshPhongMaterial({ color: COLORS.treeLeaves });
    const leaf1 = new THREE.Mesh(leafGeometry, leafMaterial);

    const leafOtherGeometry = new THREE.SphereGeometry(7, 100, 100);
    const leaf2 = new THREE.Mesh(leafOtherGeometry, leafMaterial);

    leaf1.position.set(0, 5, 5);
    leaf1.scale.set(0.5, 0.5, 1);

    leaf2.position.set(0, 6, -8);

    treeLeaves.push(leaf1);
    treeLeaves.push(leaf2);

    leaf1.add(leaf2);
    tree.add(leaf1);
    /* * * * * * leaves * * * * * */

    tree.position.set(x, y, z);
    tree.scale.set(scaleFactor, scaleFactor, scaleFactor);  // scale the tree with the given scaleFactor in all axes
    tree.rotation.y = rotationFactor;

    scene.add(tree);
    return tree;
}

function prepareTrees() {
    const tree1 = {
        x: -55, y: 35, z: 5,
        scaleFactor: 2,
        rotationFactor: Math.PI / 2
    }
    const tree2 = {
        x: 40, y: 25, z: -45,
        scaleFactor: 1.2,
        rotationFactor: - Math.PI / 4
    }
    const tree3 = {
        x: 90, y: 24, z: -70,
        scaleFactor: 1.5,
        rotationFactor: Math.PI
    }
    const tree4 = {
        x: -5, y: 22, z: 60,
        scaleFactor: 1.3,
        rotationFactor: Math.PI / 2
    }
    const tree5 = {
        x: -80, y: 24, z: 45,
        scaleFactor: 1.5,
        rotationFactor: Math.PI / 9
    }
    const tree6 = {
        x: 80, y: 28, z: 30,
        scaleFactor: 2,
        rotationFactor: - Math.PI / 3
    }
    const tree7 = {
        x: 70, y: 20, z: 110,
        scaleFactor: 1.8,
        rotationFactor: Math.PI / 2
    }
    const tree8 = {
        x: -70, y: 20, z: -80,
        scaleFactor: 1.5,
        rotationFactor: - Math.PI / 4
    }

    createTree(tree1);
    createTree(tree2);
    createTree(tree3);
    createTree(tree4);
    createTree(tree5);
    createTree(tree6);
    createTree(tree7);
    createTree(tree8);
}

function createHouseComponent(vertex, indexes, material) {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(vertex, 3));
    geometry.setIndex(indexes);
    geometry.computeVertexNormals();
    return new THREE.Mesh(geometry, material);
}

function createHouse() {
    const house = new THREE.Object3D();
    
    /* * * * * * walls * * * * * */
    const wallVertex = new Float32Array([
        0, 0, 0,            // v 0
        0, 9, 0,            // v 1
        0, 15, 0,           // v 2
        0, 20, 0,           // v 3
        4.5, 9, 0,          // v 4
        4.5, 15, 0,         // v 5
        10.5, 15, 0,        // v 6
        10.5, 9, 0,         // v 7
        15, 0, 0,           // v 8
        15, 9, 0,           // v 9
        15, 15, 0,          // v 10
        25, 15, 0,          // v 11
        25, 9, 0,           // v 12
        25, 0, 0,           // v 13
        29.5, 9, 0,         // v 14
        29.5, 15, 0,        // v 15
        35.5, 15, 0,        // v 16
        35.5, 9, 0,         // v 17
        40, 0, 0,           // v 18
        40, 9, 0,           // v 19
        40, 15, 0,          // v 20
        40, 20, 0,          // v 21
        0, 0, 20,           // v 22
        0, 20, 20,          // v 23
        40, 0, 20,          // v 24
        40, 20, 20          // v 25
    ]);
    const wallIndexes = [
        // front wall with door and windows
        8, 0, 9,
        0, 1, 9,
        1, 2, 5,
        1, 5, 4,
        2, 3, 21,
        2, 21, 20,
        7, 6, 10,
        10, 9, 7,
        13, 12, 19,
        19, 18, 13,
        17, 16, 20,
        20, 19, 17,
        12, 11, 15,
        12, 15, 14,
        // right side wall
        0, 22, 3,
        22, 23, 3,
        // back wall
        24, 22, 25,
        22, 23, 25,
        // side wall
        18, 24, 21,
        24, 25, 21
    ];
    const wallMaterial = new THREE.MeshPhongMaterial({ color: COLORS.wall, side: THREE.DoubleSide });
    houseWalls = createHouseComponent(wallVertex, wallIndexes, wallMaterial);
    house.add(houseWalls);
    /* * * * * walls * * * * * */

    /* * * * * * roof * * * * * */
    const roofVertex = new Float32Array([
        0, 20, 0,           // v 0 = wall v 3
        40, 20, 0,          // v 1 = wall v 21
        0, 20, 20,          // v 2 = wall v 23
        40, 20, 20,         // v 3 = wall v 25

        4.5, 30, 10,        // v 4 - left roof peak
        29.5, 30, 10,       // v 5 - right roof peak
    ]);
    const roofIndexes = [
        0, 2, 4,
        2, 4, 3,
        4, 5, 3,
        5, 1, 3,
        1, 0, 5,  
        0, 4, 5
    ];
    const roofMaterial = new THREE.MeshPhongMaterial({ color: COLORS.roof, side: THREE.DoubleSide });
    houseRoof = createHouseComponent(roofVertex, roofIndexes, roofMaterial);
    house.add(houseRoof);
    /* * * * * * roof * * * * * */

    /* * * * * * chimney * * * * * */
    const chimneyVertex = new Float32Array([
        15, 20, 0,         // v 0
        5, 20, 0,          // v 1

        15, 30, 0,         // v 2
        5, 30, 0,          // v 3

        15, 20, 5,         // v 4
        5, 20, 5,          // v 5

        15, 30, 5,         // v 6
        5, 30, 5,          // v 7
    ]);
    const chimneyIndexes = [
        0, 1, 2,
        1, 3, 2,

        1, 5, 3,
        5, 7, 3,

        2, 3, 6,
        3, 7, 6,

        0, 2, 4,
        2, 6, 4,

        4, 6, 5,
        6, 7, 5
    ];
    const chimneyMaterial = new THREE.MeshPhongMaterial({ color: COLORS.roof, side: THREE.DoubleSide });
    houseChimney = createHouseComponent(chimneyVertex, chimneyIndexes, chimneyMaterial);
    house.add(houseChimney);
    /* * * * * chimney * * * * * */

    /* * * * * * window * * * * * */
    const windowVertex = new Float32Array([
        4.5, 9, 0,     // v 0
        4.5, 15, 0,    // v 1
        10.5, 15, 0,   // v 2
        10.5, 9, 0,    // v 3
        29.5, 9, 0,    // v 4
        29.5, 15, 0,   // v 5
        35.5, 15, 0,   // v 6
        35.5, 9, 0     // v 7
    ]);
    const windowIndexes = [
        3, 0, 2,
        0, 1, 2,
        7, 4, 6,
        4, 5, 6
    ];
    const windowMaterial = new THREE.MeshPhongMaterial({ color: COLORS.window, side: THREE.FrontSide });
    houseWindow = createHouseComponent(windowVertex, windowIndexes, windowMaterial);
    house.add(houseWindow);
    /* * * * * window * * * * * */

    /* * * * * * door * * * * * */
    const doorVertex = new Float32Array([
        15, 0, 0,      // v 0
        15, 15, 0,     // v 1
        25, 15, 0,     // v 2
        25, 0, 0       // v 3
    ]);
    const doorIndexes = [
        3, 0, 2,
        0, 1, 2
    ];
    const doorMaterial = new THREE.MeshPhongMaterial({ color: COLORS.door, side: THREE.FrontSide });
    houseDoor = createHouseComponent(doorVertex, doorIndexes, doorMaterial);
    house.add(houseDoor);
    /* * * * * door * * * * * */

    scene.add(house);
    house.position.set(
        INFO.housePosition.x,
        INFO.housePosition.y,
        INFO.housePosition.z
    );
}

function createUfo() {
    // create a new Object3D to hold the UFO components
    // this will allow us to manipulate the UFO as a single object
    ufo = new THREE.Object3D();

    /* * * * * * base dome * * * * * */
    const baseDomeGeometry = new THREE.SphereGeometry(INFO.ufoBaseDomeRadius, 100, 100);
    const baseDomeMaterial = new THREE.MeshPhongMaterial({ color: COLORS.ufoBaseDome });
    ufoBaseDome = new THREE.Mesh(baseDomeGeometry, baseDomeMaterial);
    ufoBaseDome.scale.y = 0.4; // flatten the sphere to create a disc shape
    ufoBaseDome.position.set(
        INFO.ufoBaseDomePosition.x,
        INFO.ufoBaseDomePosition.y,
        INFO.ufoBaseDomePosition.z
    );
    ufo.add(ufoBaseDome);
    /* * * * * * base dome * * * * * */

    /* * * * * * top dome * * * * * */
    const topDomeGeometry = new THREE.SphereGeometry(INFO.ufoTopDomeRadius, 100, 100);
    const topDomeMaterial = new THREE.MeshPhongMaterial({ color: COLORS.ufoTopDome });
    ufoTopDome = new THREE.Mesh(topDomeGeometry, topDomeMaterial);
    ufoTopDome.position.set(
        INFO.ufoTopDomePosition.x,
        INFO.ufoTopDomePosition.y,
        INFO.ufoTopDomePosition.z
    );
    ufo.add(ufoTopDome);
    /* * * * * * top dome * * * * * */

    /* * * * * * spheres * * * * * */
    for (let i = 0; i < INFO.ufoSphereCount; i++) { // 10 spheres
        // create a new Object3D to hold the spheres and its light
        // this will allow us to rotate the sphere around the UFO
        let rotationContainer = new THREE.Object3D();

        const sphereGeometry = new THREE.SphereGeometry(INFO.ufoSphereRadius, 100, 100);
        const sphereMaterial = new THREE.MeshPhongMaterial({ color: COLORS.ufoSphere, emissive: COLORS.ufoSphere, emissiveIntensity: INFO.ufoSphereIntensity });
        const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        sphere.position.set(
            INFO.ufoSpherePosition.x,
            INFO.ufoSpherePosition.y,
            INFO.ufoSpherePosition.z
        );

        ufoSphereLight = new THREE.PointLight(COLORS.ufoSphere, 8, 50);
        ufoSphereLights.push(ufoSphereLight);

        sphere.add(ufoSphereLight);

        spheres.push(sphere);
        
        rotationContainer.add(sphere);
        rotationContainer.rotation.y = ((2*Math.PI/10) * i); // between 0 and 2*PI/10*9
        
        ufo.add(rotationContainer);
    }
    /* * * * * * spheres * * * * * */

    /* * * * * * cylinder * * * * * */
    const cylinderGeometry = new THREE.CylinderGeometry(2.5, 2.5, 2.5, 100);
    const cylinderMaterial = new THREE.MeshPhongMaterial({
        color: COLORS.ufoCylinder,
        emissive: COLORS.ufoCylinder,
        emissiveIntensity: 0.3
    });
    ufoCylinder = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
    ufoCylinder.position.y = 36.5;
    
    ufoCylinderLight = new THREE.SpotLight('yellow', 30, 50, Math.PI, 0.5, 1);
    ufoCylinder.add(ufoCylinderLight);
    
    ufo.add(ufoCylinder);
    /* * * * * * cylinder * * * * * */

    ufo.position.set(
        INFO.ufoPosition.x,
        INFO.ufoPosition.y,
        INFO.ufoPosition.z
    );
    scene.add(ufo);
}

////////////
/* UPDATE */
////////////
function update() {
    const tensorSpeed = 55;

    ufo.rotation.y += delta * 0.8; // rotate the UFO

    let vector = new THREE.Vector3();
    
    if (ufoKeys[INFO.leftArrow]) { vector.x += 1; }
    if (ufoKeys[INFO.rightArrow]) { vector.x -= 1; }
    if (ufoKeys[INFO.upArrow]) { vector.z += 1; }
    if (ufoKeys[INFO.downArrow]) { vector.z -= 1; }

    vector.normalize(); // normalize the vector to have a length of 1
    ufo.position.add(vector.multiplyScalar(delta * tensorSpeed)); // move the UFO in the direction of the vector
}

/////////////
/* DISPLAY */
/////////////
function render() {
    renderer.setRenderTarget(null);
    renderer.render(scene, camera);
}

////////////////////////////////
/* INITIALIZE ANIMATION CYCLE */
////////////////////////////////
function init() {
    renderer = new THREE.WebGLRenderer({ antialias: true });
    //render.xr.enabled = true; // enable WebXR for VR support
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    //document.body.appendChild(VRButton.createButton(renderer)); // add VR button to the page

    createScene();

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(INFO.pCameraTarget.x, INFO.pCameraTarget.y, INFO.pCameraTarget.z);
    controls.update();

    window.addEventListener("resize", onResize);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    //renderer.setAnimationLoop(animate); // use setAnimationLoop for WebXR compatibility
}

/////////////////////
/* ANIMATION CYCLE */
/////////////////////
function animate() {
    delta = clock.getDelta(); // get the time since the last frame in seconds
    update();
    render();
    requestAnimationFrame(animate);
}

console.log("initializing scene...");
init();
animate();
