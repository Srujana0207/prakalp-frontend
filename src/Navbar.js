import { getUser, logoutStudent } from './auth';

function Navbar() {
  const user = getUser();
  const name = user?.name || user?.full_name || 'Student';
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  const logout = () => {
    logoutStudent();
    window.location.href = '/';
  };

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Clash+Display:wght@400;500;600;700&family=Cabinet+Grotesk:wght@300;400;500;700;800&display=swap" rel="stylesheet"/>
      <nav style={nav}>
        <div style={brand} onClick={() => window.location.href = '/'}>
          <div style={brandIcon}>⚗</div>
          <div style={brandName}>Prak<span style={{color:'#c84b1f'}}>alp</span></div>
        </div>

        <div style={links}>
          <button style={navBtn} onClick={() => window.location.href = '/'}>Home</button>
          <button style={navBtn} onClick={() => window.location.href = '/register-team'}>📋 Register Team</button>
          <button style={navBtn} onClick={() => window.location.href = '/progress'}>📊 My Project</button>
          <button style={navBtn} onClick={() => window.location.href = '/upload-media'}>📸 Upload Media</button>
          <button style={navBtn} onClick={() => window.location.href = '/profile'}>🏅 My Profile</button>
        </div>

        <div style={userArea}>
          <span style={userName}>Hi, <strong>{name.split(' ')[0]}</strong></span>
          <div style={avatar} onClick={() => window.location.href = '/profile'}>{initials}</div>
          <button style={signOutBtn} onClick={logout}>↩ Sign Out</button>
        </div>
      </nav>
    </>
  );
}

const nav = { position:'sticky', top:0, zIndex:200, background:'rgba(245,240,232,0.93)', backdropFilter:'blur(16px)', borderBottom:'1.5px solid #ddd5c0', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 2rem', height:'62px', gap:'1rem', fontFamily:"'Cabinet Grotesk',sans-serif" };
const brand = { display:'flex', alignItems:'center', gap:'0.6rem', cursor:'pointer', textDecoration:'none' };
const brandIcon = { width:'34px', height:'34px', background:'#c84b1f', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:'1rem' };
const brandName = { fontFamily:"'Clash Display',sans-serif", fontWeight:'700', fontSize:'1.2rem', color:'#1a1508', letterSpacing:'-0.02em' };
const links = { display:'flex', gap:'0.125rem', alignItems:'center', flexWrap:'wrap' };
const navBtn = { background:'none', border:'none', fontFamily:"'Cabinet Grotesk',sans-serif", fontSize:'0.875rem', fontWeight:'500', color:'#4a4030', padding:'0.5rem 0.875rem', borderRadius:'7px', cursor:'pointer' };
const userArea = { display:'flex', alignItems:'center', gap:'0.75rem' };
const userName = { fontSize:'0.85rem', fontWeight:'500', color:'#4a4030' };
const avatar = { width:'34px', height:'34px', borderRadius:'50%', background:'#c84b1f', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'700', fontSize:'0.78rem', cursor:'pointer', border:'2px solid #ddd5c0', flexShrink:0 };
const signOutBtn = { background:'transparent', color:'#1a1508', border:'2px solid #ddd5c0', padding:'0.4rem 0.875rem', borderRadius:'7px', fontFamily:"'Cabinet Grotesk',sans-serif", fontWeight:'700', fontSize:'0.8rem', cursor:'pointer' };

export default Navbar;