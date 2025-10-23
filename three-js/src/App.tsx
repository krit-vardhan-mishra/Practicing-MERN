import { BoxGeometry, Mesh, MeshBasicMaterial, PerspectiveCamera, Scene, WebGLRenderer } from "three";
import { useEffect, useRef } from "react";
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const scene = new Scene();
    const cubeGeometry = new BoxGeometry(1, 1, 1);
    const faceColors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'];
    const cubeMaterials = faceColors.map(color => new MeshBasicMaterial({ color }));
    const cubeMesh = new Mesh(cubeGeometry, cubeMaterials);
    scene.add(cubeMesh);

    const camera = new PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      200
    );
    camera.position.z = 5;
    const renderer = new WebGLRenderer({ canvas: canvasRef.current as HTMLCanvasElement, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const controls = new OrbitControls(camera, canvasRef.current);
    controls.enableDamping = true;
    controls.autoRotate = true;

    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    const renderLoop = () => {
      controls.update();  // remember always call update() before render()
      renderer.render(scene, camera);
      requestAnimationFrame(renderLoop);
    }

    renderLoop();
  }, [canvasRef]);

  return (
    <>
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100vh' }} />
    </>
  )
}

export default App;