import * as THREE from 'three';

function createCanvasTexture(fn) {
  const c = document.createElement('canvas');
  c.width = 1024; c.height = 768;
  const ctx = c.getContext('2d');
  fn(ctx, 1024, 768);
  const t = new THREE.CanvasTexture(c);
  t.needsUpdate = true;
  return t;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ALL TEXTURES — BRIGHT backgrounds agar teks gelap SELALU terbaca
// Setiap lukisan tetap punya karakter artistik unik, tapi dengan latar terang
// ═══════════════════════════════════════════════════════════════════════════════

// 🧠 Ask ShiftMind AI — Soft violet aurora
export function cosmicTexture() {
  return createCanvasTexture((ctx, w, h) => {
    const bg = ctx.createRadialGradient(w/2, h/2, 0, w/2, h/2, 500);
    bg.addColorStop(0, '#f0e6ff'); bg.addColorStop(0.4, '#e4d4fa'); bg.addColorStop(1, '#d8c4f5');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
    // Soft nebula glows
    const layers = [
      [w*0.3, h*0.4, 200, 'rgba(168,130,240,0.12)'],
      [w*0.7, h*0.6, 160, 'rgba(200,160,255,0.10)'],
      [w*0.5, h*0.2, 120, 'rgba(220,190,255,0.08)'],
    ];
    layers.forEach(([x,y,r,col]) => {
      const g = ctx.createRadialGradient(x,y,0,x,y,r);
      g.addColorStop(0, col); g.addColorStop(1, 'transparent');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill();
    });
    // Sparkle stars
    for (let i = 0; i < 120; i++) {
      ctx.fillStyle = `rgba(140,100,220,${0.15 + Math.random() * 0.3})`;
      ctx.beginPath();
      ctx.arc(Math.random()*w, Math.random()*h, 0.5 + Math.random() * 2, 0, Math.PI*2);
      ctx.fill();
    }
  });
}

// 📊 Market Intelligence — Warm cream with golden geometry
export function geometricTexture() {
  return createCanvasTexture((ctx, w, h) => {
    const bg = ctx.createLinearGradient(0,0,0,h);
    bg.addColorStop(0, '#faf6ee'); bg.addColorStop(0.5, '#f5efe0'); bg.addColorStop(1, '#efe7d2');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(190,170,110,0.25)'; ctx.lineWidth = 1.5;
    const cx = w*0.5, cy = h*0.5;
    for (let i = 0; i < 24; i++) {
      const a = i/24 * Math.PI*2;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a)*30, cy + Math.sin(a)*30);
      ctx.lineTo(cx + Math.cos(a)*400, cy + Math.sin(a)*400);
      ctx.stroke();
    }
    for (let i = 0; i < 40; i++) {
      ctx.fillStyle = `rgba(190,170,110,${0.08 + Math.random()*0.15})`;
      ctx.beginPath();
      ctx.arc(Math.random()*w, Math.random()*h, 1 + Math.random()*4, 0, Math.PI*2);
      ctx.fill();
    }
  });
}

// 📚 Enterprise Brain — Fresh mint green
export function organicTexture() {
  return createCanvasTexture((ctx, w, h) => {
    const bg = ctx.createLinearGradient(0,0,0,h);
    bg.addColorStop(0, '#e6f7f2'); bg.addColorStop(0.5, '#d4f0e7'); bg.addColorStop(1, '#c2e9dc');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
    // Organic wave lines
    for (let i = 0; i < 6; i++) {
      ctx.strokeStyle = `rgba(60,160,130,${0.10 + i*0.03})`;
      ctx.lineWidth = 1.5 + i*0.8;
      const sy = h*(0.15 + i*0.12);
      ctx.beginPath(); ctx.moveTo(0, sy);
      for (let x = 0; x <= w; x += 4) {
        ctx.lineTo(x, sy + Math.sin(x*0.006 + i*1.5)*50 + Math.sin(x*0.012 + i)*18);
      }
      ctx.stroke();
    }
    // Leaf-like dots
    for (let i = 0; i < 12; i++) {
      const x = w*(0.1 + Math.random()*0.8), y = h*(0.1 + Math.random()*0.8);
      ctx.fillStyle = `rgba(60,160,130,${0.08 + Math.random()*0.12})`;
      ctx.beginPath();
      ctx.ellipse(x, y, 8 + Math.random()*15, 3 + Math.random()*6, Math.random()*Math.PI, 0, Math.PI*2);
      ctx.fill();
    }
  });
}

// 📤 Upload Knowledge — Soft sky blue
export function warmTexture() {
  return createCanvasTexture((ctx, w, h) => {
    const bg = ctx.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, '#e8f4ff'); bg.addColorStop(0.5, '#dbeeff'); bg.addColorStop(1, '#c8e4ff');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
    const spots = [
      [w*0.3, h*0.35, 300, 'rgba(14,165,233,0.06)'],
      [w*0.7, h*0.65, 250, 'rgba(59,130,246,0.05)'],
      [w*0.5, h*0.2, 200, 'rgba(99,179,255,0.05)'],
    ];
    spots.forEach(([x,y,r,col]) => {
      const g = ctx.createRadialGradient(x,y,0,x,y,r);
      g.addColorStop(0, col); g.addColorStop(1, 'transparent');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill();
    });
    ctx.strokeStyle = 'rgba(14,165,233,0.10)'; ctx.lineWidth = 1;
    const cx = w*0.5, cy = h*0.5;
    for (let i = 0; i < 16; i++) {
      const a = i/16 * Math.PI*2;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a)*20, cy + Math.sin(a)*20);
      ctx.lineTo(cx + Math.cos(a)*400, cy + Math.sin(a)*400);
      ctx.stroke();
    }
  });
}

// 📜 Approvals & Review — Soft teal-cyan gradient
export function modernTexture() {
  return createCanvasTexture((ctx, w, h) => {
    const bg = ctx.createLinearGradient(0,0,w,h);
    bg.addColorStop(0, '#e0f7fa'); bg.addColorStop(0.5, '#d0f0f5'); bg.addColorStop(1, '#c0e8ef');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
    // Flowing wave lines
    for (let i = 0; i < 8; i++) {
      ctx.strokeStyle = `rgba(0,172,193,${0.06 + i*0.015})`;
      ctx.lineWidth = 1;
      const y = h*(0.1 + i*0.1);
      ctx.beginPath(); ctx.moveTo(0, y);
      for (let x = 0; x <= w; x += 3) {
        ctx.lineTo(x, y + Math.sin(x*0.004 + i)*30 + Math.sin(x*0.01 + i*1.4)*10);
      }
      ctx.stroke();
    }
    for (let i = 0; i < 20; i++) {
      ctx.fillStyle = `rgba(0,172,193,${0.06 + Math.random()*0.12})`;
      ctx.beginPath();
      ctx.arc(Math.random()*w, Math.random()*h, 0.5 + Math.random()*2.5, 0, Math.PI*2);
      ctx.fill();
    }
  });
}

// 📝 Work Journal — Soft sapphire blue
export function sapphireTexture() {
  return createCanvasTexture((ctx, w, h) => {
    const bg = ctx.createRadialGradient(w*0.4, h*0.4, 0, w*0.4, h*0.4, 500);
    bg.addColorStop(0, '#dce6f8'); bg.addColorStop(0.5, '#c8d8f0'); bg.addColorStop(1, '#b8cce8');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
    const spots = [
      [w*0.3, h*0.3, 200, 'rgba(80,130,220,0.08)'],
      [w*0.7, h*0.6, 150, 'rgba(100,160,230,0.06)'],
      [w*0.5, h*0.7, 120, 'rgba(130,180,255,0.05)'],
    ];
    spots.forEach(([x,y,r,col]) => {
      const g = ctx.createRadialGradient(x,y,0,x,y,r);
      g.addColorStop(0, col); g.addColorStop(1, 'transparent');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill();
    });
    // Radial lines
    ctx.strokeStyle = 'rgba(100,150,220,0.10)'; ctx.lineWidth = 1;
    for (let i = 0; i < 12; i++) {
      const a = i/12*Math.PI*2;
      ctx.beginPath();
      ctx.moveTo(w*0.5 + Math.cos(a)*15, h*0.5 + Math.sin(a)*15);
      ctx.lineTo(w*0.5 + Math.cos(a)*350, h*0.5 + Math.sin(a)*350);
      ctx.stroke();
    }
    for (let i = 0; i < 25; i++) {
      ctx.fillStyle = `rgba(100,150,220,${0.08 + Math.random()*0.15})`;
      ctx.beginPath();
      ctx.arc(Math.random()*w, Math.random()*h, 1 + Math.random()*2, 0, Math.PI*2);
      ctx.fill();
    }
  });
}

// ⚙️ Workflow Recorder — Warm silver-grey
export function steelTexture() {
  return createCanvasTexture((ctx, w, h) => {
    const bg = ctx.createLinearGradient(0,0,w,h);
    bg.addColorStop(0, '#eef0f4'); bg.addColorStop(0.5, '#e4e8ee'); bg.addColorStop(1, '#dce0e8');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
    // Horizontal pulse lines
    for (let i = 0; i < 10; i++) {
      ctx.strokeStyle = `rgba(100,120,160,${0.06 + i*0.012})`;
      ctx.lineWidth = 1.5;
      const y = h*(0.1 + i*0.08);
      ctx.beginPath(); ctx.moveTo(0, y);
      for (let x = 0; x <= w; x += 2) {
        ctx.lineTo(x, y + Math.sin(x*0.003 + i)*22);
      }
      ctx.stroke();
    }
    for (let i = 0; i < 15; i++) {
      ctx.fillStyle = `rgba(100,120,160,${0.05 + Math.random()*0.08})`;
      ctx.beginPath();
      ctx.arc(Math.random()*w, Math.random()*h, 2 + Math.random()*5, 0, Math.PI*2);
      ctx.fill();
    }
  });
}

// 🔍 Expert Finder — Crystal lavender
export function crystalTexture() {
  return createCanvasTexture((ctx, w, h) => {
    const bg = ctx.createLinearGradient(0,0,w,h);
    bg.addColorStop(0, '#f2f0fa'); bg.addColorStop(0.5, '#e8e4f4'); bg.addColorStop(1, '#ddd8ee');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
    const spots = [
      [w*0.4, h*0.3, 250, 'rgba(160,150,220,0.08)'],
      [w*0.7, h*0.7, 180, 'rgba(180,160,240,0.06)'],
      [w*0.2, h*0.6, 120, 'rgba(140,180,230,0.05)'],
    ];
    spots.forEach(([x,y,r,col]) => {
      const g = ctx.createRadialGradient(x,y,0,x,y,r);
      g.addColorStop(0, col); g.addColorStop(1, 'transparent');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill();
    });
    // Crystal line rays
    ctx.strokeStyle = 'rgba(140,140,200,0.12)'; ctx.lineWidth = 1;
    const cx = w*0.5, cy = h*0.5;
    for (let i = 0; i < 8; i++) {
      const a = i/8*Math.PI*2;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a)*20, cy + Math.sin(a)*20);
      ctx.lineTo(cx + Math.cos(a)*350, cy + Math.sin(a)*350);
      ctx.stroke();
    }
    for (let i = 0; i < 20; i++) {
      ctx.fillStyle = `rgba(160,150,220,${0.08 + Math.random()*0.12})`;
      ctx.beginPath();
      ctx.arc(Math.random()*w, Math.random()*h, 0.5 + Math.random()*2, 0, Math.PI*2);
      ctx.fill();
    }
  });
}

// ✅ Daily Checklists — Clean pale blue-steel
export function ironTexture() {
  return createCanvasTexture((ctx, w, h) => {
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, '#e8eff8'); bg.addColorStop(0.5, '#dfe8f4'); bg.addColorStop(1, '#d5e0f0');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
    const spots = [
      [w*0.3, h*0.4, 220, 'rgba(59,130,246,0.06)'],
      [w*0.7, h*0.6, 180, 'rgba(14,165,233,0.04)'],
      [w*0.5, h*0.3, 140, 'rgba(99,179,255,0.04)'],
    ];
    spots.forEach(([x,y,r,col]) => {
      const g = ctx.createRadialGradient(x,y,0,x,y,r);
      g.addColorStop(0, col); g.addColorStop(1, 'transparent');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill();
    });
    // Flowing lines
    ctx.strokeStyle = 'rgba(59,130,246,0.08)'; ctx.lineWidth = 1.5;
    for (let i = 0; i < 8; i++) {
      const y = h*(0.1 + i*0.1);
      ctx.beginPath(); ctx.moveTo(0, y);
      for (let x = 0; x <= w; x += 2) {
        ctx.lineTo(x, y + Math.sin(x*0.005 + i)*25 + Math.sin(x*0.01 + i*1.3)*10);
      }
      ctx.stroke();
    }
  });
}

// 🗂️ Knowledge Manager — Soft indigo
export function navyTexture() {
  return createCanvasTexture((ctx, w, h) => {
    const bg = ctx.createLinearGradient(0,0,0,h);
    bg.addColorStop(0, '#e6e4f4'); bg.addColorStop(0.5, '#dad6ee'); bg.addColorStop(1, '#cec8e8');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
    const spots = [
      [w*0.4, h*0.3, 250, 'rgba(90,80,200,0.07)'],
      [w*0.7, h*0.7, 200, 'rgba(100,90,210,0.05)'],
      [w*0.2, h*0.6, 150, 'rgba(80,120,200,0.04)'],
    ];
    spots.forEach(([x,y,r,col]) => {
      const g = ctx.createRadialGradient(x,y,0,x,y,r);
      g.addColorStop(0, col); g.addColorStop(1, 'transparent');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill();
    });
    // Subtle radial lines
    ctx.strokeStyle = 'rgba(90,80,200,0.08)'; ctx.lineWidth = 0.8;
    const cx = w*0.5, cy = h*0.5;
    for (let i = 0; i < 12; i++) {
      const a = i/12*Math.PI*2;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a)*10, cy + Math.sin(a)*10);
      ctx.lineTo(cx + Math.cos(a)*380, cy + Math.sin(a)*380);
      ctx.stroke();
    }
    for (let i = 0; i < 15; i++) {
      ctx.fillStyle = `rgba(90,80,200,${0.06 + Math.random()*0.10})`;
      ctx.beginPath();
      ctx.arc(Math.random()*w, Math.random()*h, 1 + Math.random()*3, 0, Math.PI*2);
      ctx.fill();
    }
  });
}
