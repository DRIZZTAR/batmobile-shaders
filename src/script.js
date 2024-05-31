import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import GUI from 'lil-gui';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js'; // Import RGBELoader
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import holographicVertexShader from './shaders/holographic/vertex.glsl';
import holographicFragmentShader from './shaders/holographic/fragment.glsl';
import { triplanarTexture } from 'three/examples/jsm/nodes/Nodes.js';

/**
 * Base
 */
// Debug
const gui = new GUI();

// Canvas
const canvas = document.querySelector('canvas.webgl');

// Scene
const scene = new THREE.Scene();

// Loaders
const gltfLoader = new GLTFLoader();
const rgbeLoader = new RGBELoader();
const textureLoader = new THREE.TextureLoader();

/**
 * Sizes
 */
const sizes = {
	width: window.innerWidth,
	height: window.innerHeight,
};

window.addEventListener('resize', () => {
	// Update sizes
	sizes.width = window.innerWidth;
	sizes.height = window.innerHeight;

	// Update camera
	camera.aspect = sizes.width / sizes.height;
	camera.updateProjectionMatrix();

	// Update renderer
	renderer.setSize(sizes.width, sizes.height);
	renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(25, sizes.width / sizes.height, 0.1, 100);
camera.position.set(20, 6, 20);
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

// GUI Camera Controls
const cameraFolder = gui.addFolder('Camera Position');
cameraFolder.add(camera.position, 'x', -50, 50, 0.1).name('Camera X');
cameraFolder.add(camera.position, 'y', -50, 50, 0.1).name('Camera Y');
cameraFolder.add(camera.position, 'z', -50, 50, 0.1).name('Camera Z');
cameraFolder.open();

/**
 * Renderer
 */


const renderer = new THREE.WebGLRenderer({
	canvas: canvas,
	antialias: true,
	alpha: true,
});

renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));


/**
 * Environment Map
 */
// rgbeLoader.load('./envmap.hdr', (texture) => {
// 	texture.mapping = THREE.EquirectangularReflectionMapping;
// 	scene.environment = texture;
// 	scene.background = texture;
// });

/**
 * GUI Controls for Background Gradient
 */
const backgroundGradient = {
	colorTop: '#000000',
	colorBottom: '#464d00',
};

const updateBackgroundGradient = () => {
    const gradient = `linear-gradient(to bottom, ${backgroundGradient.colorTop}, ${backgroundGradient.colorBottom})`;
    canvas.style.backgroundImage = gradient;
};

const backgroundFolder = gui.addFolder('Background Gradient');
backgroundFolder.addColor(backgroundGradient, 'colorTop').name('Top Color').onChange(updateBackgroundGradient);
backgroundFolder.addColor(backgroundGradient, 'colorBottom').name('Bottom Color').onChange(updateBackgroundGradient);
backgroundFolder.open();

// Initial background gradient
updateBackgroundGradient();

/**
 * Materials
 */
const matcapTextures = [
	textureLoader.load('textures/matcaps/1.png'),
	textureLoader.load('textures/matcaps/2.png'),
	textureLoader.load('textures/matcaps/3.png'),
	textureLoader.load('textures/matcaps/4.png'),
];

let currentMatcapIndex = 1; // Default to matcap 3.png (index 2)
const matcapMaterial = new THREE.MeshMatcapMaterial({ matcap: matcapTextures[currentMatcapIndex] });

const shaderMaterialParameters = {
	color: '#00ff40',
	transparent: true,
	uLineWork: -0.8299,
};

// Create the ShaderMaterial
const shaderMaterial = new THREE.ShaderMaterial({
	vertexShader: holographicVertexShader,
	fragmentShader: holographicFragmentShader,
	uniforms: {
		uTime: new THREE.Uniform(0),
		uColor: new THREE.Uniform(new THREE.Color(shaderMaterialParameters.color)),
		uLineWork: new THREE.Uniform(shaderMaterialParameters.uLineWork),
	},
	transparent: shaderMaterialParameters.transparent,
	side: THREE.DoubleSide,
	depthWrite: false,
	blending: THREE.AdditiveBlending,
});

/**
 * GUI Controls for Shader Material
 */
const shaderMaterialFolder = gui.addFolder('Shader Material');
shaderMaterialFolder.addColor(shaderMaterialParameters, 'color').onChange(() => {
	shaderMaterial.uniforms.uColor.value.set(shaderMaterialParameters.color);
});
shaderMaterialFolder
	.add(shaderMaterialParameters, 'uLineWork')
	.min(-1.5)
	.max(0.65)
	.step(0.0001)
	.onChange(() => {
		shaderMaterial.uniforms.uLineWork.value = shaderMaterialParameters.uLineWork;
	});
shaderMaterialFolder.open();

/**
 * Toggle Material
 */
const materialOptions = {
	material: 'shader', // Default material
	matcap: currentMatcapIndex,
};

const updateMaterials = (material) => {
	const selectedMaterial = material === 'matcap' ? matcapMaterial : shaderMaterial;

	if (batmobile1)
		batmobile1.traverse((child) => {
			if (child.isMesh) child.material = selectedMaterial;
		});
	if (batmobile2)
		batmobile2.traverse((child) => {
			if (child.isMesh) child.material = selectedMaterial;
		});
	if (batmobile3)
		batmobile3.traverse((child) => {
			if (child.isMesh && !child.name.includes('Floor')) child.material = selectedMaterial;
		});
};

gui.add(materialOptions, 'material', ['matcap', 'shader'])
	.name('Material')
	.onChange(() => {
		updateMaterials(materialOptions.material);
	});

gui.add(materialOptions, 'matcap', 0, matcapTextures.length - 1, 1)
	.name('Matcap')
	.onChange((index) => {
		currentMatcapIndex = index;
		matcapMaterial.matcap = matcapTextures[currentMatcapIndex];
		updateMaterials(materialOptions.material);
	});

/**
 * Batmobiles
 */
let batmobile1 = null;
let batmobile2 = null;
let batmobile3 = null;

gltfLoader.load('./batmobile_movie.glb', (gltf) => {
	batmobile1 = gltf.scene;
	updateMaterials(materialOptions.material); // Apply initial material
	batmobile1.scale.set(0.5, 0.5, 0.5); // Scale down to 1%
	scene.add(batmobile1);
});

gltfLoader.load('./batmobile.glb', (gltf) => {
	batmobile2 = gltf.scene;
	updateMaterials(materialOptions.material); // Apply initial material
	batmobile2.scale.set(0.02, 0.02, 0.02); // Scale down to 1%
	batmobile2.position.set(0, 3, 0); // Position differently from the first Batmobile
	scene.add(batmobile2);
});

gltfLoader.load('./batmobiletumbler.glb', (gltf) => {
	batmobile3 = gltf.scene;
	updateMaterials(materialOptions.material); // Apply initial material
	batmobile3.scale.set(0.25, 0.25, 0.25); // Scale as needed
	batmobile3.position.set(0, -4, 0); // Position differently from the first Batmobile
	scene.add(batmobile3);
});

/**
 * Text
 */
const fontLoader = new FontLoader();

// Load a font
fontLoader.load('/fonts/BatmanForeverAlternate_Regular.json', (font) => {
	const fontMaterial = new THREE.MeshMatcapMaterial({ matcap: matcapTextures[0] });
	const textGeometry = new TextGeometry('Hello Bruce', {
		font: font,
		size: 1,
		height: 0.2,
		curveSegments: 64,
		bevelEnabled: true,
		bevelThickness: 0.4,
		bevelSize: 0.045,
		bevelOffset: 0,
		bevelSegments: 24,
	});

	// Center the text
	textGeometry.computeBoundingBox();
	const textWidth = textGeometry.boundingBox.max.x - textGeometry.boundingBox.min.x;
	textGeometry.translate(-textWidth / 2, 0, 0);

	const textMesh = new THREE.Mesh(textGeometry, fontMaterial);
	textMesh.position.set(-5, 0, -5); // Position the text in front of the camera
	textMesh.rotation.y = Math.PI / 4; // Rotate the text to face the camera
	scene.add(textMesh);
});


/**
 * Object Visibility Controls
 */
const objectVisibility = {
	batmobile1: true,
	batmobile2: true,
	batmobile3: true,
};

gui.add(objectVisibility, 'batmobile3')
	.name('Show Batmobile 1')
	.onChange((value) => {
		if (batmobile3) batmobile3.visible = value;
	});
gui.add(objectVisibility, 'batmobile1')
	.name('Show Batmobile 2')
	.onChange((value) => {
		if (batmobile1) batmobile1.visible = value;
	});
gui.add(objectVisibility, 'batmobile2')
	.name('Show Batmobile 3')
	.onChange((value) => {
		if (batmobile2) batmobile2.visible = value;
	});

/**
 * Animate
 */
const clock = new THREE.Clock();

const tick = () => {
	const elapsedTime = clock.getElapsedTime();

	// Update materials
	shaderMaterial.uniforms.uTime.value = elapsedTime;

	// Rotate objects in place
	if (batmobile1) {
		batmobile1.rotation.y = Math.sin(elapsedTime * 0.2);
	}

	if (batmobile2) {
		batmobile2.rotation.y = -Math.sin(elapsedTime * 0.2 + 1);
	}

	if (batmobile3) {
		batmobile3.rotation.y = Math.sin(elapsedTime * 0.3 + 2);
	}

	// Update controls
	controls.update();

	// Render
	renderer.render(scene, camera);

	// Call tick again on the next frame
	window.requestAnimationFrame(tick);
};

tick();
