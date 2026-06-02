import React from 'react';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

function HolographicFrame({ position, rotation, title, icon, onClick, accentColor, label }) {
  const [hovered, setHovered] = React.useState(false);

  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[9.4, 7.9, 0.4]} />
        <meshStandardMaterial
          color="#1a1a2e"
          roughness={0.3}
          metalness={0.7}
          emissive={new THREE.Color(accentColor)}
          emissiveIntensity={hovered ? 0.15 : 0.03}
        />
      </mesh>

      <mesh position={[0, 0, 0.18]}>
        <boxGeometry args={[9.0, 7.5, 0.05]} />
        <meshStandardMaterial
          color="#0a0a1a"
          roughness={0.8}
          metalness={0.2}
          emissive={new THREE.Color(accentColor)}
          emissiveIntensity={hovered ? 0.08 : 0}
        />
      </mesh>

      <mesh position={[0, 0, 0.21]}
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        onPointerOver={(e) => { setHovered(true); document.body.style.cursor = 'pointer'; }}
        onPointerOut={(e) => { setHovered(false); document.body.style.cursor = ''; }}
      >
        <planeGeometry args={[8.5, 7.0]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive={new THREE.Color(accentColor)}
          emissiveIntensity={hovered ? 0.15 : 0}
          roughness={1}
          transparent
          opacity={hovered ? 0.95 : 0.9}
        />

        <Text position={[0, 1.5, 0.01]} fontSize={2.2} color="#111111" anchorX="center" anchorY="middle">
          {icon}
        </Text>

        <Text position={[0, -1, 0.01]} fontSize={0.55} color="#111111" anchorX="center" anchorY="middle" maxWidth={7} textAlign="center" fontWeight="bold">
          {title}
        </Text>

        <Text position={[0, -2.2, 0.01]} fontSize={0.28} color={accentColor} anchorX="center" anchorY="middle">
          {label}
        </Text>
      </mesh>

      {hovered && (
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[9.6, 8.1, 0.02]} />
          <meshBasicMaterial
            color={accentColor}
            transparent
            opacity={0.2}
            side={THREE.BackSide}
          />
        </mesh>
      )}
    </group>
  );
}

export default function InteractiveMonitors({ onSelect }) {
  return (
    <>
      <HolographicFrame
        position={[0, 3, -14.4]}
        rotation={[0, 0, 0]}
        title="Ask ShiftMind AI"
        icon="🧠"
        label="Click to Chat"
        onClick={() => onSelect('ask')}
        accentColor="#00bcd4"
      />
      <HolographicFrame
        position={[-14.4, 3, 0]}
        rotation={[0, Math.PI / 2, 0]}
        title="Market Intelligence"
        icon="📊"
        label="View Dashboard"
        onClick={() => onSelect('dashboard')}
        accentColor="#4caf50"
      />
      <HolographicFrame
        position={[14.4, 3, 0]}
        rotation={[0, -Math.PI / 2, 0]}
        title="Enterprise Brain"
        icon="📚"
        label="Manage Knowledge"
        onClick={() => onSelect('knowledge')}
        accentColor="#9c27b0"
      />
      <HolographicFrame
        position={[0, 3, 14.4]}
        rotation={[0, Math.PI, 0]}
        title="Upload SOP & Memory"
        icon="📤"
        label="Add Document"
        onClick={() => onSelect('capture')}
        accentColor="#ff9800"
      />
    </>
  );
}
