import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function HologramRing({ size = 200 }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(size, size);
    renderer.setClearColor(0x000000, 0);
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    camera.position.z = 5;

    const wireframeSphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.8, 20, 20),
      new THREE.MeshBasicMaterial({
        color: 0x0ea5e9,
        wireframe: true,
        transparent: true,
        opacity: 0.2,
      })
    );
    scene.add(wireframeSphere);

    const outerRing = new THREE.Mesh(
      new THREE.TorusGeometry(1.8, 0.012, 16, 100),
      new THREE.MeshBasicMaterial({ color: 0x00f5ff, transparent: true, opacity: 0.7 })
    );
    scene.add(outerRing);

    const midRing = new THREE.Mesh(
      new THREE.TorusGeometry(1.3, 0.008, 16, 80),
      new THREE.MeshBasicMaterial({ color: 0x3d7eff, transparent: true, opacity: 0.5 })
    );
    midRing.rotation.x = Math.PI / 4;
    scene.add(midRing);

    const innerRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.9, 0.006, 16, 60),
      new THREE.MeshBasicMaterial({ color: 0x8b5cf6, transparent: true, opacity: 0.4 })
    );
    innerRing.rotation.x = -Math.PI / 3;
    innerRing.rotation.z = Math.PI / 4;
    scene.add(innerRing);

    const dotGeo = new THREE.SphereGeometry(0.035, 8, 8);
    const dots = [];
    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * Math.PI * 2;
      const dot = new THREE.Mesh(
        dotGeo,
        new THREE.MeshBasicMaterial({ color: i % 2 === 0 ? 0x00f5ff : 0x8b5cf6 })
      );
      dot.position.set(Math.cos(angle) * 1.8, Math.sin(angle) * 1.8, 0);
      scene.add(dot);
      dots.push(dot);
    }

    const centerGlow = new THREE.Mesh(
      new THREE.SphereGeometry(0.25, 24, 24),
      new THREE.MeshBasicMaterial({ color: 0x3d7eff, transparent: true, opacity: 0.4 })
    );
    scene.add(centerGlow);

    const particleCount = 60;
    const particleGeo = new THREE.BufferGeometry();
    const particlePos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 2 + Math.random() * 1.5;
      particlePos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      particlePos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      particlePos[i * 3 + 2] = r * Math.cos(phi);
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePos, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x00f5ff,
      size: 0.02,
      transparent: true,
      opacity: 0.6,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    let frame = 0;
    let animId;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      frame++;

      outerRing.rotation.z += 0.006;
      outerRing.rotation.x += 0.002;
      midRing.rotation.z -= 0.008;
      midRing.rotation.y += 0.004;
      innerRing.rotation.z += 0.01;
      innerRing.rotation.x += 0.006;

      wireframeSphere.rotation.x += 0.003;
      wireframeSphere.rotation.y += 0.005;

      particles.rotation.y += 0.002;
      particles.rotation.x += 0.001;

      dots.forEach((dot, i) => {
        const angle = (i / 16) * Math.PI * 2 + frame * 0.008;
        dot.position.x = Math.cos(angle) * 1.8;
        dot.position.y = Math.sin(angle) * 1.8;
        dot.position.z = Math.sin(frame * 0.02 + i) * 0.2;
      });

      centerGlow.material.opacity = 0.3 + 0.3 * Math.sin(frame * 0.04);

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, [size]);

  return <div ref={mountRef} style={{ width: size, height: size }} />;
}
