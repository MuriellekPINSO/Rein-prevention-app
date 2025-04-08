import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { Activity, Brain, RefreshCcw } from 'lucide-react';

function App() {
  const mountRef = useRef(null);
  const [isHealthy, setIsHealthy] = useState(true);
  const [isRotating, setIsRotating] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [sceneRef, setSceneRef] = useState(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f6ff);

    const camera = new THREE.PerspectiveCamera(
      75,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    mountRef.current.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    let kidneyModel;

    const loadModel = () => {
      setIsLoading(true);
      if (kidneyModel) scene.remove(kidneyModel);

      const path = isHealthy ? '/models/human_kidney.glb' : '/models/polycystic_kidney.glb';

      if (path.endsWith('.glb') || path.endsWith('.gltf')) {
        const loader = new GLTFLoader();
        loader.load(
          path,
          (gltf) => {
            kidneyModel = gltf.scene;
            kidneyModel.traverse((child) => {
              if (child instanceof THREE.Mesh) {
                child.material = new THREE.MeshPhongMaterial({
                  color: isHealthy ? 0xff6b6b : 0x8b0000,
                  shininess: 80,
                  specular: 0x111111,
                });
              }
            });

            const box = new THREE.Box3().setFromObject(kidneyModel);
            const size = box.getSize(new THREE.Vector3());
            const center = box.getCenter(new THREE.Vector3());
            const scale = 2 / Math.max(size.x, size.y, size.z);
            kidneyModel.scale.set(scale, scale, scale);
            kidneyModel.position.set(-center.x * scale, -center.y * scale, -center.z * scale);

            scene.add(kidneyModel);
            setIsLoading(false);
          },
          undefined,
          () => {
            console.error('Model load failed. Falling back to basic kidney shape.');
            loadFallback();
          }
        );
      } else loadFallback();
    };

    const loadFallback = () => {
      const group = new THREE.Group();

      const bodyGeom = new THREE.SphereGeometry(1, 32, 24);
      bodyGeom.scale(1, 0.7, 0.5);
      const mat = new THREE.MeshPhongMaterial({
        color: isHealthy ? 0xff6b6b : 0x8b0000,
        shininess: 80,
        specular: 0x111111,
      });
      const body = new THREE.Mesh(bodyGeom, mat);
      group.add(body);

      const indent = new THREE.Mesh(
        new THREE.SphereGeometry(0.45, 24, 16).scale(1, 0.7, 0.5),
        new THREE.MeshPhongMaterial({ color: 0x000000, transparent: true, opacity: 0 })
      );
      indent.position.set(-0.6, 0, 0);
      group.add(indent);

      if (!isHealthy) {
        const cystGeom = new THREE.SphereGeometry(0.2, 16, 16);
        const cystMat = new THREE.MeshPhongMaterial({ color: 0xffffaa, transparent: true, opacity: 0.7 });
        for (let i = 0; i < 3; i++) {
          const cyst = new THREE.Mesh(cystGeom, cystMat);
          cyst.position.set(Math.random() * 0.8 - 0.4, Math.random() * 0.4 - 0.2, Math.random() * 0.2 + 0.2);
          cyst.scale.setScalar(Math.random() * 0.3 + 0.2);
          group.add(cyst);
        }
      }

      kidneyModel = group;
      scene.add(kidneyModel);
      setIsLoading(false);
    };

    loadModel();

    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      if (isRotating && kidneyModel) kidneyModel.rotation.y += 0.01;
      renderer.render(scene, camera);
    };
    animate();

    setSceneRef({ scene, camera, renderer, controls, kidneyModel });

    return () => {
      mountRef.current?.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, [isHealthy]);

  useEffect(() => {
    const handleResize = () => {
      if (!mountRef.current || !sceneRef) return;
      const { camera, renderer } = sceneRef;
      camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [sceneRef]);

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-gray-900">Modèle 3D Éducatif des Reins</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray-200">
            <div className="flex space-x-4">
              <button
                onClick={() => setIsHealthy(true)}
                className={`px-4 py-2 rounded-md flex items-center space-x-2 ${isHealthy ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-700'}`}
              >
                <Activity size={20} />
                <span>Rein Sain</span>
              </button>
              <button
                onClick={() => setIsHealthy(false)}
                className={`px-4 py-2 rounded-md flex items-center space-x-2 ${!isHealthy ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-700'}`}
              >
                <Brain size={20} />
                <span>Rein Pathologique</span>
              </button>
              <button
                onClick={() => setIsRotating(!isRotating)}
                className="px-4 py-2 rounded-md bg-blue-500 text-white flex items-center space-x-2"
              >
                <RefreshCcw size={20} />
                <span>{isRotating ? 'Arrêter Rotation' : 'Démarrer Rotation'}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-4">
            <div className="lg:col-span-2 bg-gray-50 rounded-lg relative" style={{ height: '500px' }}>
              <div ref={mountRef} style={{ width: '100%', height: '100%' }} />
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-50 bg-opacity-75">
                  <div className="text-lg font-medium text-gray-700">Chargement du modèle...</div>
                </div>
              )}
            </div>


            <div className="bg-gray-50 p-4 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">
                {isHealthy ? 'Anatomie du Rein Sain' : 'Pathologies Rénales'}
              </h2>
              <div className="space-y-4">
                {isHealthy ? (
                  <div>
                    <h3 className="font-medium">Cortex rénal</h3>
                    <p className="text-sm text-gray-600">Zone périphérique riche en glomérules rénaux.</p>
                    <h3 className="font-medium mt-2">Médulla</h3>
                   
                   <p className="text-sm text-gray-600">Contient les pyramides rénales qui filtrent le sang.</p>
                   
                   <div className="mt-4 p-3 bg-green-100 border border-green-300 rounded">
      <h3 className="font-medium text-green-800">✅ Pourquoi ce rein est considéré comme sain ?</h3>
      <p className="text-sm text-green-700 mt-1">
        Ce rein est sain car il a une structure normale, sans inflammation ni kystes. Il fonctionne efficacement pour filtrer les déchets du sang, équilibrer les liquides du corps et produire des hormones nécessaires.
      </p>
    </div>

    {/* 🛡️ Conseils pour garder ses reins en bonne santé */}
    <div className="mt-4 p-3 bg-blue-100 border border-blue-300 rounded">
      <h3 className="font-medium text-blue-800">🛡️ Comment garder ses reins en bonne santé ?</h3>
      <ul className="list-disc list-inside text-sm text-blue-700 mt-1 space-y-1">
        <li>Boire suffisamment d’eau chaque jour</li>
        <li>Avoir une alimentation équilibrée pauvre en sel et en sucre</li>
        <li>Éviter l’abus d’anti-inflammatoires et d’alcool</li>
        <li>Faire de l’exercice physique régulièrement</li>
        <li>Contrôler sa tension artérielle et son taux de sucre</li>
        <li>Faire des bilans médicaux réguliers</li>
      </ul>
    
    
  </div>
                  </div>
                ) : (
                  <div>
                    <h3 className="font-medium">Rein polykystique</h3>
                    <p className="text-sm text-gray-600">Présence de multiples kystes interférant avec la fonction rénale.</p>
                    <h3 className="font-medium mt-2">Symptômes</h3>
                    <p className="text-sm text-gray-600">Douleurs, hypertension, insuffisance rénale.</p>
                    <div className="mt-6 border-t pt-4">
                    <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded">
    <h3 className="font-medium text-red-800">❌ Pourquoi ce rein est considéré comme pathologique ?</h3>
    <p className="text-sm text-red-700 mt-1">
      Ce rein présente des signes de maladie tels que des lésions, une inflammation ou des kystes. Cela peut affecter sa capacité à filtrer le sang correctement et provoquer un déséquilibre dans le corps.
    </p>
  </div>

  {/* 🩺 Conseils pour prévenir ou ralentir une maladie rénale */}
  <div className="mt-4 p-3 bg-yellow-100 border border-yellow-300 rounded">
    <h3 className="font-medium text-yellow-800">🩺 Conseils pour préserver ou améliorer la santé rénale</h3>
    <ul className="list-disc list-inside text-sm text-yellow-700 mt-1 space-y-1">
      <li>Suivre les traitements médicaux prescrits</li>
      <li>Réduire la consommation de sel et de protéines animales</li>
      <li>Arrêter de fumer et limiter l’alcool</li>
      <li>Surveiller régulièrement la fonction rénale chez un médecin</li>
      <li>Contrôler sa tension artérielle et son diabète</li>
      <li>Boire de l’eau de façon modérée mais régulière</li>
    </ul>
  </div>
</div>

                  </div>
                )}
              </div>
            </div>
            
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
