import { useEffect, useRef } from 'react';
import * as THREE from 'three';

const NODE_COUNT = 60;
const CONNECTION_DIST = 180;

export default function NeuralBackground({ style = {} }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(el.clientWidth, el.clientHeight);
    renderer.setClearColor(0x000000, 0);
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, el.clientWidth / el.clientHeight, 1, 3000);
    camera.position.z = 700;

    const nodes = [];
    const velocities = [];
    // Soft pastel colors for light theme
    const colors = [0x0ea5e9, 0x3b82f6, 0x7c3aed, 0x10b981, 0x6366f1];

    for (let i = 0; i < NODE_COUNT; i++) {
      const col = colors[Math.floor(Math.random() * colors.length)];
      const size = 1.5 + Math.random() * 2;
      const geo = new THREE.SphereGeometry(size, 12, 12);
      const mat = new THREE.MeshBasicMaterial({
        color: col,
        transparent: true,
        opacity: 0.12 + Math.random() * 0.15,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(
        (Math.random() - 0.5) * el.clientWidth * 1.5,
        (Math.random() - 0.5) * el.clientHeight * 1.5,
        (Math.random() - 0.5) * 400
      );
      scene.add(mesh);
      nodes.push(mesh);
      velocities.push(new THREE.Vector3(
        (Math.random() - 0.5) * 0.15,
        (Math.random() - 0.5) * 0.15,
        (Math.random() - 0.5) * 0.06
      ));
    }

    const linesMat = new THREE.LineBasicMaterial({
      color: 0x0ea5e9,
      transparent: true,
      opacity: 0.04,
    });

    const maxLines = NODE_COUNT * NODE_COUNT;
    const linePositions = new Float32Array(maxLines * 6);
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    const linesMesh = new THREE.LineSegments(lineGeo, linesMat);
    scene.add(linesMesh);

    const mouse = { x: 0, y: 0 };
    const onMouseMove = (e) => {
      mouse.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.y = -(e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('mousemove', onMouseMove);

    const onResize = () => {
      if (!el || el.clientWidth === 0 || el.clientHeight === 0) return;
      camera.aspect = el.clientWidth / el.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(el.clientWidth, el.clientHeight);
    };
    window.addEventListener('resize', onResize);

    let frame = 0;
    let animId;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (!el || el.clientWidth === 0 || el.clientHeight === 0) return;
      frame++;

      camera.position.x += (mouse.x * 30 - camera.position.x) * 0.01;
      camera.position.y += (mouse.y * 20 - camera.position.y) * 0.01;
      camera.lookAt(scene.position);

      const W = el.clientWidth * 0.8;
      const H = el.clientHeight * 0.8;
      nodes.forEach((node, i) => {
        node.position.addScaledVector(velocities[i], 1);
        if (Math.abs(node.position.x) > W) velocities[i].x *= -1;
        if (Math.abs(node.position.y) > H) velocities[i].y *= -1;
        if (Math.abs(node.position.z) > 200) velocities[i].z *= -1;
        node.material.opacity = 0.08 + 0.12 * Math.sin(frame * 0.012 + i * 0.5);
        const s = 1 + 0.1 * Math.sin(frame * 0.015 + i);
        node.scale.setScalar(s);
      });

      let lineIdx = 0;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dist = nodes[i].position.distanceTo(nodes[j].position);
          if (dist < CONNECTION_DIST && lineIdx < maxLines) {
            linePositions[lineIdx * 6 + 0] = nodes[i].position.x;
            linePositions[lineIdx * 6 + 1] = nodes[i].position.y;
            linePositions[lineIdx * 6 + 2] = nodes[i].position.z;
            linePositions[lineIdx * 6 + 3] = nodes[j].position.x;
            linePositions[lineIdx * 6 + 4] = nodes[j].position.y;
            linePositions[lineIdx * 6 + 5] = nodes[j].position.z;
            lineIdx++;
          }
        }
      }
      for (let i = lineIdx; i < maxLines; i++) {
        linePositions.fill(0, i * 6, i * 6 + 6);
      }
      lineGeo.attributes.position.needsUpdate = true;
      lineGeo.setDrawRange(0, lineIdx * 2);
      linesMat.opacity = 0.02 + 0.03 * Math.sin(frame * 0.003);

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', ...style }}
    />
  );
}
