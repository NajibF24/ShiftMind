import React, { useMemo, useState, memo } from 'react';
import { Text } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { PAINTING_DATA, GALLERY_RADIUS } from './galleryData';

// ─── Per-frame accent map (constant, no re-render) ───────────────────────────
const FRAME_ACCENT = {
  ask:                 '#8b5cf6',
  dashboard:           '#0ea5e9',
  knowledge:           '#10b981',
  capture:             '#e11d48',
  journal:             '#f59e0b',
  workflows:           '#06b6d4',
  experts:             '#a855f7',
  checklists:          '#10b981',
  approvals:           '#f43f5e',
  'knowledge-manager': '#6366f1',
};

// ─── UNIFORM frame size — semua lukisan SAMA BESAR ───────────────────────────
const FRAME_W = 4.2;
const FRAME_H = 3.4;

const outerGeo   = new THREE.PlaneGeometry(FRAME_W + 0.4, FRAME_H + 0.4);
const borderGeo  = new THREE.PlaneGeometry(FRAME_W + 0.2, FRAME_H + 0.2);
const matGeo     = new THREE.PlaneGeometry(FRAME_W - 0.2, FRAME_H - 0.2);
const canvasGeo  = new THREE.PlaneGeometry(FRAME_W - 0.4, FRAME_H - 0.4);
const overlayGeo = new THREE.PlaneGeometry(FRAME_W - 0.4, FRAME_H - 0.4);
const dividerGeo = new THREE.PlaneGeometry(2.2, 0.012);
const haloGeo    = new THREE.PlaneGeometry(FRAME_W + 0.8, FRAME_H + 0.8);

// ─── Shared neutral materials (never change) ──────────────────────────────────
const outerMat = new THREE.MeshStandardMaterial({ color: '#e8ecf4', roughness: 0.5, metalness: 0.05 });
const innerMat = new THREE.MeshStandardMaterial({ color: '#f5f7fc', roughness: 0.9 });

// ─── Single ArtFrame ─────────────────────────────────────────────────────────
const ArtFrame = memo(function ArtFrame({
  id, position, rotation, texture, title, artist,
  featureTitle, featureIcon, featureLabel, onClick,
}) {
  const [hovered, setHovered] = useState(false);
  const accent = FRAME_ACCENT[id] || '#0ea5e9';
  const { invalidate } = useThree();

  const borderMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: accent, metalness: 0.2, roughness: 0.5,
    emissive: new THREE.Color(accent), emissiveIntensity: 0.10,
  }), [accent]);

  const canvasMat = useMemo(() => new THREE.MeshStandardMaterial({
    map: texture, roughness: 0.5, metalness: 0.0,
  }), [texture]);

  const overlayMat = useMemo(() => new THREE.MeshBasicMaterial({
    color: new THREE.Color(accent), transparent: true, opacity: 0,
  }), [accent]);

  const dividerMat = useMemo(() => new THREE.MeshBasicMaterial({
    color: new THREE.Color(accent), transparent: true, opacity: 0.45,
  }), [accent]);

  const haloMat = useMemo(() => new THREE.MeshBasicMaterial({
    color: new THREE.Color(accent), transparent: true,
    opacity: 0.08, side: THREE.BackSide,
  }), [accent]);

  const handleOver = () => {
    setHovered(true);
    borderMat.emissiveIntensity = 0.30;
    overlayMat.opacity = 0.07;
    document.body.style.cursor = 'pointer';
    invalidate();
  };
  const handleOut = () => {
    setHovered(false);
    borderMat.emissiveIntensity = 0.10;
    overlayMat.opacity = 0;
    document.body.style.cursor = '';
    invalidate();
  };

  return (
    <group position={position} rotation={rotation}>
      <mesh geometry={outerGeo} position={[0, 0, -0.08]} material={outerMat} />
      <mesh geometry={borderGeo} position={[0, 0, 0]} material={borderMat} />
      <mesh geometry={matGeo} position={[0, 0, 0.03]} material={innerMat} />

      {/* Artwork canvas */}
      <mesh
        geometry={canvasGeo}
        material={canvasMat}
        position={[0, 0, 0.08]}
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        onPointerOver={handleOver}
        onPointerOut={handleOut}
      />

      {/* Hover tint */}
      <mesh geometry={overlayGeo} material={overlayMat} position={[0, 0, 0.09]} />

      {/* ═══ ALL TEXT — dark on bright background + white outline ═══ */}

      {/* Feature Icon */}
      <Text position={[0, 0.55, 0.12]} fontSize={0.45} color="#1a2744" anchorX="center" anchorY="middle">
        {featureIcon}
      </Text>

      {/* Feature Title — bold dark, white outline for max readability */}
      <Text
        position={[0, -0.05, 0.12]} fontSize={0.28} color="#0f172a"
        anchorX="center" anchorY="middle" maxWidth={3.2} textAlign="center"
        outlineWidth={0.018} outlineColor="#ffffff"
      >
        {featureTitle}
      </Text>

      {/* CLICK TO ENTER — larger, darker accent for visibility */}
      <Text position={[0, -0.50, 0.12]} fontSize={0.16} color="#0f172a" anchorX="center" anchorY="middle" letterSpacing={0.06}
        outlineWidth={0.010} outlineColor="#ffffff"
      >
        {featureLabel}
      </Text>

      {/* Divider line */}
      <mesh geometry={dividerGeo} material={dividerMat} position={[0, -0.75, 0.11]} />

      {/* Painting title — enlarged */}
      <Text position={[0, -0.98, 0.12]} fontSize={0.15} color="#1e293b" anchorX="center" anchorY="middle" letterSpacing={0.03}
        outlineWidth={0.008} outlineColor="#ffffff"
      >
        {title}
      </Text>

      {/* Artist / category — enlarged */}
      <Text position={[0, -1.22, 0.12]} fontSize={0.12} color="#475569" anchorX="center" anchorY="middle" letterSpacing={0.02}
        outlineWidth={0.006} outlineColor="#ffffff"
      >
        {artist}
      </Text>

      {/* Hover halo */}
      {hovered && <mesh geometry={haloGeo} material={haloMat} position={[0, 0, -0.09]} />}
    </group>
  );
});

// ─── GYS Wall Text — tulisan besar di dinding ────────────────────────────────
const GYS_GREEN = '#1B6B37'; // Garuda Yamato Steel corporate green

const WallBranding = memo(function WallBranding() {
  // Place text segments around the circular wall at painting height + above
  const wallR = 19.85; // slightly in front of wall (wall radius = 20)
  const textY = 9.5;   // above the paintings
  
  // "GARUDA YAMATO STEEL" repeated around the wall in multiple positions
  const segments = useMemo(() => {
    const count = 5; // 5 evenly-spaced text instances around the circle
    return Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * Math.PI * 2;
      return {
        pos: [Math.sin(angle) * wallR, textY, Math.cos(angle) * wallR],
        rot: [0, angle + Math.PI, 0],
      };
    });
  }, []);

  return (
    <group>
      {segments.map((seg, i) => (
        <group key={i} position={seg.pos} rotation={seg.rot}>
          {/* Main brand text */}
          <Text
            position={[0, 0, 0]}
            fontSize={1.2}
            color={GYS_GREEN}
            anchorX="center"
            anchorY="middle"
            letterSpacing={0.15}
            outlineWidth={0.02}
            outlineColor="rgba(255,255,255,0.4)"
            curveRadius={wallR}
          >
            GARUDA YAMATO STEEL
          </Text>
          {/* Subtle subtitle */}
          <Text
            position={[0, -0.9, 0]}
            fontSize={0.25}
            color={GYS_GREEN}
            anchorX="center"
            anchorY="middle"
            letterSpacing={0.30}
            outlineWidth={0.008}
            outlineColor="rgba(255,255,255,0.3)"
            curveRadius={wallR}
          >
            QUALITY • INNOVATION • SUSTAINABILITY
          </Text>
        </group>
      ))}
    </group>
  );
});

// ─── Gallery Room — static, never re-renders ──────────────────────────────────
const GalleryRoom = memo(function GalleryRoom() {
  const floorMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#d8e4f2', roughness: 0.35, metalness: 0.0,
  }), []);
  const wallMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#eef1f8', roughness: 0.95, metalness: 0.0, side: THREE.BackSide,
  }), []);
  const crownMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: GYS_GREEN, metalness: 0.3, roughness: 0.6,
    emissive: new THREE.Color(GYS_GREEN), emissiveIntensity: 0.08,
  }), []);
  const baseMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#1a3a2a', roughness: 0.85, metalness: 0.05,
  }), []);
  const ceilMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#f5f8ff', roughness: 0.98,
  }), []);

  return (
    <group>
      {/* Floor */}
      <mesh position={[0, -2, 0]} rotation={[-Math.PI / 2, 0, 0]} material={floorMat}>
        <circleGeometry args={[22, 32]} />
      </mesh>

      {/* Walls */}
      <mesh position={[0, 6, 0]} material={wallMat}>
        <cylinderGeometry args={[20, 20, 16, 32, 1, true]} />
      </mesh>

      {/* Crown moulding — GYS green */}
      <mesh position={[0, 14, 0]} rotation={[Math.PI / 2, 0, 0]} material={crownMat}>
        <torusGeometry args={[19.9, 0.3, 8, 60]} />
      </mesh>

      {/* Baseboard — dark green */}
      <mesh position={[0, -1.5, 0]} rotation={[Math.PI / 2, 0, 0]} material={baseMat}>
        <torusGeometry args={[19.9, 0.5, 8, 60]} />
      </mesh>

      {/* Ceiling */}
      <mesh position={[0, 14.1, 0]} rotation={[-Math.PI / 2, 0, 0]} material={ceilMat}>
        <circleGeometry args={[20, 32]} />
      </mesh>
    </group>
  );
});

// ─── Main export ──────────────────────────────────────────────────────────────
export default function ArtGallery3D({ onSelect }) {
  const textures = useMemo(() =>
    Object.fromEntries(PAINTING_DATA.map(p => [p.id, p.textureGen()]))
  , []);

  const frames = useMemo(() => PAINTING_DATA.map((p, i) => {
    const angle = (i / PAINTING_DATA.length) * Math.PI * 2;
    return {
      ...p,
      pos: [Math.sin(angle) * GALLERY_RADIUS, 2.5, Math.cos(angle) * GALLERY_RADIUS],
      rot: [0, angle + Math.PI, 0],
    };
  }), []);

  return (
    <>
      <GalleryRoom />
      <WallBranding />
      {frames.map((f) => (
        <ArtFrame
          key={f.id}
          id={f.id}
          position={f.pos}
          rotation={f.rot}
          texture={textures[f.id]}
          title={f.title}
          artist={f.artist}
          featureTitle={f.featureTitle}
          featureIcon={f.featureIcon}
          featureLabel={f.featureLabel}
          onClick={() => onSelect(f.id)}
        />
      ))}
    </>
  );
}
