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

export function cosmicTexture() {
  return createCanvasTexture((ctx, w, h) => {
    const bg = ctx.createRadialGradient(w/2, h/2, 0, w/2, h/2, 500);
    bg.addColorStop(0, '#2d1b69'); bg.addColorStop(0.4, '#1a1040'); bg.addColorStop(1, '#0a0618');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
    const layers = [[w*0.3,h*0.4,200,'rgba(120,100,220,0.15)'],[w*0.7,h*0.6,160,'rgba(180,150,255,0.10)'],[w*0.5,h*0.2,120,'rgba(220,180,255,0.08)']];
    layers.forEach(([x,y,r,col]) => { const g=ctx.createRadialGradient(x,y,0,x,y,r); g.addColorStop(0,col); g.addColorStop(1,'transparent'); ctx.fillStyle=g; ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill(); });
    for (let i=0;i<200;i++){ctx.fillStyle=`rgba(200,190,255,${0.3+Math.random()*0.7})`;ctx.beginPath();ctx.arc(Math.random()*w,Math.random()*h,0.5+Math.random()*2,0,Math.PI*2);ctx.fill()}
  });
}

export function geometricTexture() {
  return createCanvasTexture((ctx, w, h) => {
    const bg = ctx.createLinearGradient(0,0,0,h);
    bg.addColorStop(0, '#f7f3ec'); bg.addColorStop(0.5, '#efe9dc'); bg.addColorStop(1, '#e3dac8');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle='rgba(180,160,100,0.35)'; ctx.lineWidth=1.5;
    const cx=w*0.5,cy=h*0.5;
    for(let i=0;i<24;i++){const a=i/24*Math.PI*2;ctx.beginPath();ctx.moveTo(cx+Math.cos(a)*30,cy+Math.sin(a)*30);ctx.lineTo(cx+Math.cos(a)*400,cy+Math.sin(a)*400);ctx.stroke()}
    ctx.fillStyle='rgba(200,180,120,0.06)';ctx.fillRect(w*0.15,h*0.15,200,60);ctx.strokeRect(w*0.15,h*0.15,200,60);
    ctx.fillStyle='rgba(60,70,100,0.08)';ctx.fillRect(w*0.7,h*0.65,160,200);
    for(let i=0;i<50;i++){ctx.fillStyle=`rgba(180,160,100,${0.1+Math.random()*0.25})`;ctx.beginPath();ctx.arc(Math.random()*w,Math.random()*h,1+Math.random()*4,0,Math.PI*2);ctx.fill()}
  });
}

export function organicTexture() {
  return createCanvasTexture((ctx, w, h) => {
    const bg = ctx.createLinearGradient(0,0,0,h);
    bg.addColorStop(0, '#163a34'); bg.addColorStop(0.5, '#1a4538'); bg.addColorStop(1, '#0e2820');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
    [[w*0.25,h*0.3,200,'rgba(60,140,120,0.12)'],[w*0.8,h*0.7,150,'rgba(180,200,90,0.07)'],[w*0.5,h*0.5,160,'rgba(80,180,150,0.06)']].forEach(([x,y,r,col])=>{
      const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,col);g.addColorStop(1,'transparent');
      ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
    });
    for(let i=0;i<6;i++){ctx.strokeStyle=[['rgba(60,140,120,0.25)'],['rgba(180,200,90,0.15)'],['rgba(80,180,150,0.12)']][i%3];ctx.lineWidth=1.5+i*1.2;const sy=h*(0.15+i*0.12);ctx.beginPath();ctx.moveTo(0,sy);for(let x=0;x<=w;x+=4){ctx.lineTo(x,sy+Math.sin(x*0.006+i*1.5)*60+Math.sin(x*0.012+i)*20)}ctx.stroke()}
    for(let i=0;i<10;i++){const x=w*(0.1+Math.random()*0.8),y=h*(0.1+Math.random()*0.8);ctx.fillStyle=`rgba(180,200,90,${0.15+Math.random()*0.2})`;ctx.beginPath();ctx.ellipse(x,y,8+Math.random()*20,3+Math.random()*8,Math.random()*Math.PI,0,Math.PI*2);ctx.fill()}
  });
}

export function warmTexture() {
  return createCanvasTexture((ctx, w, h) => {
    const bg = ctx.createRadialGradient(w*0.5,h*0.45,0,w*0.5,h*0.45,500);
    bg.addColorStop(0,'#b05830'); bg.addColorStop(0.3,'#8a3d1e'); bg.addColorStop(0.6,'#5a2812'); bg.addColorStop(1,'#1a0e08');
    ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
    [[w*0.3,h*0.35,300,'rgba(230,190,80,0.07)'],[w*0.7,h*0.65,250,'rgba(210,150,80,0.08)'],[w*0.5,h*0.2,200,'rgba(230,180,110,0.05)']].forEach(([x,y,r,col])=>{
      const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,col);g.addColorStop(1,'transparent');
      ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
    });
    ctx.strokeStyle='rgba(230,200,120,0.15)';ctx.lineWidth=1;const cx=w*0.5,cy=h*0.5;
    for(let i=0;i<20;i++){const a=i/20*Math.PI*2;ctx.beginPath();ctx.moveTo(cx+Math.cos(a)*20,cy+Math.sin(a)*20);ctx.lineTo(cx+Math.cos(a)*400,cy+Math.sin(a)*400);ctx.stroke()}
    for(let i=0;i<40;i++){const x=w*(0.05+Math.random()*0.9),y=h*(0.05+Math.random()*0.9);ctx.fillStyle=`rgba(230,210,170,${0.05+Math.random()*0.10})`;ctx.beginPath();ctx.arc(x,y,0.5+Math.random()*2,0,Math.PI*2);ctx.fill()}
  });
}

export function modernTexture() {
  return createCanvasTexture((ctx, w, h) => {
    const bg = ctx.createLinearGradient(0,0,w,h);
    bg.addColorStop(0,'#0f2027'); bg.addColorStop(0.5,'#1a3340'); bg.addColorStop(1,'#234556');
    ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
    for(let i=0;i<8;i++){ctx.strokeStyle=`rgba(80,200,255,${0.04+i*0.02})`;ctx.lineWidth=1;const y=h*(0.1+i*0.1);ctx.beginPath();ctx.moveTo(0,y);for(let x=0;x<=w;x+=3){ctx.lineTo(x,y+Math.sin(x*0.004+i)*35+Math.sin(x*0.01+i*1.4)*12)}ctx.stroke()}
    for(let i=0;i<25;i++){ctx.fillStyle=`rgba(80,200,255,${0.1+Math.random()*0.3})`;ctx.beginPath();ctx.arc(Math.random()*w,Math.random()*h,0.5+Math.random()*2.5,0,Math.PI*2);ctx.fill()}
  });
}

export function sapphireTexture() {
  return createCanvasTexture((ctx, w, h) => {
    const bg = ctx.createRadialGradient(w*0.4,h*0.4,0,w*0.4,h*0.4,500);
    bg.addColorStop(0,'#1a2a5e'); bg.addColorStop(0.5,'#121a40'); bg.addColorStop(1,'#080e20');
    ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
    [[w*0.3,h*0.3,200,'rgba(80,130,220,0.12)'],[w*0.7,h*0.6,150,'rgba(100,180,230,0.08)'],[w*0.5,h*0.7,120,'rgba(150,200,255,0.06)']].forEach(([x,y,r,col])=>{
      const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,col);g.addColorStop(1,'transparent');
      ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
    });
    ctx.strokeStyle='rgba(150,200,255,0.12)';ctx.lineWidth=1;
    for(let i=0;i<12;i++){const a=i/12*Math.PI*2;ctx.beginPath();ctx.moveTo(w*0.5+Math.cos(a)*15,h*0.5+Math.sin(a)*15);ctx.lineTo(w*0.5+Math.cos(a)*350,h*0.5+Math.sin(a)*350);ctx.stroke()}
    for(let i=0;i<30;i++){ctx.fillStyle=`rgba(150,200,255,${0.15+Math.random()*0.4})`;ctx.beginPath();ctx.arc(Math.random()*w,Math.random()*h,1+Math.random()*2,0,Math.PI*2);ctx.fill()}
  });
}

export function steelTexture() {
  return createCanvasTexture((ctx, w, h) => {
    const bg = ctx.createLinearGradient(0,0,w,h);
    bg.addColorStop(0,'#1a1e22'); bg.addColorStop(0.5,'#252b30'); bg.addColorStop(1,'#2a3038');
    ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
    for(let i=0;i<10;i++){ctx.strokeStyle=`rgba(200,120,40,${0.06+i*0.015})`;ctx.lineWidth=1.5;const y=h*(0.1+i*0.08);ctx.beginPath();ctx.moveTo(0,y);for(let x=0;x<=w;x+=2){ctx.lineTo(x,y+Math.sin(x*0.003+i)*25)}ctx.stroke()}
    for(let i=0;i<15;i++){ctx.fillStyle=`rgba(200,120,40,${0.06+Math.random()*0.08})`;ctx.beginPath();ctx.arc(Math.random()*w,Math.random()*h,2+Math.random()*5,0,Math.PI*2);ctx.fill()}
  });
}

export function crystalTexture() {
  return createCanvasTexture((ctx, w, h) => {
    const bg = ctx.createLinearGradient(0,0,w,h);
    bg.addColorStop(0,'#f0f2f8'); bg.addColorStop(0.5,'#e4e8f0'); bg.addColorStop(1,'#d8dce8');
    ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
    [[w*0.4,h*0.3,250,'rgba(160,180,240,0.12)'],[w*0.7,h*0.7,180,'rgba(200,180,255,0.08)'],[w*0.2,h*0.6,120,'rgba(140,200,240,0.06)']].forEach(([x,y,r,col])=>{
      const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,col);g.addColorStop(1,'transparent');
      ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
    });
    ctx.strokeStyle='rgba(140,160,200,0.2)';ctx.lineWidth=1;
    const cx=w*0.5,cy=h*0.5;for(let i=0;i<8;i++){const a=i/8*Math.PI*2;ctx.beginPath();ctx.moveTo(cx+Math.cos(a)*20,cy+Math.sin(a)*20);ctx.lineTo(cx+Math.cos(a)*350,cy+Math.sin(a)*350);ctx.stroke()}
    for(let i=0;i<20;i++){ctx.fillStyle=`rgba(160,180,220,${0.15+Math.random()*0.2})`;ctx.beginPath();ctx.arc(Math.random()*w,Math.random()*h,0.5+Math.random()*2,0,Math.PI*2);ctx.fill()}
  });
}

export function ironTexture() {
  return createCanvasTexture((ctx, w, h) => {
    const bg = ctx.createLinearGradient(0,0,0,h);
    bg.addColorStop(0,'#3a1810'); bg.addColorStop(0.5,'#2a1210'); bg.addColorStop(1,'#1a0a08');
    ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
    [[w*0.3,h*0.4,220,'rgba(200,80,40,0.10)'],[w*0.7,h*0.6,180,'rgba(180,120,60,0.07)'],[w*0.5,h*0.3,140,'rgba(220,160,80,0.05)']].forEach(([x,y,r,col])=>{
      const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,col);g.addColorStop(1,'transparent');
      ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
    });
    ctx.strokeStyle='rgba(200,100,50,0.15)';ctx.lineWidth=1.5;
    for(let i=0;i<10;i++){const y=h*(0.1+i*0.08);ctx.beginPath();ctx.moveTo(0,y);for(let x=0;x<=w;x+=2){ctx.lineTo(x,y+Math.sin(x*0.005+i)*30+Math.sin(x*0.01+i*1.3)*12)}ctx.stroke()}
    for(let i=0;i<12;i++){ctx.fillStyle=`rgba(200,160,80,${0.08+Math.random()*0.1})`;ctx.beginPath();ctx.arc(Math.random()*w,Math.random()*h,2+Math.random()*6,0,Math.PI*2);ctx.fill()}
  });
}

export function navyTexture() {
  return createCanvasTexture((ctx, w, h) => {
    const bg = ctx.createLinearGradient(0,0,0,h);
    bg.addColorStop(0,'#0a1428'); bg.addColorStop(0.5,'#0e1a30'); bg.addColorStop(1,'#060e1e');
    ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
    [[w*0.4,h*0.3,250,'rgba(60,120,200,0.10)'],[w*0.7,h*0.7,200,'rgba(100,100,200,0.06)'],[w*0.2,h*0.6,150,'rgba(80,160,220,0.05)']].forEach(([x,y,r,col])=>{
      const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,col);g.addColorStop(1,'transparent');
      ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
    });
    ctx.strokeStyle='rgba(100,160,220,0.08)';ctx.lineWidth=0.8;
    const cx=w*0.5,cy=h*0.5;for(let i=0;i<12;i++){const a=i/12*Math.PI*2;ctx.beginPath();ctx.moveTo(cx+Math.cos(a)*10,cy+Math.sin(a)*10);ctx.lineTo(cx+Math.cos(a)*380,cy+Math.sin(a)*380);ctx.stroke()}
    for(let i=0;i<15;i++){ctx.fillStyle=`rgba(100,160,220,${0.08+Math.random()*0.12})`;ctx.beginPath();ctx.arc(Math.random()*w,Math.random()*h,1+Math.random()*3,0,Math.PI*2);ctx.fill()}
  });
}
