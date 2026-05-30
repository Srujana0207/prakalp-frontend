import { useState, useEffect } from 'react';
import supabase from './supabaseClient';
import { getUser } from './auth';

const API = 'https://prakalp-backend-e246.onrender.com/api';

const BADGE_CONFIG = {
  Bronze:   { emoji: '🥉', color: '#cd7f32', bg: 'rgba(205,127,50,0.1)',  border: 'rgba(205,127,50,0.3)',  points: 50  },
  Silver:   { emoji: '🥈', color: '#c0c0c0', bg: 'rgba(192,192,192,0.1)', border: 'rgba(192,192,192,0.3)', points: 150 },
  Gold:     { emoji: '🥇', color: '#ffd700', bg: 'rgba(255,215,0,0.1)',   border: 'rgba(255,215,0,0.3)',   points: 300 },
  Platinum: { emoji: '💎', color: '#e5e4e2', bg: 'rgba(229,228,226,0.1)', border: 'rgba(229,228,226,0.3)', points: 500 },
};

const STATUS_CONFIG = {
  pending:  { label: 'Pending',  color: '#f97316', bg: 'rgba(249,115,22,0.1)'  },
  approved: { label: 'Approved', color: '#22c55e', bg: 'rgba(34,197,94,0.1)'   },
  rejected: { label: 'Rejected', color: '#ef4444', bg: 'rgba(239,68,68,0.1)'   },
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

      // Get student from Supabase
      const { data: studentData } = await supabase
        .from('college_students')
        .select('id, full_name, roll_number, year_of_study, department')
        .eq('roll_number', loggedInUser.roll_number)
        .single();

      if (!studentData) { setError('Student not found.'); setLoading(false); return; }
      setStudent(studentData);

      // Get points from Supabase (Prakalp/project points)
      const { data: pointsData } = await supabase
        .from('student_points')
        .select('total_points')
        .eq('student_id', studentData.id)
        .single();

      const supabasePoints = pointsData?.total_points || 0;

      // Get points from MongoDB backend (hackathon/achievement points)
      let mongoPoints = 0;
      try {
        const token = localStorage.getItem('prakalp_token');
        if (token) {
          const res = await fetch(`${API}/auth/profile`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const mongoData = await res.json();
          mongoPoints = mongoData?.student?.rankScore || 0;
        }
      } catch (e) {
        console.log('MongoDB points not available:', e.message);
      }

      // Combine both sources
      setPoints(supabasePoints + mongoPoints);

      // Get badges from Supabase
      const { data: badgesData } = await supabase
        .from('student_badges')
        .select('*')
        .eq('student_id', studentData.id)
        .order('awarded_at', { ascending: false });

      setBadges(badgesData || []);

      // Get achievements from Supabase
      const { data: achievementsData } = await supabase
        .from('achievements')
        .select('*')
        .eq('student_id', studentData.id)
        .order('submitted_at', { ascending: false });

      setAchievements(achievementsData || []);
      setLoading(false);
    };
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Next badge threshold
  const getNextBadge = (pts) => {
    if (pts < 50)  return { name: 'Bronze', needed: 50 - pts,   emoji: '🥉' };
    if (pts < 150) return { name: 'Silver', needed: 150 - pts,  emoji: '🥈' };
    if (pts < 300) return { name: 'Gold',   needed: 300 - pts,  emoji: '🥇' };
    if (pts < 500) return { name: 'Platinum', needed: 500 - pts, emoji: '💎' };
    return null;
  };

  const nextBadge = getNextBadge(points);
  const progressPct = nextBadge
    ? Math.min(100, (points / (points + nextBadge.needed)) * 100)
    : 100;

  if (loading) return <div style={{ ...wrap, color: '#9aa3b2', paddingTop: '60px', textAlign: 'center' }}>Loading...</div>;
  if (error) return <div style={{ ...wrap, color: '#ef4444', paddingTop: '60px', textAlign: 'center' }}>⚠️ {error}</div>;

  return (
    <div style={wrap}>

      {/* Profile Header */}
      <div style={card}>
        <div style={avatarRow}>
          <div style={avatar}>
            {student?.full_name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 style={pageTitle}>{student?.full_name}</h1>
            <p style={muted}>{student?.roll_number} · Year {student?.year_of_study} · {student?.department || 'Engineering'}</p>
          </div>
        </div>

        {/* Points + Progress */}
        <div style={pointsCard}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '2.5rem', fontWeight: '800', color: '#f97316', margin: 0 }}>{points}</p>
            <p style={{ fontSize: '0.75rem', color: '#9aa3b2', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Points</p>
          </div>
          <div style={{ flex: 1 }}>
            {nextBadge ? (
              <>
                <p style={{ fontSize: '0.8rem', color: '#9aa3b2', marginBottom: '8px' }}>
                  {nextBadge.needed} more points to {nextBadge.emoji} {nextBadge.name}
                </p>
                <div style={progressBg}>
                  <div style={{ ...progressFill, width: `${progressPct}%` }} />
                </div>
              </>
            ) : (
              <p style={{ color: '#ffd700', fontWeight: '700' }}>💎 Maximum level reached!</p>
            )}
          </div>
        </div>
      </div>

      {/* Badges */}
      {badges.length > 0 && (
        <div style={card}>
          <h2 style={sectionTitle}>🏅 Badges Earned</h2>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {badges.map((b, idx) => {
              const cfg = BADGE_CONFIG[b.badge_level] || {};
              return (
                <div key={idx} style={{ ...badgeChip, background: cfg.bg, border: `1px solid ${cfg.border}` }}>
                  <span style={{ fontSize: '1.5rem' }}>{cfg.emoji}</span>
                  <div>
                    <p style={{ fontWeight: '800', color: cfg.color, margin: 0, fontSize: '0.875rem' }}>{b.badge_name}</p>
                    <p style={{ color: '#9aa3b2', margin: 0, fontSize: '0.7rem' }}>
                      {new Date(b.awarded_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* All badges (locked/unlocked) */}
      <div style={card}>
        <h2 style={sectionTitle}>🎯 Badge Progress</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px,1fr))', gap: '12px' }}>
          {Object.entries(BADGE_CONFIG).map(([level, cfg]) => {
            const earned = badges.some(b => b.badge_level === level);
            return (
              <div key={level} style={{ ...badgeProgress, opacity: earned ? 1 : 0.4 }}>
                <span style={{ fontSize: '2rem' }}>{cfg.emoji}</span>
                <p style={{ fontWeight: '700', color: earned ? cfg.color : '#9aa3b2', margin: '4px 0 2px', fontSize: '0.875rem' }}>{level}</p>
                <p style={{ color: '#9aa3b2', margin: 0, fontSize: '0.7rem' }}>{cfg.points} pts</p>
                {earned && <span style={earnedTag}>✓ Earned</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Achievements history */}
      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ ...sectionTitle, margin: 0 }}>📋 Submissions ({achievements.length})</h2>
        </div>

        {achievements.length === 0 && (
          <div style={{ textAlign: 'center', padding: '32px', color: '#9aa3b2' }}>
            <p style={{ fontSize: '2rem', marginBottom: '8px' }}>📭</p>
            <p>No submissions yet.</p>
          </div>
        )}

        {achievements.map((a) => {
          const status = STATUS_CONFIG[a.status] || STATUS_CONFIG.pending;
          return (
            <div key={a.id} style={achievementItem}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                <div>
                  <p style={{ fontWeight: '700', color: '#e9edf5', margin: '0 0 2px' }}>{a.title}</p>
                  <p style={{ color: '#9aa3b2', fontSize: '0.8rem', margin: 0 }}>{a.sub_category}</p>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '12px' }}>
                  <span style={{ ...statusTag, background: status.bg, color: status.color }}>{status.label}</span>
                  <p style={{ color: a.status === 'approved' ? '#22c55e' : '#9aa3b2', fontWeight: '700', margin: '4px 0 0', fontSize: '0.875rem' }}>
                    {a.status === 'approved' ? `+${a.points} pts` : `${a.points} pts pending`}
                  </p>
                </div>
              </div>
              {a.description && <p style={{ color: '#c8d0e0', fontSize: '0.8rem', margin: '4px 0 0' }}>{a.description}</p>}
              {a.proof_url && (
                <a href={a.proof_url} target="_blank" rel="noreferrer"
                  style={{ color: '#f97316', fontSize: '0.75rem', display: 'inline-block', marginTop: '6px' }}>
                  🔗 View Proof
                </a>
              )}
              <p style={{ color: '#9aa3b2', fontSize: '0.7rem', margin: '6px 0 0' }}>
                Submitted {new Date(a.submitted_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const wrap = { background: '#0b1020', minHeight: '100vh', padding: '32px 20px', fontFamily: 'sans-serif' };
const card = { background: '#121938', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', padding: '24px', marginBottom: '20px', maxWidth: '640px', margin: '0 auto 20px' };
const pageTitle = { fontSize: '1.4rem', fontWeight: '800', color: '#e9edf5', margin: '0 0 4px' };
const sectionTitle = { fontSize: '1rem', fontWeight: '700', color: '#e9edf5', marginBottom: '16px' };
const muted = { color: '#9aa3b2', fontSize: '0.875rem', margin: 0 };
const avatarRow = { display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' };
const avatar = { width: '56px', height: '56px', borderRadius: '50%', background: 'linear-gradient(135deg,#f97316,#fb923c)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: '800', color: '#0b1020', flexShrink: 0 };
const pointsCard = { display: 'flex', alignItems: 'center', gap: '20px', background: '#0b1020', borderRadius: '12px', padding: '16px' };
const progressBg = { background: 'rgba(255,255,255,0.08)', borderRadius: '99px', height: '8px', overflow: 'hidden' };
const progressFill = { height: '100%', background: 'linear-gradient(90deg,#f97316,#fb923c)', borderRadius: '99px', transition: 'width 0.8s ease' };
const badgeChip = { display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderRadius: '12px' };
const badgeProgress = { textAlign: 'center', background: '#0b1020', borderRadius: '12px', padding: '16px' };
const earnedTag = { display: 'inline-block', marginTop: '6px', fontSize: '0.65rem', background: 'rgba(34,197,94,0.15)', color: '#22c55e', padding: '2px 8px', borderRadius: '99px', fontWeight: '700' };
const achievementItem = { background: '#0b1020', borderRadius: '10px', padding: '14px', marginBottom: '10px' };
const statusTag = { fontSize: '0.65rem', fontWeight: '700', padding: '3px 8px', borderRadius: '99px', textTransform: 'uppercase' };

export default StudentProfile;