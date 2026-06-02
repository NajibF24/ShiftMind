import React, { useMemo, useState } from 'react';
import { Text, MeshReflectorMaterial, Float } from '@react-three/drei';
import * as THREE from 'three';

/* ── Bright texture generators ── */
function cosmicTexture() {
  const c = document.createElement('canvas');
  c.width = 1024; c.height = 768;
  const ctx = c.getContext('2d');
  const w = 1024, h = 768;
  const bg = ctx.createRadialGradient(w/2, h/2, 0, w/2, h/2, 500);
  bg.addColorStop(0, '#2a1f5e'); bg.addColorStop(0.5, '#1a1540'); bg.addColorStop(1, '#0e0a20');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
  [[w/3,h/3,220,'rgba(130,100,220,0.18)'],[w*0.7,h*0.6,180,'rgba(80,120,200,0.12)'],[w/2,h/2,140,'rgba(200,180,255,0.10)']].forEach(([x,y,r,col]) => {
    const g = ctx.createRadialGradient(x,y,0,x,y,r); g.addColorStop(0,col); g.addColorStop(1,'transparent');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill();
  });
  for (let i=0;i<300;i++){ctx.fillStyle=`rgba(220,215,255,${0.2+Math.random()*0.6})`;ctx.beginPath();ctx.arc(Math.random()*w,Math.random()*h,0.3+Math.random()*2,0,Math.PI*2);ctx.fill()}
  ctx.strokeStyle='rgba(200,180,255,0.15)';ctx.lineWidth=1;
  for(let a=0;a<Math.PI*6;a+=0.03){const r=10+a*20,cx=w*0.55,cy=h*0.35;ctx.fillStyle=`rgba(200,180,255,${0.15+Math.random()*0.25})`;ctx.beginPath();ctx.arc(cx+Math.cos(a)*r,cy+Math.sin(a*0.7)*r*0.5,1.5,0,Math.PI*2);ctx.fill()}
  const t=new THREE.CanvasTexture(c);t.needsUpdate=true;return t;
}
function geometricTexture() {
  const c=document.createElement('canvas');c.width=1024;c.height=768;
  const ctx=c.getContext('2d');const w=1024,h=768;
  const bg=ctx.createLinearGradient(0,0,w,h);bg.addColorStop(0,'#f5f0e8');bg.addColorStop(0.5,'#ede6d8');bg.addColorStop(1,'#e0d6c4');
  ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
  [[w*0.35,h*0.45,200,'rgba(200,180,100,0.12)'],[w*0.75,h*0.55,140,'rgba(120,130,160,0.10)'],[w*0.5,h*0.25,90,'rgba(180,160,80,0.08)']].forEach(([x,y,r,col])=>{
    const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,col);g.addColorStop(1,'transparent');
    ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
  });
  ctx.strokeStyle='rgba(200,180,100,0.3)';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(w*0.15,h*0.85);ctx.lineTo(w*0.4,h*0.15);ctx.lineTo(w*0.85,h*0.75);ctx.stroke();
  ctx.fillStyle='rgba(180,160,80,0.08)';ctx.fillRect(w*0.68,h*0.12,70,70);ctx.strokeRect(w*0.68,h*0.12,70,70);
  ctx.fillStyle='rgba(80,90,120,0.1)';ctx.fillRect(w*0.12,h*0.55,55,130);
  ctx.strokeStyle='rgba(200,180,100,0.2)';ctx.lineWidth=0.8;
  const cx=w*0.5,cy=h*0.5;for(let i=0;i<12;i++){const a=i/12*Math.PI*2;ctx.beginPath();ctx.moveTo(cx+Math.cos(a)*40,cy+Math.sin(a)*40);ctx.lineTo(cx+Math.cos(a)*320,cy+Math.sin(a)*320);ctx.stroke()}
  for(let i=0;i<40;i++){ctx.fillStyle=`rgba(200,180,100,${0.1+Math.random()*0.3})`;ctx.beginPath();ctx.arc(Math.random()*w,Math.random()*h,1+Math.random()*3,0,Math.PI*2);ctx.fill()}
  const t=new THREE.CanvasTexture(c);t.needsUpdate=true;return t;
}
function organicTexture() {
  const c=document.createElement('canvas');c.width=1024;c.height=768;
  const ctx=c.getContext('2d');const w=1024,h=768;
  const bg=ctx.createLinearGradient(0,0,0,h);bg.addColorStop(0,'#1a3a3a');bg.addColorStop(0.5,'#1f4840');bg.addColorStop(1,'#0e2828');
  ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
  [[w*0.2,h*0.3,250,'rgba(70,150,130,0.12)'],[w*0.8,h*0.7,200,'rgba(180,160,90,0.08)'],[w*0.5,h*0.5,180,'rgba(80,160,140,0.06)']].forEach(([x,y,r,col])=>{
    const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,col);g.addColorStop(1,'transparent');
    ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
  });
  for(let i=0;i<6;i++){ctx.beginPath();ctx.strokeStyle=[['rgba(70,150,130,0.2)'],['rgba(180,160,90,0.15)'],['rgba(80,160,140,0.12)']][i%3];ctx.lineWidth=2+i*1.5;const sy=h*(0.15+i*0.12);ctx.moveTo(0,sy);for(let x=0;x<=w;x+=4){ctx.lineTo(x,sy+Math.sin(x*0.007+i*1.5)*55+Math.sin(x*0.014+i)*25)}ctx.stroke()}
  ctx.strokeStyle='rgba(180,160,90,0.1)';ctx.lineWidth=0.8;for(let i=0;i<15;i++){const sx=Math.random()*w,sy=Math.random()*h;ctx.beginPath();ctx.moveTo(sx,sy);for(let t=0;t<1;t+=0.05){ctx.lineTo(sx+Math.sin(t*50+i)*60*t,sy+t*200+Math.cos(t*30+i)*40*t)}ctx.stroke()}
  for(let i=0;i<12;i++){const x=w*(0.1+Math.random()*0.8),y=h*(0.1+Math.random()*0.8);ctx.fillStyle=`rgba(180,160,90,${0.15+Math.random()*0.2})`;ctx.beginPath();ctx.ellipse(x,y,6+Math.random()*18,2+Math.random()*6,Math.random()*Math.PI,0,Math.PI*2);ctx.fill()}
  const t=new THREE.CanvasTexture(c);t.needsUpdate=true;return t;
}
function warmTexture() {
  const c=document.createElement('canvas');c.width=1024;c.height=768;
  const ctx=c.getContext('2d');const w=1024,h=768;
  const bg=ctx.createRadialGradient(w*0.5,h*0.45,0,w*0.5,h*0.45,500);bg.addColorStop(0,'#a06030');bg.addColorStop(0.3,'#7a4422');bg.addColorStop(0.6,'#4a2818');bg.addColorStop(1,'#1a0e0a');
  ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
  [[w*0.3,h*0.35,300,'rgba(220,180,80,0.08)'],[w*0.7,h*0.65,250,'rgba(200,140,80,0.1)'],[w*0.5,h*0.2,200,'rgba(220,170,110,0.06)']].forEach(([x,y,r,col])=>{
    const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,col);g.addColorStop(1,'transparent');
    ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
  });
  ctx.strokeStyle='rgba(220,190,100,0.12)';ctx.lineWidth=1;const cx=w*0.5,cy=h*0.5;for(let i=0;i<16;i++){const a=i/16*Math.PI*2;ctx.beginPath();ctx.moveTo(cx+Math.cos(a)*25,cy+Math.sin(a)*25);ctx.lineTo(cx+Math.cos(a)*380,cy+Math.sin(a)*380);ctx.stroke()}
  for(let i=0;i<50;i++){const x=w*(0.05+Math.random()*0.9),y=h*(0.05+Math.random()*0.9);ctx.fillStyle=`rgba(220,200,160,${0.05+Math.random()*0.12})`;ctx.beginPath();ctx.arc(x,y,0.5+Math.random()*1.5,0,Math.PI*2);ctx.fill()}
  const t=new THREE.CanvasTexture(c);t.needsUpdate=true;return t;
}
function modernTexture() {
  const c=document.createElement('canvas');c.width=1024;c.height=768;
  const ctx=c.getContext('2d');const w=1024,h=768;
  const bg=ctx.createLinearGradient(0,0,w,h);bg.addColorStop(0,'#0f2027');bg.addColorStop(0.5,'#203a43');bg.addColorStop(1,'#2c5364');
  ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
  for(let i=0;i<8;i++){ctx.strokeStyle=`rgba(100,200,255,${0.05+i*0.02})`;ctx.lineWidth=1;const y=h*(0.1+i*0.1);ctx.beginPath();ctx.moveTo(0,y);for(let x=0;x<=w;x+=3){ctx.lineTo(x,y+Math.sin(x*0.005+i)*30+Math.sin(x*0.012+i*1.4)*15)}ctx.stroke()}
  for(let i=0;i<30;i++){ctx.fillStyle=`rgba(100,200,255,${0.1+Math.random()*0.3})`;ctx.beginPath();ctx.arc(Math.random()*w,Math.random()*h,1+Math.random()*2.5,0,Math.PI*2);ctx.fill()}
  const t=new THREE.CanvasTexture(c);t.needsUpdate=true;return t;
}

/* ── Frame component ── */
function ArtFrame({ position, rotation, texture, title, artist, featureTitle, featureIcon, featureLabel, onClick, index }) {
  const [hovered, setHovered] = useState(false);
  const hue = (index * 40) % 360;
  const glowColor = new THREE.Color(`hsl(${hue}, 60%, 50%)`);

  return (
    <group position={position} rotation={rotation}>
      {/* Shadow backing */}
      <mesh position={[0, 0, -0.08]}>
        <planeGeometry args={[4.6, 3.8]} />
        <meshStandardMaterial color="#1a1208" roughness={0.7} metalness={0.2} />
      </mesh>
      {/* Brighter gold frame */}
      <mesh position={[0, 0, 0]}>
        <planeGeometry args={[4.4, 3.6]} />
        <meshStandardMaterial color="#c8a840" metalness={0.9} roughness={0.15} emissive={glowColor} emissiveIntensity={hovered ? 0.2 : 0.03} />
      </mesh>
      {/* Inner mat */}
      <mesh position={[0, 0, 0.03]}>
        <planeGeometry args={[4.1, 3.3]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.95} />
      </mesh>
      {/* Canvas */}
      <mesh position={[0, 0, 0.08]} onClick={(e)=>{e.stopPropagation();onClick();}}
        onPointerOver={()=>{setHovered(true);document.body.style.cursor='pointer';}}
        onPointerOut={()=>{setHovered(false);document.body.style.cursor='';}}
      >
        <planeGeometry args={[3.9, 3.1]} />
        <meshStandardMaterial map={texture} roughness={0.4} metalness={0.01} />
      </mesh>
      {/* Vignette */}
      <mesh position={[0, 0, 0.09]}>
        <planeGeometry args={[3.9, 3.1]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.20} />
      </mesh>
      {/* Icon */}
      <Text position={[0, 0.7, 0.12]} fontSize={0.55} color="#f0ead0" anchorX="center" anchorY="middle">{featureIcon}</Text>
      {/* Title */}
      <Text position={[0, 0.0, 0.12]} fontSize={0.32} color="#f0ead0" anchorX="center" anchorY="middle" fontWeight="bold" maxWidth={3.5} textAlign="center">{featureTitle}</Text>
      {/* Action label */}
      <Text position={[0, -0.5, 0.12]} fontSize={0.14} color="#d4c080" anchorX="center" anchorY="middle" letterSpacing={0.08}>{featureLabel}</Text>
      {/* Divider */}
      <mesh position={[0, -0.8, 0.11]}><planeGeometry args={[2.5, 0.012]} /><meshBasicMaterial color="#d4c080" transparent opacity={0.35} /></mesh>
      {/* Subtitle */}
      <Text position={[0, -1.05, 0.12]} fontSize={0.13} color="#d4c080" anchorX="center" anchorY="middle" letterSpacing={0.04}>{title}</Text>
      <Text position={[0, -1.25, 0.12]} fontSize={0.1} color="#a08850" anchorX="center" anchorY="middle" letterSpacing={0.02}>{artist}</Text>
      {/* Hover glow */}
      {hovered && (
        <mesh position={[0, 0, -0.09]}>
          <planeGeometry args={[5.0, 4.2]} />
          <meshBasicMaterial color={glowColor} transparent opacity={0.08} side={THREE.BackSide} />
        </mesh>
      )}
    </group>
  );
}

/* ── Circular Gallery Room ── */
function GalleryRoom() {
  return (
    <group>
      {/* Floor */}
      <mesh position={[0, -2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[20, 64]} />
        <MeshReflectorMaterial blur={[200, 80]} resolution={512} mixBlur={0.6} mixStrength={3}
          roughness={0.5} depthScale={0.2} minDepthThreshold={0.6} maxDepthThreshold={1.0}
          color="#e8e0d0" metalness={0.01} />
      </mesh>
      
      {/* Curved Wall */}
      <mesh position={[0, 6, 0]}>
        <cylinderGeometry args={[20, 20, 16, 64, 1, true]} />
        <meshStandardMaterial color="#f0ece0" roughness={0.95} metalness={0.02} side={THREE.BackSide} />
      </mesh>

      {/* Crown moulding (Torus) */}
      <mesh position={[0, 14, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[19.9, 0.3, 16, 100]} />
        <meshStandardMaterial color="#b8a050" metalness={0.5} roughness={0.4} />
      </mesh>

      {/* Baseboards (Torus) */}
      <mesh position={[0, -1.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[19.9, 0.5, 16, 100]} />
        <meshStandardMaterial color="#5a4020" roughness={0.85} metalness={0.05} />
      </mesh>
    </group>
  );
}

/* ── Painting definitions — all 10 features ── */
export const PAINTING_DATA = [
  { id:'ask',          title:'Cosmic Dawn',        artist:'AI Intelligence',      featureTitle:'Ask ShiftMind AI',      featureIcon:'🧠', featureLabel:'— CLICK TO ENTER —', textureGen:cosmicTexture },
  { id:'dashboard',    title:'Golden Ratio',       artist:'Market Intelligence',  featureTitle:'Market Intelligence',   featureIcon:'📊', featureLabel:'— CLICK TO ENTER —', textureGen:geometricTexture },
  { id:'knowledge',    title:'Emerald Flow',       artist:'Enterprise Brain',     featureTitle:'Enterprise Brain',      featureIcon:'📚', featureLabel:'— CLICK TO ENTER —', textureGen:organicTexture },
  { id:'capture',      title:'Vermilion Sun',      artist:'Upload Knowledge',     featureTitle:'Upload Knowledge',      featureIcon:'📤', featureLabel:'— CLICK TO ENTER —', textureGen:warmTexture },
  { id:'journal',      title:'Amber Waves',        artist:'Work Journal',         featureTitle:'Work Journal',          featureIcon:'📝', featureLabel:'— CLICK TO ENTER —', textureGen:geometricTexture },
  { id:'workflows',    title:'Steel Pulse',        artist:'Workflow Recorder',    featureTitle:'Workflow Recorder',     featureIcon:'⚙️', featureLabel:'— CLICK TO ENTER —', textureGen:cosmicTexture },
  { id:'experts',      title:'Crystal Mind',       artist:'Expert Finder',        featureTitle:'Expert Finder',         featureIcon:'🔍', featureLabel:'— CLICK TO ENTER —', textureGen:modernTexture },
  { id:'checklists',   title:'Iron Guard',         artist:'Daily Checklists',     featureTitle:'Daily Checklists',      featureIcon:'✅', featureLabel:'— CLICK TO ENTER —', textureGen:warmTexture },
  { id:'approvals',    title:'Royal Decree',       artist:'Approvals & Review',   featureTitle:'Approvals & Review',    featureIcon:'📜', featureLabel:'— CLICK TO ENTER —', textureGen:geometricTexture },
  { id:'knowledge-manager', title:'Omniscient',    artist:'Knowledge Manager',    featureTitle:'Knowledge Manager',     featureIcon:'🗂️', featureLabel:'— CLICK TO ENTER —', textureGen:modernTexture },
];

export const GALLERY_RADIUS = 19.5;

export default function ArtGallery3D({ onSelect }) {
  const textures = useMemo(() => Object.fromEntries(
    PAINTING_DATA.map(p => [p.id, p.textureGen()])
  ), []);

  return (
    <>
      <GalleryRoom />
      {PAINTING_DATA.map((p, i) => {
        const angle = (i / PAINTING_DATA.length) * Math.PI * 2;
        const pos = [
          Math.sin(angle) * GALLERY_RADIUS,
          2.5,
          Math.cos(angle) * GALLERY_RADIUS
        ];
        // Rotate frame to face the center
        const rot = [0, angle + Math.PI, 0];

        return (
          <ArtFrame
            key={p.id} position={pos} rotation={rot}
            texture={textures[p.id]}
            title={p.title} artist={p.artist}
            featureTitle={p.featureTitle} featureIcon={p.featureIcon}
            featureLabel={p.featureLabel}
            onClick={() => onSelect(p.id)}
            index={i}
          />
        );
      })}
    </>
  );
}
