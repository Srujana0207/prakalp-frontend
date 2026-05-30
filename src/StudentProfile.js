import { useState, useEffect } from 'react';
import supabase from './supabaseClient';
import { getUser } from './auth';

const API = 'https://prakalp-backend-e246.onrender.com/api';

const BADGE_CONFIG = {
  Bronze:   { emoji: '🥉', color: '#cd7f32', bg: 'rgba(205,127,50,0.08)',  border: 'rgba(205,127,50,0.3)',  points: 50  },
  Silver:   { emoji: '🥈', color: '#888',    bg: 'rgba(136,136,136,0.08)', border: 'rgba(136,136,136,0.3)', points: 150 },
  Gold:     { emoji: '🥇', color: '#b8860b', bg: 'rgba(184,134,11,0.08)',  border: 'rgba(184,134,11,0.3)',  points: 300 },
  Platinum: { emoji: '💎', color: '#1d4e89', bg: 'rgba(29,78,137,0.08)',   border: 'rgba(29,78,137,0.3)',   points: 500 },
};

const STATUS_CONFIG = {
  pending:  { label: 'Pending',  color: '#b8860b', bg: 'rgba(184,134,11,0.1)'  },
  approved: { label: 'Approved', color: '#2d6a4f', bg: 'rgba(45,106,79,0.1)'   },
  rejected: { label: 'Rejected', color: '#c84b1f', bg: 'rgba(200,75,31,0.1)'   },
};

function StudentProfile() {
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState(null);
  const [points, setPoints] = useState(0);
  const [badges, setBadges] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [error, setError] = useState('');
  const loggedInUser = getUser();

  useEffect(() => {
    if (!loggedInUser) { window.location.href = '/'; return; }
    const load = async () => {
      setLoading(true);
      const roll = loggedInUser?.roll_number || loggedInUser?.rollNumber;
      const { data: studentData } = await supabase.from('college_students').select('id, full_name, roll_number, year_of_study, department').eq('roll_number', roll).single();
      if (!studentData) { setError('Student not found.'); setLoading(false); return; }
      setStudent(studentData);

      const { data: pointsData } = await supabase.from('student_points').select('total_points').eq('student_id', studentData.id).single();
      const supabasePoints = pointsData?.total_points || 0;

      let mongoPoints = 0;
      try {
        const token = localStorage.getItem('prakalp_token');
        if (token) {
          const res = await fetch(`${API}/auth/profile`, { headers: { 'Authorization': `Bearer ${token}` } });
          const mongoData = await res.json();
          mongoPoints = mongoData?.student?.rankScore || 0;
        }
      } catch (e) { console.log('MongoDB points not available:', e.message); }

      setPoints(supabasePoints + mongoPoints);

      const { data: badgesData } = await supabase.from('student_badges').select('*').eq('student_id', studentData.id).order('awarded_at', { ascending: false });
      setBadges(badgesData || []);

      const { data: achievementsData } = await supabase.from('achievements').select('*').eq('student_id', studentData.id).order('submitted_at', { ascending: false });
      setAchievements(achievementsData || []);
      setLoading(false);
    };
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getNextBadge = (pts) => {
    if (pts < 50)  return { name: 'Bronze',   needed: 50 - pts,   emoji: '🥉' };
    if (pts < 150) return { name: 'Silver',   needed: 150 - pts,  emoji: '🥈' };
    if (pts < 300) return { name: 'Gold',     needed: 300 - pts,  emoji: '🥇' };
    if (pts < 500) return { name: 'Platinum', needed: 500 - pts,  emoji: '💎' };
    return null;
  };

  const nextBadge = getNextBadge(points);
  const progressPct = nextBadge ? Math.min(100, (points / (points + nextBadge.needed)) * 100) : 100;

  if (loading) return <div style={{...wrap, paddingTop:'60px', textAlign:'center'}}><p style={muted}>Loading...</p></div>;
  if (error) return <div style={{...wrap, paddingTop:'60px', textAlign:'center'}}><p style={{color:'#c84b1f'}}>⚠️ {error}</p></div>;

  return (
    <div style={wrap}>
      <div style={header}>
        <div style={eyebrow}><span style={eyebrowLine}/>Student Profile</div>
        <h1 style={pageTitle}>{student?.full_name}</h1>
        <p style={muted}>{student?.roll_number} · Year {student?.year_of_study} · {student?.department || 'Engineering'}</p>
      </div>

      {/* Points card */}
      <div style={card}>
        <div style={pointsRow}>
          <div style={{textAlign:'center'}}>
            <p style={{fontFamily:"'Clash Display',sans-serif", fontSize:'2.5rem', fontWeight:'800', color:'#c84b1f', margin:0}}>{points}</p>
            <p style={{fontSize:'0.72rem', color:'#8a7d65', margin:0, textTransform:'uppercase', letterSpacing:'0.05em'}}>Total Points</p>
          </div>
          <div style={{flex:1}}>
            {nextBadge ? (
              <>
                <p style={{fontSize:'0.8rem', color:'#8a7d65', marginBottom:'8px', marginTop:0}}>{nextBadge.needed} more points to {nextBadge.emoji} {nextBadge.name}</p>
                <div style={progressBg}><div style={{...progressFill, width:`${progressPct}%`}}/></div>
              </>
            ) : (
              <p style={{color:'#b8860b', fontWeight:'700', margin:0}}>💎 Maximum level reached!</p>
            )}
          </div>
        </div>
      </div>

      {/* Badges earned */}
      {badges.length > 0 && (
        <div style={card}>
          <h2 style={sectionTitle}>🏅 Badges Earned</h2>
          <div style={{display:'flex', gap:'12px', flexWrap:'wrap'}}>
            {badges.map((b, idx) => {
              const cfg = BADGE_CONFIG[b.badge_level] || {};
              return (
                <div key={idx} style={{...badgeChip, background:cfg.bg, border:`1px solid ${cfg.border}`}}>
                  <span style={{fontSize:'1.5rem'}}>{cfg.emoji}</span>
                  <div>
                    <p style={{fontWeight:'800', color:cfg.color, margin:0, fontSize:'0.875rem'}}>{b.badge_name}</p>
                    <p style={{color:'#8a7d65', margin:0, fontSize:'0.7rem'}}>{new Date(b.awarded_at).toLocaleDateString('en-IN', {day:'numeric', month:'short', year:'numeric'})}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Badge progress */}
      <div style={card}>
        <h2 style={sectionTitle}>🎯 Badge Progress</h2>
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(130px,1fr))', gap:'12px'}}>
          {Object.entries(BADGE_CONFIG).map(([level, cfg]) => {
            const earned = badges.some(b => b.badge_level === level);
            return (
              <div key={level} style={{...badgeProgress, opacity: earned ? 1 : 0.4}}>
                <span style={{fontSize:'2rem'}}>{cfg.emoji}</span>
                <p style={{fontWeight:'700', color: earned ? cfg.color : '#8a7d65', margin:'4px 0 2px', fontSize:'0.875rem'}}>{level}</p>
                <p style={{color:'#8a7d65', margin:0, fontSize:'0.7rem'}}>{cfg.points} pts</p>
                {earned && <span style={earnedTag}>✓ Earned</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Submissions */}
      <div style={card}>
        <h2 style={{...sectionTitle, marginBottom:'16px'}}>📋 Submissions ({achievements.length})</h2>
        {achievements.length === 0 && (
          <div style={{textAlign:'center', padding:'32px', color:'#8a7d65'}}>
            <p style={{fontSize:'2rem', marginBottom:'8px'}}>📭</p>
            <p>No submissions yet.</p>
          </div>
        )}
        {achievements.map((a) => {
          const status = STATUS_CONFIG[a.status] || STATUS_CONFIG.pending;
          return (
            <div key={a.id} style={achievementItem}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'6px'}}>
                <div>
                  <p style={{fontWeight:'700', color:'#1a1508', margin:'0 0 2px'}}>{a.title}</p>
                  <p style={{color:'#8a7d65', fontSize:'0.8rem', margin:0}}>{a.sub_category}</p>
                </div>
                <div style={{textAlign:'right', flexShrink:0, marginLeft:'12px'}}>
                  <span style={{...statusTag, background:status.bg, color:status.color}}>{status.label}</span>
                  <p style={{color: a.status === 'approved' ? '#2d6a4f' : '#8a7d65', fontWeight:'700', margin:'4px 0 0', fontSize:'0.875rem'}}>
                    {a.status === 'approved' ? `+${a.points} pts` : `${a.points} pts pending`}
                  </p>
                </div>
              </div>
              {a.description && <p style={{color:'#4a4030', fontSize:'0.8rem', margin:'4px 0 0'}}>{a.description}</p>}
              {a.proof_url && <a href={a.proof_url} target="_blank" rel="noreferrer" style={{color:'#c84b1f', fontSize:'0.75rem', display:'inline-block', marginTop:'6px'}}>🔗 View Proof</a>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const wrap = { background:'#f5f0e8', minHeight:'100vh', fontFamily:"'Cabinet Grotesk',sans-serif", color:'#1a1508', padding:'32px 20px' };
const header = { maxWidth:'640px', margin:'0 auto 20px', paddingBottom:'20px', borderBottom:'1.5px solid #ddd5c0' };
const eyebrow = { display:'flex', alignItems:'center', gap:'8px', fontSize:'0.72rem', fontWeight:'700', letterSpacing:'0.1em', textTransform:'uppercase', color:'#c84b1f', marginBottom:'8px' };
const eyebrowLine = { display:'inline-block', width:'18px', height:'2px', background:'#c84b1f' };
const pageTitle = { fontFamily:"'Clash Display',sans-serif", fontSize:'1.75rem', fontWeight:'700', color:'#1a1508', margin:'0 0 6px' };
const muted = { color:'#8a7d65', fontSize:'0.875rem', margin:0 };
const card = { background:'#fff', borderRadius:'16px', border:'1.5px solid #ddd5c0', padding:'24px', marginBottom:'20px', maxWidth:'640px', margin:'0 auto 20px' };
const sectionTitle = { fontFamily:"'Clash Display',sans-serif", fontSize:'1rem', fontWeight:'700', color:'#1a1508', marginBottom:'16px', marginTop:0 };
const pointsRow = { display:'flex', alignItems:'center', gap:'20px', background:'#f5f0e8', borderRadius:'12px', padding:'16px' };
const progressBg = { background:'#ddd5c0', borderRadius:'99px', height:'8px', overflow:'hidden' };
const progressFill = { height:'100%', background:'linear-gradient(90deg,#c84b1f,#e8673d)', borderRadius:'99px', transition:'width 0.8s ease' };
const badgeChip = { display:'flex', alignItems:'center', gap:'10px', padding:'12px 16px', borderRadius:'12px' };
const badgeProgress = { textAlign:'center', background:'#f5f0e8', borderRadius:'12px', padding:'16px', border:'1.5px solid #ddd5c0' };
const earnedTag = { display:'inline-block', marginTop:'6px', fontSize:'0.65rem', background:'rgba(45,106,79,0.1)', color:'#2d6a4f', padding:'2px 8px', borderRadius:'99px', fontWeight:'700', border:'1px solid rgba(45,106,79,0.2)' };
const achievementItem = { background:'#f5f0e8', borderRadius:'10px', padding:'14px', marginBottom:'10px', border:'1.5px solid #ddd5c0' };
const statusTag = { fontSize:'0.65rem', fontWeight:'700', padding:'3px 8px', borderRadius:'99px', textTransform:'uppercase' };

export default StudentProfile;