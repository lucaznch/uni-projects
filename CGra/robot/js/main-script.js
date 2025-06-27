import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { VRButton } from "three/addons/webxr/VRButton.js";
import * as Stats from "three/addons/libs/stats.module.js";
import { GUI } from "three/addons/libs/lil-gui.module.min.js";


// Information about the robot's geometry - coordinates and sizes
const GEOMETRY = Object.freeze({
    head: { w: 1, h: 1, d: 1 },
    chest: { w: 5, h: 2, d: 2 },
    back: { w: 3, h: 2, d: 1 },
    abdomen: { w: 3, h: 1, d: 1 },
    waist: { w: 4, h: 1, d: 1 },
    thigh: { w: 1, h: 1.5, d: 0.5 },
    shank: { w: 1.5, h: 4.5, d: 1 },
    feet: { w: 1.5, h: 1, d: 2 },
    
    arm: { w: 1, h: 2, d: 1 },
    forearm: { w: 1, h: 1, d: 3 },
    exhaust: { r: 0.125, h: 2 },

    eye: { r: 0.1, h: 0.1, rx: -Math.PI / 2 },
    eyeGap: 0.2,

    antenna: { r: 0.1, h: 0.5 },
    antennaGap: 0.2,

    foreheadHeight: 0.2,

    headOffset: -0.05,

    wheel: { r: 0.75, h: 0.5, rz: Math.PI / 2 },
    wheelGap: 0.5,

    legGap: 1,

    orthogonalCameraDistance: 10,
    orthogonalCameraSize: 14,
    perspectiveCameraDistance: 15,

    trailerContainer: { w: 5, h: 5, d: 12 },
    trailerConnector: { r: 0.25, h: 0.5 },
    trailerConnectorDepth: 1.5,
    trailerWheelSupport: { w: 4, h: 1, d: 4.5 },
    trailerWheelGap: 0.5,
    initialTrailerOffset: 10,
});

const MATERIAL = Object.freeze({
    head: new THREE.MeshBasicMaterial({ color: 0x000000 }),
    eye: new THREE.MeshBasicMaterial({ color: 0x841b2d }),
    antenna: new THREE.MeshBasicMaterial({ color: 0x318ce7 }),

    chest: new THREE.MeshBasicMaterial({ color: 0x0b486b }),
    back: new THREE.MeshBasicMaterial({ color: 0x272941 }),
    abdomen: new THREE.MeshBasicMaterial({ color: 0x1cceb7 }),
    waist: new THREE.MeshBasicMaterial({ color: 0x008080 }),
    wheel: new THREE.MeshBasicMaterial({ color: 0x1b4d3e }),
    thigh: new THREE.MeshBasicMaterial({ color: 0x2c9c38 }),
    shank: new THREE.MeshBasicMaterial({ color: 0xf0a830 }),
    feet: new THREE.MeshBasicMaterial({ color: 0x807777 }),
    
    arm: new THREE.MeshBasicMaterial({ color: 0xe95081 }),
    forearm: new THREE.MeshBasicMaterial({ color: 0x7b1e7a }),
    exhaust: new THREE.MeshBasicMaterial({ color: 0xe3dac9 }),

    trailerContainer: new THREE.MeshBasicMaterial({ color: 0x654321 }),
    trailerConnector: new THREE.MeshBasicMaterial({ color: 0xccad8f }),
    trailerWheelSupport: new THREE.MeshBasicMaterial({ color: 0x3b3838 }),
});

//////////////////////
/* GLOBAL VARIABLES */
//////////////////////
let scene;
let renderer;
let currentCamera;
let trailerConnected = false;

const cameras = {
    front: createOrthogonalCamera(0, 0, -GEOMETRY.orthogonalCameraDistance, GEOMETRY.orthogonalCameraSize),
    side: createOrthogonalCamera(-GEOMETRY.orthogonalCameraDistance, 0, 0, GEOMETRY.orthogonalCameraSize),
    top: createOrthogonalCamera(0, GEOMETRY.orthogonalCameraDistance + 10, 0, GEOMETRY.orthogonalCameraSize),
    perspective: createPerspectiveCamera(-GEOMETRY.perspectiveCameraDistance, GEOMETRY.perspectiveCameraDistance, -GEOMETRY.perspectiveCameraDistance),
};

const movingElements = {};

/////////////////////
/* CREATE SCENE(S) */
/////////////////////
function createScene() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xedcc93);
    scene.add(new THREE.AxesHelper(20));

    createRobot();
    createTrailer();
}



//////////////////////
/* CREATE CAMERAS */
//////////////////////

/**
 * set the initial camera view and set the orientation of each camera
 */
function prepareCameras() {
    // set the initial camera to the perspective camera
    currentCamera = cameras.perspective; 
    
    // set orientation of each camera
    for (const key in cameras) {
        cameras[key].lookAt(scene.position);
    }
}

/**
 * create a perspective camera and positions it in scene
 * 
 * @param {number} x x-coordinate of camera
 * @param {number} y y-coordinate of camera
 * @param {number} z z-coordinate of camera
 */ 
function createPerspectiveCamera(x, y, z) {
    const aspect = window.innerWidth / window.innerHeight;
    const newCamera = new THREE.PerspectiveCamera(70, aspect, 1, 1000);   
    newCamera.position.set(x, y, z);
    return newCamera;
}

/**
 * create an orthogonal camera and positions it in scene
 * 
 * @param {number} x x-coordinate of camera
 * @param {number} y y-coordinate of camera
 * @param {number} z z-coordinate of camera
 * @param {number} size half-height of the camera view, e.g. 10 means the camera will see 20 units verically
 * @param {boolean} mirrorView if true, the camera will be flipped
 * @returns {THREE.OrthographicCamera} configured orthographic camera
 */
function createOrthogonalCamera(x,y,z, size) {
    const aspect = window.innerWidth / window.innerHeight;
    const width = size * aspect;
    const height = size;

    const left = -width;
    const right = width;
    const top = height;
    const bottom = -height;
    const near = 0.1;
    const far = 1000;

    const newCamera = new THREE.OrthographicCamera(left, right, top, bottom, near, far);

    newCamera.position.set(x, y, z);
    return newCamera;
}


/////////////////////
/* CREATE LIGHT(S) */
/////////////////////


////////////////////////////////////
/* AUX FUNCTION FOR createRobot() */
////////////////////////////////////

function toggleWireframe() {
    Object.values(MATERIAL).forEach((material) => (material.wireframe = !material.wireframe));
}

/**
 * mirror the group on the X axis
 * Wrapper to `createGroup` that creates a group with a
 * symmetry on the X axis.
 */
function mirrorX(builder, parent) {
    return builder(createGroup({ scale: [-1, 1, 1], parent }));
}

function createRightTrailerWheels(wheelSupportGroup) {
    
    //////////
    // create the wheels GROUP child of the wheel support group
    //////////
    const wheelsGroup = createGroup({ x: GEOMETRY.trailerWheelSupport.w / 2 + GEOMETRY.wheel.h / 2, parent: wheelSupportGroup });
    
    createMesh({ name: 'wheel', z: -(GEOMETRY.wheel.r + GEOMETRY.trailerWheelGap / 2), parent: wheelsGroup, type: "cylinder" });
    
    createMesh({ name: 'wheel', z: GEOMETRY.wheel.r + GEOMETRY.trailerWheelGap / 2, parent: wheelsGroup, type: "cylinder" });
}

/**
 * creates a wheel mesh, child of the waist group \\
 * creates the lower limbs group, child of the waist group, with a thigh, shank group and feet group \\
 * creates a shank group, child of the lower limbs group, with a shank mesh and a feet group \\
 * creates a feet group, child of the shank group, with a feet mesh \\
*/
function createRightLowerLimb(waistGroup) {
    // front wheel (on the waist)
    createMesh({ name: 'wheel', x: GEOMETRY.wheel.h / 2 + GEOMETRY.waist.w / 2, parent: waistGroup, type: "cylinder" });

    const lowerLimbsGroup = createGroup({ y: GEOMETRY.thigh.d / 2, z: -GEOMETRY.thigh.d / 2, parent: waistGroup });
    
    createMesh({ name: 'thigh', anchor: [1, 1, -1], x: GEOMETRY.legGap / 2, y: -GEOMETRY.thigh.d / 2 - GEOMETRY.thigh.h, z: GEOMETRY.thigh.d / 2, parent: lowerLimbsGroup, type: "box" });

    const shankGroup = createGroup({ x: GEOMETRY.legGap / 2, y: -GEOMETRY.thigh.d / 2 - GEOMETRY.thigh.h - GEOMETRY.shank.h, z: GEOMETRY.thigh.d / 2, parent: lowerLimbsGroup });
    
    createMesh({ name: 'shank', anchor: [1, 1, 0], parent: shankGroup, type: "box" });

    const feetGroup = createGroup({ y: GEOMETRY.feet.h / 2, parent: shankGroup });
    
    createMesh({ name: 'feet', z: -GEOMETRY.shank.d / 2, anchor: [1, 0, -1], parent: feetGroup, type: "box" });

    // middle wheel (on the shank)
    createMesh({ name: 'wheel', x: GEOMETRY.shank.w + GEOMETRY.wheel.h / 2, y: 3 * GEOMETRY.wheel.r + GEOMETRY.wheelGap, z: -GEOMETRY.shank.d / 2, parent: shankGroup, type: "cylinder" });

    // rear wheel (on the shank)
    createMesh({ name: 'wheel', x: GEOMETRY.shank.w + GEOMETRY.wheel.h / 2, y: GEOMETRY.wheel.r, z: -GEOMETRY.shank.d / 2, parent: shankGroup, type: "cylinder" });

    return { lowerLimb: lowerLimbsGroup, feet: feetGroup };
}

/**
 * creates an arm group, child of the chest group, with an arm, forearm and exhaust meshes on the right
 */
function createRightUpperLimb(chestGroup) {
    //////////
    // create the arm GROUP 
    //////////
    const armGroup = createGroup({ x: GEOMETRY.chest.w / 2, y: GEOMETRY.chest.h, z: GEOMETRY.chest.d / 2, parent: chestGroup});

    /* - - - - - ARM - - - - - */
    createMesh({ name: 'arm', anchor: [1, -1, 1], parent: armGroup, type: "box" });

    /* - - - - - FOREARM - - - - - */
    createMesh({ name: 'forearm', anchor: [1, -1, -1], y: -GEOMETRY.arm.h, z: GEOMETRY.arm.d, parent: armGroup, type: "box" });

    /* - - - - - EXHAUST - - - - - */
    createMesh({ name: 'exhaust', x: GEOMETRY.arm.w + GEOMETRY.exhaust.r, z: GEOMETRY.arm.d / 2, parent: armGroup, type: "cylinder" });

    return { arm: armGroup };
}

/**
 * creates an eye and antenna meshes, childs of the head group, on the right side
 */
function createRightHeadElements(headGroup) {
    /* - - - - - EYE - - - - - */
    createMesh({ name: 'eye', x: GEOMETRY.eyeGap / 2 + GEOMETRY.eye.r, y: GEOMETRY.head.h - GEOMETRY.foreheadHeight - GEOMETRY.eye.r, z: -GEOMETRY.head.h / 2 - GEOMETRY.eye.h / 2, parent: headGroup, type: "cylinder" });
    
    /* - - - - - ANTENNA - - - - - */
    createMesh({ name: 'antenna', x: GEOMETRY.antennaGap / 2 + GEOMETRY.antenna.r, y: GEOMETRY.head.h + GEOMETRY.antenna.h / 2, parent: headGroup, type: "cylinder" });
}


/**
 * create a THREE.Group and add it to the parent object
 */
function createGroup({ x = 0, y = 0, z = 0, scale = [1, 1, 1], parent }) {
    const group = new THREE.Group();
    group.position.set(x, y, z);
    group.scale.set(scale[0], scale[1], scale[2]);

    if (parent) { parent.add(group); }
    else { scene.add(group); }

    return group;
}

/**
 * create a THREE.Mesh - box or cylnder
 */
function createMesh({ name, x = 0, y = 0, z = 0, anchor = [0, 0, 0], parent, type }) {
    if (type === "box") {
        // create a THREE.Mesh with BoxGeometry and add it to the parent object
        const { w, h, d } = GEOMETRY[name];
        const material = MATERIAL[name];

        // when we create THREE.BoxGeometry the center of the box is at (0,0,0)
        const geometry = new THREE.BoxGeometry(w, h, d);
        const box = new THREE.Mesh(geometry, material);

        // sets the position of the mesh relative to the parent object

        // explanation of x + (anchor[0] * w) / 2

        //  x: offset - the x position of the parent object
        //  anchor[0]: defines how to translate the box on the X-axis
        //  (anchor[0] * w): status of translation on the X-axis
        //  / 2: the box is centered at (0,0,0) so we need to divide by 2
        //  x + (anchor[0] * w) / 2: translation applied to the box = final x position
        box.position.set(x + (anchor[0] * w) / 2, y + (anchor[1] * h) / 2, z + (anchor[2] * d) / 2);

        parent.add(box);
        return box;
    }
    if (type === "cylinder") {
        // create a THREE.Mesh with CylinderGeometry and add it to the parent object
        const { r, h, rx = 0, ry = 0, rz = 0 } = GEOMETRY[name];
        const material = MATERIAL[name];

        // allows for smooth edges on small cylinders, while also preventing too many segments on smaller ones
        const radialSegments = THREE.MathUtils.clamp(Math.round(100 * r), 5, 35);

        const geometry = new THREE.CylinderGeometry(r, r, h, radialSegments);
        const cylinder = new THREE.Mesh(geometry, material);
        cylinder.position.set(x, y, z);
        cylinder.rotation.set(rx, ry, rz);

        parent.add(cylinder);
        return cylinder;

    }
}


////////////////////////
/* CREATE OBJECTS 3D */
////////////////////////

function createTrailer() {
    const heightTillThigh = GEOMETRY.shank.h + GEOMETRY.thigh.h + GEOMETRY.trailerWheelSupport.h;

    //////////
    // create the trailer GROUP
    //////////
    const trailer = createGroup({ y: heightTillThigh, z: GEOMETRY.initialTrailerOffset, parent: scene });
    
    // trailer is able to move
    movingElements.trailer = trailer;

    /* - - - - - TRAILER CONTAINER - - - - - */
    createMesh({ name: 'trailerContainer', anchor: [0, 1, 1], parent: trailer, type: "box" });

    /* - - - - - TRAILER CONNECTOR - - - - - */
    createMesh({ name: 'trailerConnector', y: -GEOMETRY.trailerConnector.h / 2, z: GEOMETRY.trailerConnectorDepth + GEOMETRY.trailerConnector.r / 2, parent: trailer, type: "cylinder" });

    //////////
    // create the wheel support GROUP child of the trailer group
    //////////
    const wheelSupportGroup = createGroup({ y: -GEOMETRY.trailerWheelSupport.h, z: GEOMETRY.trailerContainer.d - GEOMETRY.trailerWheelSupport.d / 2, parent: trailer });
    
    /* - - - - - TRAILER WHEEL SUPPORT - - - - - */
    createMesh({ name: 'trailerWheelSupport', anchor: [0, 1, 0], parent: wheelSupportGroup, type: "box" });

    createRightTrailerWheels(wheelSupportGroup);
    mirrorX(createRightTrailerWheels, wheelSupportGroup);
}

/**
 * 
 */
function createRobot() {
    const heightTillChest = GEOMETRY.shank.h + GEOMETRY.thigh.h + GEOMETRY.waist.h + GEOMETRY.abdomen.h;
    
    //////////
    // create the robot GROUP 
    //////////
    const robot = createGroup({ y: heightTillChest, parent: scene });
    
    /* - - - - - CHEST - - - - - */
    createMesh({ name: "chest", anchor: [0, 1, 0], parent: robot, type: "box" });
    
    /* - - - - - BACK - - - - - */
    createMesh({ name: 'back', z: GEOMETRY.chest.h / 2, anchor: [0, 1, 1], parent: robot, type: "box" });

    //////////
    // create the abdomen GROUP child of the robot
    //////////
    const abdomenGroup = createGroup({ y: -GEOMETRY.abdomen.h, parent: robot });
    
    /* - - - - - ABDOMEN - - - - - */
    createMesh({ name: 'abdomen', anchor: [0, 1, -1], parent: abdomenGroup, type: "box" });

    //////////
    // create the waist GROUP child of the abdomen group
    //////////
    const waistGroup = createGroup({ y: -GEOMETRY.waist.h, parent: abdomenGroup });
    
    /* - - - - - WAIST - - - - - */
    createMesh({ name: 'waist', anchor: [0, 1, -1], parent: waistGroup, type: "box" });


    //////////    //////////    //////////    //////////    //////////


    const { lowerLimb: rightLowerLimb, feet: rightFoot } = createRightLowerLimb(waistGroup);
    const { lowerLimb: leftLowerLimb, feet: leftFoot } = mirrorX(createRightLowerLimb, waistGroup);
    
    // right and left lower limbs and feet are able to move
    movingElements.rightLowerLimb = rightLowerLimb;
    movingElements.rightFoot = rightFoot;
    movingElements.leftLowerLimb = leftLowerLimb;
    movingElements.leftFoot = leftFoot;


    const { arm: rightArm } = createRightUpperLimb(robot);
    const { arm: leftArm } = mirrorX(createRightUpperLimb, robot);

    // right and left arms are able to move
    movingElements.rightArm = rightArm;
    movingElements.leftArm = leftArm;

    //////////
    // create the head GROUP child of the robot
    //////////
    const headGroup = createGroup({ y: GEOMETRY.chest.h + GEOMETRY.headOffset, parent: robot });
    
    // head is able to move
    movingElements.head = headGroup;
    
    /* - - - - - HEAD - - - - - */
    createMesh({ name: 'head', anchor: [0, 1, 0], parent: headGroup, type: "box" });
    
    createRightHeadElements(headGroup);
    mirrorX(createRightHeadElements, headGroup);
}


//////////////////////
/* CHECK COLLISIONS */
//////////////////////

function inTruckMode() {
    if (movingElements.rightFoot.rotation.x == -Math.PI / 2 &&
        movingElements.leftFoot.rotation.x == -Math.PI / 2 &&
        movingElements.rightLowerLimb.rotation.x == -Math.PI / 2 &&
        movingElements.leftLowerLimb.rotation.x == -Math.PI / 2 &&
        movingElements.rightArm.position.x == GEOMETRY.chest.w / 2 - GEOMETRY.arm.d &&
        movingElements.leftArm.position.x == GEOMETRY.chest.w / 2 - GEOMETRY.arm.d &&
        movingElements.head.rotation.x == -Math.PI) {
            return true;
    }
}

function checkCollisions() {
    if (!movingElements.trailer || !inTruckMode()) { return false; }
}


///////////////////////
/* HANDLE COLLISIONS */
///////////////////////

function handleCollisions() {}


////////////
/* UPDATE */
////////////

function update() {
    if (checkCollisions()) {
        handleCollisions();
    }
}


/////////////
/* DISPLAY */
/////////////

function render() {
    renderer.render(scene, currentCamera);
}


////////////////////////////
/* RESIZE WINDOW CALLBACK */
////////////////////////////

/**
 * callback function for window resize event
 */
function onResize() {
    // the window variable is a global object in browsers
    // that represents the browser window or tab
    renderer.setSize(window.innerWidth, window.innerHeight);

    // check if the window has a valid height and width
    if (window.innerHeight > 0 && window.innerWidth > 0) {
        // update the camera aspect ratio in respect to the windows new size
        currentCamera.aspect = window.innerWidth / window.innerHeight;

        // cameras (ortographic and perspective) have a projection matrix
        // that defines how the camera projects 3D points into 2D points
        // this matrix needs to be updated when the camera's aspect ratio (fov, zoom, etc) changes
        currentCamera.updateProjectionMatrix();
    }
}


///////////////////////
/* KEY DOWN CALLBACK */
///////////////////////

const ROTATION_SPEED = 30;
const ROTATION_DELTA = 0.05;
const MAX_ROTATION = 0;
const MIN_ROTATION = -Math.PI / 2;
const activeKeys = new Map();

function rotateFeet(convertTo) {
    const rightFoot = movingElements.rightFoot;
    const leftFoot = movingElements.leftFoot;

    if (!rightFoot || !leftFoot) { return; }

    const currentX = rightFoot.rotation.x; // same as leftFoot
    let next;

    if (convertTo === "truck") {
        next = Math.max(currentX - ROTATION_DELTA, MIN_ROTATION);
    }
    else if (convertTo === "robot") {
        next = Math.min(currentX + ROTATION_DELTA, MAX_ROTATION);
    }

    rightFoot.rotation.x = next;
    leftFoot.rotation.x = next;
}

function rotateWaist(convertTo) {
    const rightLowerLimb = movingElements.rightLowerLimb;
    const leftLowerLimb = movingElements.leftLowerLimb;

    if (!rightLowerLimb || !leftLowerLimb) { return; }

    const currentX = rightLowerLimb.rotation.x; // same as leftLowerLimb
    let next;

    if (convertTo === "truck") {
        next = Math.max(currentX - ROTATION_DELTA, MIN_ROTATION);
    }
    else if (convertTo === "robot") {
        next = Math.min(currentX + ROTATION_DELTA, MAX_ROTATION);
    }

    rightLowerLimb.rotation.x = next;
    leftLowerLimb.rotation.x = next;
}

function rotateHead(convertTo) {
    const head = movingElements.head;

    if (!head) { return; }

    const currentX = head.rotation.x;
    let next;

    if (convertTo === "truck") {
        next = Math.max(currentX - ROTATION_DELTA, -Math.PI);
    }
    else if (convertTo === "robot") {
        next = Math.min(currentX + ROTATION_DELTA, MAX_ROTATION);
    }

    head.rotation.x = next;
}

function translateArms(convertTo) {
    const rightArm = movingElements.rightArm;
    const leftArm = movingElements.leftArm;

    if (!rightArm || !leftArm) { return; }

    const currentX = rightArm.position.x; // same as leftArm
    let next;

    if (convertTo === "truck") {
        next = Math.max(currentX - ROTATION_DELTA, GEOMETRY.chest.w / 2 - GEOMETRY.arm.d);
    }
    else if (convertTo === "robot") {
        next = Math.min(currentX + ROTATION_DELTA, GEOMETRY.chest.w / 2);
    }

    rightArm.position.x = next;
    leftArm.position.x = next;
}

function translateTrailer(direction) {
    const trailer = movingElements.trailer;

    if (!trailer) { return; }

    const currentX = trailer.position.x;
    const currentZ = trailer.position.z;
    let next;

    if (direction === "left") {
        next = currentX + ROTATION_DELTA;
    }
    else if (direction === "right") {
        next = currentX - ROTATION_DELTA;
    }
    else if (direction === "up") {
        next = currentZ - ROTATION_DELTA;
    }
    else if (direction === "down") {
        next = currentZ + ROTATION_DELTA;
    }

    if (direction === "left" || direction === "right") {
        trailer.position.x = next;
    }
    else if (direction === "up" || direction === "down") {
        trailer.position.z = next;
    }
}

/**
 * callback function for key down event
 * changes the current camera based on the key pressed
 * 1: front, 2: side, 3: top, 4: perspective.
 * Q,q: rotate feet to truck, A,a: rotate feet to robot
 * W,w: rotate lower limbs to truck, S,s: rotate lower limbs to robot
 * E,e: translate arms to truck, D,d: translate arms to robot
 * R,r: rotate head to truck, F,f: rotate head to robot
 * 
 * @param {KeyboardEvent} e - the keyboard event.
 */
function onKeyDown(e) {
    switch (e.keyCode) {
        case 49: // 1
            currentCamera = cameras.front;
            break;
        case 50: // 2
            currentCamera = cameras.side;
            break;
        case 51: // 3
            currentCamera = cameras.top;
            break;
        case 52: // 4
            currentCamera = cameras.perspective;
            break;
        
        // TRANSLATE the trailer
        case 37: // left arrow
            if (activeKeys.has(e.key)) { break; }
            const directionLeft = "left";
            const intervalLeft = setInterval(() => translateTrailer(directionLeft), ROTATION_SPEED);
            activeKeys.set(e.key, intervalLeft);
            break;
        case 39: // right arrow
            if (activeKeys.has(e.key)) { break; }
            const directionRight = "right";
            const intervalRight = setInterval(() => translateTrailer(directionRight), ROTATION_SPEED);
            activeKeys.set(e.key, intervalRight);
            break;
        case 38: // up arrow
            if (activeKeys.has(e.key)) { break; }
            const directionUp = "up";
            const intervalUp = setInterval(() => translateTrailer(directionUp), ROTATION_SPEED);
            activeKeys.set(e.key, intervalUp);
            break;
        case 40: // down arrow
            if (activeKeys.has(e.key)) { break; }
            const directionDown = "down";
            const intervalDown = setInterval(() => translateTrailer(directionDown), ROTATION_SPEED);
            activeKeys.set(e.key, intervalDown);
            break;

        case 55: // 7
            // toggle wireframe mode
            toggleWireframe();
            break;

        // ROTATE the feet along the X axis - rotate from 0 to -PI/2
        case 81: // Q
        case 113: // q
            // conversion of robot's feet to truck
            if (activeKeys.has(e.key)) { break; }
            const directionQ = "truck";
            const intervalQ = setInterval(() => rotateFeet(directionQ), ROTATION_SPEED);
            activeKeys.set(e.key, intervalQ);
            break;
        case 65: // A
        case 97: // a
            // conversion of the truck's feet to truck
            if (activeKeys.has(e.key)) { break; }
            const directionA = "robot";
            const intervalA = setInterval(() => rotateFeet(directionA), ROTATION_SPEED);
            activeKeys.set(e.key, intervalA);
            break;

        // ROTATE the lower limbs along the X axis - rotate from 0 to -PI/2
        case 87: // W
        case 119: // w
            // conversion of the robot's legs to truck
            if (activeKeys.has(e.key)) { break; }
            const directionW = "truck";
            const intervalW = setInterval(() => rotateWaist(directionW), ROTATION_SPEED + 5);
            activeKeys.set(e.key, intervalW);
            break;
        case 83: // S
        case 115: // s
            // conversion of the truck's legs to robot
            if (activeKeys.has(e.key)) { break; }
            const directionS = "robot";
            const intervalS = setInterval(() => rotateWaist(directionS), ROTATION_SPEED + 5);
            activeKeys.set(e.key, intervalS);
            break;
        
        // TRANSLATE the arms along the X axis
        case 69: // E
        case 101: // e
            // conversion of the robot's arms to truck
            if (activeKeys.has(e.key)) { break; }
            const directionE = "truck";
            const intervalE = setInterval(() => translateArms(directionE), ROTATION_SPEED);
            activeKeys.set(e.key, intervalE);
            break;
        case 68: // D
        case 100: // d
            // conversion of the truck's arms to robot
            if (activeKeys.has(e.key)) { break; }
            const directionD = "robot";
            const intervalD = setInterval(() => translateArms(directionD), ROTATION_SPEED);
            activeKeys.set(e.key, intervalD);
            break;

        // ROTATE the head along the X axis - rotate from 0 to -PI
        case 82: // R
        case 114: // r
            // conversion of the robot's head to truck
            if (activeKeys.has(e.key)) { break; }
            const directionR = "truck";
            const intervalR = setInterval(() => rotateHead(directionR), ROTATION_SPEED);
            activeKeys.set(e.key, intervalR);
            break;
        case 70: // F
        case 102: // f
            // conversion of the truck's head to robot
            if (activeKeys.has(e.key)) { break; }
            const directionF = "robot";
            const intervalF = setInterval(() => rotateHead(directionF), ROTATION_SPEED);
            activeKeys.set(e.key, intervalF);
            break

        default:
            break;
    }
}


///////////////////////
/* KEY UP CALLBACK */
///////////////////////

function clearActiveKey(key) {
    if (activeKeys.has(key)) {
        clearInterval(activeKeys.get(key));
        activeKeys.delete(key);
    }
}

function onKeyUp(e) {
    switch (e.keyCode) {
        case 37: // left arrow
            clearActiveKey(e.key);
            break;
        case 39: // right arrow
            clearActiveKey(e.key);
            break;
        case 38: // up arrow
            clearActiveKey(e.key);
            break;
        case 40: // down arrow
            clearActiveKey(e.key);
            break;

        // ROTATE the feet along the X axis - rotate from 0 to -PI/2
        case 81: // Q
        case 113: // q
            // conversion of robot's feet to truck
            clearActiveKey(e.key);
            break;
        case 65: // A
        case 97: // a
            // conversion of the truck's feet to truck
            clearActiveKey(e.key);
            break;
        
        // ROTATE the lower limbs along the X axis - rotate from 0 to -PI/2
        case 87: // W
        case 119: // w
            // conversion of the robot's legs to truck
            clearActiveKey(e.key);
            break;
        case 83: // S
        case 115: // s
            // conversion of the truck's legs to robot
            clearActiveKey(e.key);
            break;
        
        // TRANSLATE the arms along the X axis
        case 69: // E
        case 101: // e
            // conversion of the robot's arms to truck
            clearActiveKey(e.key);
            break;
        case 68: // D
        case 100: // d
            // conversion of the truck's arms to robot
            clearActiveKey(e.key);
            break;

        // ROTATE the head along the X axis - rotate from 0 to -PI
        case 82: // R
        case 114: // r
            // conversion of the robot's head to truck
            clearActiveKey(e.key);
            break;
        case 70: // F
        case 102: // f
            // conversion of the truck's head to robot
            clearActiveKey(e.key);
            break;
        
        default:
            break;
    }
}


////////////////////////////////
/* INITIALIZE ANIMATION CYCLE */
////////////////////////////////

function init() {
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    createScene();
    prepareCameras();

    window.addEventListener("resize", onResize);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
}


/////////////////////
/* ANIMATION CYCLE */
/////////////////////

function animate() {
    update();
    render();
    requestAnimationFrame(animate);
}



init();
animate();