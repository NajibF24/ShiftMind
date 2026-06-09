import React, { useMemo, useState } from 'react';
import { Text, MeshReflectorMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { PAINTING_DATA, GALLERY_RADIUS } from './galleryData';

function ArtFrame({ position, rotation, texture, title, artist, featureTitle, featureIcon, featureLabel, onClick }) {
  const [hovered, setHovered] = useState(false);

  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, 0, -0.08]}>
        <planeGeometry args={[4.6, 3.8]} />
        <meshStandardMaterial color="#15100a" roughness={0.8} metalness={0.1} />
      </mesh>
      <mesh position={[0, 0, 0]}>
        <planeGeometry args={[4.4, 3.6]} />
        <meshStandardMaterial color="#c8a840" metalness={0.7} roughness={0.25} emissive="#c8a840" emissiveIntensity={hovered ? 0.08 : 0.02} />
      </mesh>
      <mesh position={[0, 0, 0.03]}>
        <planeGeometry args={[4.1, 3.3]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0, 0.08]} onClick={(e)=>{e.stopPropagation();onClick();}}
        onPointerOver={()=>{setHovered(true);document.body.style.cursor='pointer';}}
        onPointerOut={()=>{setHovered(false);document.body.style.cursor='';}}
      >
        <planeGeometry args={[3.9, 3.1]} />
        <meshStandardMaterial map={texture} roughness={0.5} metalness={0.01} />
      </mesh>
      <mesh position={[0, 0, 0.09]}>
        <planeGeometry args={[3.9, 3.1]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.25} />
      </mesh>
      <Text position={[0, 0.7, 0.12]} fontSize={0.55} color="#f0ead0" anchorX="center" anchorY="middle">{featureIcon}</Text>
      <Text position={[0, 0.0, 0.12]} fontSize={0.32} color="#f0ead0" anchorX="center" anchorY="middle" fontWeight="bold" maxWidth={3.5} textAlign="center">{featureTitle}</Text>
      <Text position={[0, -0.5, 0.12]} fontSize={0.14} color="#d4c080" anchorX="center" anchorY="middle" letterSpacing={0.08}>{featureLabel}</Text>
      <mesh position={[0, -0.8, 0.11]}><planeGeometry args={[2.5, 0.012]} /><meshBasicMaterial color="#d4c080" transparent opacity={0.35} /></mesh>
      <Text position={[0, -1.05, 0.12]} fontSize={0.13} color="#d4c080" anchorX="center" anchorY="middle" letterSpacing={0.04}>{title}</Text>
      <Text position={[0, -1.25, 0.12]} fontSize={0.1} color="#a08850" anchorX="center" anchorY="middle" letterSpacing={0.02}>{artist}</Text>
      {hovered && (
        <mesh position={[0, 0, -0.09]}>
          <planeGeometry args={[5.0, 4.2]} />
          <meshBasicMaterial color="#c8a840" transparent opacity={0.06} side={THREE.BackSide} />
        </mesh>
      )}
    </group>
  );
}

function GalleryRoom() {
  return (
    <group>
      <mesh position={[0, -2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[20, 64]} />
        <MeshReflectorMaterial blur={[200, 80]} resolution={512} mixBlur={0.4} mixStrength={2.5}
          roughness={0.4} depthScale={0.15} minDepthThreshold={0.5} maxDepthThreshold={1.0}
          color="#1a1510" metalness={0.02} />
      </mesh>
      <mesh position={[0, 6, 0]}>
        <cylinderGeometry args={[20, 20, 16, 64, 1, true]} />
        <meshStandardMaterial color="#e8dfd0" roughness={0.95} metalness={0.02} side={THREE.BackSide} />
      </mesh>
      <mesh position={[0, 14, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[19.9, 0.3, 16, 100]} />
        <meshStandardMaterial color="#b89840" metalness={0.5} roughness={0.4} />
      </mesh>
      <mesh position={[0, -1.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[19.9, 0.5, 16, 100]} />
        <meshStandardMaterial color="#4a3620" roughness={0.85} metalness={0.05} />
      </mesh>
    </group>
  );
}

export default function ArtGallery3D({ onSelect }) {
  const textures = useMemo(() => Object.fromEntries(
    PAINTING_DATA.map(p => [p.id, p.textureGen()])
  ), []);

  return (
    <>
      <GalleryRoom />
      {PAINTING_DATA.map((p, i) => {
        const angle = (i / PAINTING_DATA.length) * Math.PI * 2;
        const pos = [Math.sin(angle) * GALLERY_RADIUS, 2.5, Math.cos(angle) * GALLERY_RADIUS];
        const rot = [0, angle + Math.PI, 0];
        return (
          <ArtFrame
            key={p.id} position={pos} rotation={rot}
            texture={textures[p.id]}
            title={p.title} artist={p.artist}
            featureTitle={p.featureTitle} featureIcon={p.featureIcon}
            featureLabel={p.featureLabel}
            onClick={() => onSelect(p.id)}
          />
        );
      })}
    </>
  );
}
