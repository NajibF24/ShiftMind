import React, { Suspense, useState, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, CameraControls } from '@react-three/drei';
import ArtGallery3D from '../components/3d/ArtGallery3D';
import { PAINTING_DATA, GALLERY_RADIUS } from '../components/3d/galleryData';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { ArrowLeft, ArrowRight, X, MessageSquare, BarChart3, Database, Upload, BookOpen, ClipboardCheck, FileSignature, Search, Settings, FileText, Smartphone } from 'lucide-react';

// ─── Mobile Card Grid Fallback ────────────────────────────────────────────────
function MobileGalleryFallback({ onNavigate }) {
  const cards = Object.entries(FRAME_META).slice(0, 9);
  return (
    <div style={{
      minHeight: '100vh', background: '#0d0a08',
      padding: '80px 20px 40px',
      overflowY: 'auto',
    }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          padding: '6px 14px', borderRadius: '20px',
          background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.2)',
          fontSize: '0.68rem', color: '#d4af37', letterSpacing: '2px', marginBottom: '16px',
        }}>
          <Smartphone size={11} /> MOBILE VIEW
        </div>
        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: '2rem',
          fontWeight: 700, letterSpacing: '-1px', color: '#fff', marginBottom: '8px',
        }}>
          <span style={{ color: '#d4af37' }}>Shift</span>Mind
        </h1>
        <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.4)' }}>
          Tap any module to open it
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
        gap: '12px', maxWidth: '500px', margin: '0 auto',
      }}>
        {cards.map(([key, meta], idx) => {
          const Icon = meta.icon;
          return (
            <motion.button
              key={key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              onClick={() => onNavigate(meta.path)}
              style={{
                padding: '20px 16px', borderRadius: '16px', cursor: 'pointer',
                background: 'rgba(255,255,255,0.04)',
                border: `1px solid ${meta.btnColor}25`,
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px',
                transition: 'all 0.3s',
                textAlign: 'center',
              }}
            >
              <div style={{
                width: '44px', height: '44px', borderRadius: '12px',
                background: meta.gradient,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: `0 4px 16px ${meta.btnColor}30`,
              }}>
                <Icon size={20} color="#fff" />
              </div>
              <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#fff', lineHeight: 1.3 }}>
                {meta.title}
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

const FRAME_META = {
  ask:              { path:'/ask',              icon: MessageSquare, title:'Ask ShiftMind AI',      desc:'Chat with enterprise AI about SOPs, policies, and procedures.',                     gradient:'linear-gradient(135deg,#8b5cf6,#7c3aed)',   btnColor:'#8b5cf6',   btnLabel:'START CHAT SESSION' },
  dashboard:        { path:'/dashboard',        icon: BarChart3,     title:'Market Intelligence',    desc:'Real-time steel market data, exchange rates, and operational KPIs.',                 gradient:'linear-gradient(135deg,#d4af37,#b8960c)',   btnColor:'#d4af37',   btnLabel:'VIEW DASHBOARD' },
  knowledge:        { path:'/knowledge-manager',icon: Database,      title:'Enterprise Brain',       desc:'Indexed documents, knowledge entries, and AI training data.',                         gradient:'linear-gradient(135deg,#2ecc71,#27ae60)',    btnColor:'#2ecc71',   btnLabel:'MANAGE KNOWLEDGE' },
  capture:          { path:'/capture',          icon: Upload,        title:'Upload Knowledge',       desc:'Contribute SOPs, PDFs, and documents to the AI knowledge base.',                     gradient:'linear-gradient(135deg,#e74c3c,#c0392b)',    btnColor:'#e74c3c',   btnLabel:'UPLOAD DOCUMENT' },
  journal:          { path:'/journal',          icon: BookOpen,      title:'Work Journal',           desc:'Record daily work activities. AI extracts lessons and builds tacit knowledge.',      gradient:'linear-gradient(135deg,#f59e0b,#d97706)',    btnColor:'#f59e0b',   btnLabel:'OPEN JOURNAL' },
  workflows:        { path:'/workflows',        icon: Settings,      title:'Workflow Recorder',      desc:'Record step-by-step procedures. AI converts them into formal SOP documents.',        gradient:'linear-gradient(135deg,#06b6d4,#0891b2)',    btnColor:'#06b6d4',   btnLabel:'RECORD WORKFLOW' },
  experts:          { path:'/experts',          icon: Search,        title:'Expert Finder',          desc:'Find domain experts based on contributions, journals, and knowledge entries.',        gradient:'linear-gradient(135deg,#a855f7,#9333ea)',    btnColor:'#a855f7',   btnLabel:'FIND EXPERTS' },
  checklists:       { path:'/checklists',       icon: ClipboardCheck,title:'Daily Checklists',       desc:'Operational safety and maintenance checklists with AI anomaly detection.',            gradient:'linear-gradient(135deg,#10b981,#059669)',    btnColor:'#10b981',   btnLabel:'OPEN CHECKLISTS' },
  approvals:        { path:'/approvals',        icon: FileSignature, title:'Approvals & Review',    desc:'Submit approval requests and review contracts with AI-powered legal analysis.',        gradient:'linear-gradient(135deg,#f43f5e,#e11d48)',    btnColor:'#f43f5e',   btnLabel:'OPEN APPROVALS' },
  'knowledge-manager': { path:'/knowledge-manager', icon: FileText,   title:'Knowledge Manager',      desc:'Admin panel for managing knowledge entries, sources, and AI training data.',           gradient:'linear-gradient(135deg,#6366f1,#4f46e5)',    btnColor:'#6366f1',   btnLabel:'MANAGE KB' },
};

function PopupOverlay({ activePopup, onClose, onNavigate, stats, marketData }) {
  const meta = FRAME_META[activePopup];
  const Icon = meta?.icon;

  return (
    <AnimatePresence>
      {activePopup && meta && (
        <motion.div
          initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} transition={{ duration:0.3 }}
          style={{
            position:'absolute',top:0,left:0,width:'100%',height:'100%',
            background:'rgba(10,8,6,0.80)',zIndex:100,
            display:'flex',justifyContent:'center',alignItems:'center',
            backdropFilter:'blur(28px) saturate(180%)',
          }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale:0.85, y:30, opacity:0 }}
            animate={{ scale:1, y:0, opacity:1 }}
            exit={{ scale:0.9, y:20, opacity:0 }}
            transition={{ type:'spring', damping:22, stiffness:280 }}
            style={{
              background:'rgba(15, 10, 8, 0.75)', width:'680px', borderRadius:'28px',
              border:'1px solid rgba(255,255,255,0.08)', padding:'48px',
              boxShadow:'0 40px 100px rgba(0,0,0,0.8), inset 0 0 0 1px rgba(255,255,255,0.05)',
              position:'relative', textAlign:'center', backdropFilter:'blur(40px)',
            }}
            onClick={(e)=>e.stopPropagation()}
          >
              <button onClick={() => onClose()} style={{
              position:'absolute', top:'20px', right:'20px',
              width:'32px', height:'32px', borderRadius:'50%',
              background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.2)',
              color:'#fff', cursor:'pointer', 
              display:'flex', alignItems:'center', justifyContent:'center',
            }}>
              <X size={14} />
            </button>

            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'14px' }}>
              <div style={{
                width:'56px', height:'56px', borderRadius:'14px',
                background:meta.gradient, display:'flex', alignItems:'center', justifyContent:'center',
                boxShadow:`0 0 24px ${meta.btnColor}30`,
              }}>
                <Icon size={24} color="#fff" />
              </div>
              <h2 style={{ fontSize:'1.6rem', fontWeight:'700', fontFamily:'var(--font-display)', color:'#fff', letterSpacing:'-0.3px' }}>
                {meta.title}
              </h2>
               <p style={{ fontSize:'1rem', color:'rgba(255, 255, 255, 0.9)', maxWidth:'450px', lineHeight:1.5, textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
               {meta.desc}
               </p>

              {(activePopup === 'dashboard') && marketData && (
                <div style={{ display:'flex', gap:'12px', width:'100%', marginTop:'4px' }}>
                  <div style={{ flex:1, padding:'16px', background:'rgba(0,0,0,0.3)', borderRadius:'12px', border:'1px solid rgba(14,165,233,0.06)' }}>
                    <div style={{ fontSize:'0.65rem', color:'var(--text-muted)', marginBottom:'4px', letterSpacing:'1px', textTransform:'uppercase' }}>USD/IDR</div>
                    <div style={{ fontSize:'1.4rem', fontWeight:'700', color:'var(--neon-green)', fontFamily:'var(--font-display)' }}>
                      Rp {marketData.usd_idr?.toLocaleString('id-ID') || '...'}
                    </div>
                  </div>
                  <div style={{ flex:1, padding:'16px', background:'rgba(0,0,0,0.3)', borderRadius:'12px', border:'1px solid rgba(14,165,233,0.06)' }}>
                    <div style={{ fontSize:'0.65rem', color:'var(--text-muted)', marginBottom:'4px', letterSpacing:'1px', textTransform:'uppercase' }}>HRC Steel</div>
                    <div style={{ fontSize:'1.4rem', fontWeight:'700', color:'var(--neon-cyan)', fontFamily:'var(--font-display)' }}>
                      $ {marketData.steel_hrc?.toLocaleString() || '...'}
                    </div>
                  </div>
                </div>
              )}

              {(activePopup === 'knowledge' || activePopup === 'knowledge-manager') && (
                <div style={{ display:'flex', gap:'12px', width:'100%', marginTop:'4px' }}>
                  <div style={{ flex:1, padding:'16px', background:'rgba(0,0,0,0.3)', borderRadius:'12px', border:'1px solid rgba(139,92,246,0.06)' }}>
                    <div style={{ fontSize:'2rem', fontWeight:'700', color:'#c084fc', fontFamily:'var(--font-display)' }}>{stats.total_entries}</div>
                    <div style={{ fontSize:'0.65rem', color:'var(--text-muted)', letterSpacing:'1px', textTransform:'uppercase' }}>Documents</div>
                  </div>
                  <div style={{ flex:1, padding:'16px', background:'rgba(0,0,0,0.3)', borderRadius:'12px', border:'1px solid rgba(139,92,246,0.06)' }}>
                    <div style={{ fontSize:'2rem', fontWeight:'700', color:'#c084fc', fontFamily:'var(--font-display)' }}>{stats.ai_queries}</div>
                    <div style={{ fontSize:'0.65rem', color:'var(--text-muted)', letterSpacing:'1px', textTransform:'uppercase' }}>AI Queries</div>
                  </div>
                </div>
              )}

              <button onClick={() => onNavigate(meta.path || '/dashboard')} style={{
                background:meta.btnColor, color:'#fff', border:'none', padding:'12px 32px',
                fontSize:'0.9rem', borderRadius:'10px', cursor:'pointer', fontWeight:'600',
                marginTop:'4px', boxShadow:`0 6px 16px ${meta.btnColor}35`,
                transition:'all 0.3s',
              }}
              onMouseOver={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow=`0 10px 22px ${meta.btnColor}45`}}
              onMouseOut={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow=`0 6px 16px ${meta.btnColor}35`}}
              >
                {meta.btnLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function SceneController({ currentIndex, activePopupId, controlsRef }) {
  useEffect(() => {
    if (!controlsRef.current) return;
    const targetId = activePopupId || PAINTING_DATA[currentIndex]?.id;
    const idx = PAINTING_DATA.findIndex(p => p.id === targetId);
    if (idx !== -1) {
      const angle = (idx / PAINTING_DATA.length) * Math.PI * 2;
      
      // Look from the center towards the painting
      controlsRef.current.setLookAt(
        0, 2.5, 0,
        Math.sin(angle) * GALLERY_RADIUS, 2.5, Math.cos(angle) * GALLERY_RADIUS,
        true
      );
    }
  }, [currentIndex, activePopupId, controlsRef]);
  return null;
}

export default function Interactive3DHome() {
  const navigate = useNavigate();
  const [activePopupId, setActivePopupId] = useState(null);
  const [showOverlay, setShowOverlay] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [stats, setStats] = useState({ total_entries:0, ai_queries:0 });
  const [marketData, setMarketData] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const controlsRef = useRef(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    axios.get('/api/dashboard/stats', { headers:{ Authorization:`Bearer ${localStorage.getItem('token')}` } })
      .then(r=>setStats(r.data)).catch(()=>{});
    axios.get('/static/latest_news.json')
      .then(r=>setMarketData(r.data?.market || r.data)).catch(()=>{});
  }, []);

  const [currentIndex, setCurrentIndex] = useState(0);

  const handlePaintingClick = (id) => {
    const idx = PAINTING_DATA.findIndex(p => p.id === id);
    if (idx !== -1) setCurrentIndex(idx);
    setActivePopupId(id);
    setTimeout(() => setShowOverlay(true), 600);
  };

  const handleClosePopup = () => {
    setShowOverlay(false);
    setTimeout(() => setActivePopupId(null), 200);
  };

  const handleNavigate = (path) => {
    setShowOverlay(false);
    setActivePopupId(null);
    setIsTransitioning(true);
    setTimeout(() => navigate(path), 500);
  };

  const handleNextPainting = () => setCurrentIndex((prev) => (prev + 1) % PAINTING_DATA.length);
  const handlePrevPainting = () => setCurrentIndex((prev) => (prev - 1 + PAINTING_DATA.length) % PAINTING_DATA.length);

  // Debounce for mouse wheel scrolling
  const wheelTimeout = useRef(null);
  const handleWheel = (e) => {
    if (activePopupId || isTransitioning) return;
    
    // Ignore small movements (like trackpad resting)
    if (Math.abs(e.deltaY) < 15) return;
    
    if (!wheelTimeout.current) {
      if (e.deltaY < 0) {
        handlePrevPainting();
      } else if (e.deltaY > 0) {
        handleNextPainting();
      }
      
      // Prevent another scroll event for 800ms to allow animation to complete
      wheelTimeout.current = setTimeout(() => {
        wheelTimeout.current = null;
      }, 800);
    }
  };

  // Render mobile fallback instead of Three.js
  if (isMobile) {
    return <MobileGalleryFallback onNavigate={(path) => navigate(path)} />;
  }

  return (
    <div style={{ width:'100%', height:'100vh', background:'#0d0a08', position:'relative', overflow:'hidden' }}>
      <AnimatePresence>
        {isTransitioning && (
          <motion.div
            initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            transition={{ duration:0.4, ease:'easeInOut' }}
            style={{ position:'absolute', inset:0, background:'#000', zIndex:9999, pointerEvents:'all' }}
          />
        )}
      </AnimatePresence>

      <PopupOverlay
        activePopup={showOverlay ? activePopupId : null}
        onClose={handleClosePopup}
        onNavigate={handleNavigate}
        stats={stats}
        marketData={marketData}
      />

      <AnimatePresence>
        {!showOverlay && !activePopupId && (
          <>
            <motion.button
              initial={{ opacity:0, x:-20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-20 }}
              onClick={handlePrevPainting}
              style={{
                position:'absolute', left:'24px', top:'50%', transform:'translateY(-50%)', zIndex:10,
                width:'48px', height:'48px', borderRadius:'50%',
                background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)',
                cursor:'pointer', display:'flex', justifyContent:'center', alignItems:'center',
                color:'rgba(255,255,255,0.7)', transition:'all 0.3s', backdropFilter:'blur(10px)',
              }}
              onMouseOver={e=>{e.currentTarget.style.background='rgba(255,255,255,0.12)';e.currentTarget.style.color='#fff'}}
              onMouseOut={e=>{e.currentTarget.style.background='rgba(255,255,255,0.06)';e.currentTarget.style.color='rgba(255,255,255,0.7)'}}
            >
              <ArrowLeft size={20} />
            </motion.button>
            <motion.button
              initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:20 }}
              onClick={handleNextPainting}
              style={{
                position:'absolute', right:'24px', top:'50%', transform:'translateY(-50%)', zIndex:10,
                width:'48px', height:'48px', borderRadius:'50%',
                background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)',
                cursor:'pointer', display:'flex', justifyContent:'center', alignItems:'center',
                color:'rgba(255,255,255,0.7)', transition:'all 0.3s', backdropFilter:'blur(10px)',
              }}
              onMouseOver={e=>{e.currentTarget.style.background='rgba(255,255,255,0.12)';e.currentTarget.style.color='#fff'}}
              onMouseOut={e=>{e.currentTarget.style.background='rgba(255,255,255,0.06)';e.currentTarget.style.color='rgba(255,255,255,0.7)'}}
            >
              <ArrowRight size={20} />
            </motion.button>
          </>
        )}
      </AnimatePresence>

      {/* Top bar */}
      <div style={{ position:'absolute', top:'24px', left:'32px', zIndex:10, display:'flex', gap:'12px', alignItems:'center' }}>
        <div style={{
          padding:'10px 20px', borderRadius:'12px',
          background:'rgba(20, 15, 12, 0.4)', border:'1px solid rgba(255,255,255,0.08)',
          backdropFilter:'blur(12px)',
        }}>
          <span style={{ fontSize:'0.9rem', fontWeight:'600', fontFamily:'var(--font-display)', color:'#fff' }}>
            <span style={{ color:'#d4af37' }}>Shift</span>Mind Museum
          </span>
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:10 }}
            style={{
              padding:'8px 16px', borderRadius:'10px',
              background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)',
              fontSize:'0.75rem', color:'var(--text-secondary)', backdropFilter:'blur(10px)',
              display:'flex', alignItems:'center', gap:'6px'
            }}
          >
            <span style={{ color: '#fff', fontWeight: 500 }}>{PAINTING_DATA[currentIndex]?.featureTitle}</span>
          </motion.div>
        </AnimatePresence>
        <button onClick={() => handleNavigate('/dashboard')} style={{
          padding:'10px 16px', borderRadius:'12px', cursor:'pointer',
          background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)',
          color:'rgba(255,255,255,0.6)', fontSize:'0.75rem', fontFamily:'var(--font-body)', fontWeight: 500,
          transition:'all 0.3s', display:'flex', alignItems:'center', gap:'6px', backdropFilter:'blur(10px)',
        }}
        onMouseOver={e=>{e.currentTarget.style.background='rgba(225,29,72,0.15)';e.currentTarget.style.borderColor='rgba(225,29,72,0.3)';e.currentTarget.style.color='var(--danger)'}}
        onMouseOut={e=>{e.currentTarget.style.background='rgba(255,255,255,0.02)';e.currentTarget.style.borderColor='rgba(255,255,255,0.06)';e.currentTarget.style.color='rgba(255,255,255,0.6)'}}
        >
          <X size={14} /> Exit Gallery
        </button>
      </div>

      {/* Wall indicator dots */}
      <div style={{ position:'absolute', bottom:'40px', left:'50%', transform:'translateX(-50%)', zIndex:10, display:'flex', flexDirection:'column', alignItems:'center', gap:'12px' }}>
        <AnimatePresence>
          {!activePopupId && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
              style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '2px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <div style={{ width: '16px', height: '24px', border: '1px solid rgba(255,255,255,0.4)', borderRadius: '10px', position: 'relative' }}>
                <motion.div 
                  animate={{ y: [0, 6, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}
                  style={{ width: '2px', height: '4px', background: 'rgba(255,255,255,0.8)', borderRadius: '2px', position: 'absolute', top: '4px', left: '6px' }}
                />
              </div>
              Scroll or Swipe to navigate
            </motion.div>
          )}
        </AnimatePresence>
        <div style={{ display:'flex', gap:'10px' }}>
          {PAINTING_DATA.map((p,i)=>(
            <button key={p.id} onClick={() => setCurrentIndex(i)} style={{
              width: i === currentIndex ? '24px' : '8px', height:'8px', borderRadius:'4px', border:'none', cursor:'pointer',
              background: i === currentIndex ? 'rgba(212, 175, 55, 0.8)' : 'rgba(255,255,255,0.15)',
              transition:'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            }} />
          ))}
        </div>
      </div>

      <motion.div
        animate={{ scale:activePopupId ? 0.95 : 1, borderRadius:activePopupId ? '24px' : '0px', opacity:activePopupId ? 0.6 : 1 }}
        transition={{ type:'spring', damping:25, stiffness:200 }}
        style={{ width:'100%', height:'100%', overflow:'hidden' }}
        onWheel={handleWheel}
      >
        <Canvas camera={{ position:[0, 3, 0], fov:60 }}>
          {/* Brighter lighting for the gallery */}
          <color attach="background" args={['#0d0a08']} />
          <ambientLight intensity={0.9} color="#f5efe8" />
          <spotLight position={[0, 18, 0]} intensity={2.5} angle={0.8} penumbra={0.8} color="#f5ede0" castShadow />
          <spotLight position={[-12, 10, -10]} intensity={1.5} angle={0.8} penumbra={0.9} color="#f0e6d0" />
          <spotLight position={[12, 10, 10]} intensity={1.5} angle={0.8} penumbra={0.9} color="#f0e6d0" />
          <pointLight position={[-6, 6, -12]} intensity={0.8} color="#e8d8c0" />
          <pointLight position={[6, 6, 12]} intensity={0.8} color="#e8d8c0" />
          <pointLight position={[12, 6, -6]} intensity={0.8} color="#e8d8c0" />
          <pointLight position={[-12, 6, 6]} intensity={0.8} color="#e8d8c0" />
          <pointLight position={[0, 10, 0]} intensity={1.0} color="#f0e0c0" />

          <Suspense fallback={null}>
            <ArtGallery3D onSelect={handlePaintingClick} />
            <SceneController currentIndex={currentIndex} activePopupId={activePopupId} controlsRef={controlsRef} />
            <CameraControls
              ref={controlsRef}
              minPolarAngle={Math.PI / 4}
              maxPolarAngle={Math.PI / 1.8}
              minDistance={0.1}
              maxDistance={0.1}
              touches={{ one: activePopupId ? 0 : 128, two: 0, three: 0 }}
              mouseButtons={{ left: activePopupId ? 0 : 1, middle: 0, right: 0, wheel: 0 }}
            />
            <Environment preset="sunset" />
          </Suspense>
        </Canvas>
      </motion.div>
    </div>
  );
}
