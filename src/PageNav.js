import { useLocation } from 'react-router-dom';

const PAGE_ORDER = [
  { path: '/', label: 'Home' },
  { path: '/register-team', label: 'Register Team' },
  { path: '/progress', label: 'My Project' },
  { path: '/upload-media', label: 'Upload Media' },
  { path: '/profile', label: 'My Profile' },
];

function PageNav() {
  const location = useLocation();
  const currentIndex = PAGE_ORDER.findIndex(p => p.path === location.pathname);
  const current = PAGE_ORDER[currentIndex];
  const prev = PAGE_ORDER[currentIndex - 1];
  const next = PAGE_ORDER[currentIndex + 1];

  const go = (path) => { window.location.href = path; };

  return (
    <div style={wrap}>
      <button
        style={{ ...btn, opacity: prev ? 1 : 0.25, cursor: prev ? 'pointer' : 'not-allowed' }}
        onClick={() => prev && go(prev.path)}
        disabled={!prev}
      >←</button>
      <span style={label}>{current?.label?.toUpperCase()}</span>
      <button
        style={{ ...btn, opacity: next ? 1 : 0.25, cursor: next ? 'pointer' : 'not-allowed' }}
        onClick={() => next && go(next.path)}
        disabled={!next}
      >→</button>
    </div>
  );
}

const wrap = { position:'fixed', bottom:'1.5rem', left:'50%', transform:'translateX(-50%)', zIndex:5000, display:'flex', alignItems:'center', gap:'0.625rem', background:'rgba(26,21,8,0.88)', backdropFilter:'blur(14px)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'100px', padding:'0.5rem 0.75rem', boxShadow:'0 8px 32px rgba(26,21,8,0.35)' };
const btn = { background:'rgba(255,255,255,0.1)', border:'none', color:'rgba(245,240,232,0.85)', width:'36px', height:'36px', borderRadius:'50%', cursor:'pointer', fontSize:'1rem', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 };
const label = { fontSize:'0.72rem', fontWeight:'700', color:'rgba(245,240,232,0.55)', letterSpacing:'0.06em', textTransform:'uppercase', padding:'0 0.5rem', whiteSpace:'nowrap', minWidth:'90px', textAlign:'center' };

export default PageNav;