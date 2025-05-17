import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf0f0f0);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 2, 6);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(5, 10, 7);
scene.add(directionalLight);

const axesHelper = new THREE.AxesHelper(2);
scene.add(axesHelper);

const fbxLoader = new FBXLoader();
fbxLoader.load('source/fence.fbx', (fbx) => {
    // Center the mesh
    const bbox = new THREE.Box3().setFromObject(fbx);
    const center = bbox.getCenter(new THREE.Vector3());
    fbx.position.sub(center);
    fbx.add(new THREE.AxesHelper(1));
    scene.add(fbx);

    // Traverse and log geometry/material/texture info
    fbx.traverse(child => {
        if (child.isMesh) {
            console.log('Mesh:', child.name);
            console.log('Geometry:', child.geometry);
            console.log('Vertices:', child.geometry.attributes.position?.count);
            console.log('UVs:', child.geometry.attributes.uv?.count);
            console.log('Material:', child.material);
            if (child.material) {
                if (child.material.map) {
                    console.log('Texture map:', child.material.map);
                } else {
                    console.log('No texture map found on material.');
                }
            }
        }
    });
}, undefined, (err) => {
    console.error('Failed to load FBX:', err);
});

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}); 