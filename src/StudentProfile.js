import { useState, useEffect } from 'react';
import { getUser, getToken } from './auth';

const API = 'https://prakalp-backend-e246.onrender.com/api';

const BADGE_CONFIG = {
  Bronze:   { emoji: '🥉', color: '#cd7f32', bg: 'rgba(205,127,50,0.1)',  border: 'rgba(205,127,50,0.3)',  points: 50  },
  Silver:   { emoji: '🥈', color: '#c0c0c0', bg: 'rgba(192,192,192,0.1)', border: 'rgba(192,192,192,0.3)', points: 150 },
  Gold:     { emoji: '🥇', color: '#ffd700', bg: 'rgba(255,215,0,0.1)',   border: 'rgba(255,215,0,0.3)',   points: 300 },
  Platinum: { emoji: '💎', color: '#e5e4e2', bg: 'rgba(229,228,226,0.1)', border: 'rgba(229,228,226,0.3)', points: 500 },
};

function StudentProfile() {
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState(null);
  const [points, setPoints] = useState(0);
  const [tier, setTier] = useState('Explorer');
  const [badges, setBadges] = useState([]);
  const [nextBadge, setNextBadge] = useState(null);
  const [error, setError] = useState('');
  const loggedInUser = getUser();

  useEffect(() => {
    if (!loggedInUser) { window.location.href = '/'; return; }
    const load = async () => {
      setLoading(true);
      try {
        const token = getToken();

        // Get profile from MongoDB
        const profileRes = await fetch(`${API}/auth/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const profileData = await profileRes.json();
        if (profileData.success) {
          setStudent(profileData.student);
        }

        // Get badges from MongoDB
        const badgeRes = await fetch(`${API}/badges/my`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const badgeData = await badgeRes.json();
        if (badgeData.success) {
          setPoints(badgeData.rankScore || 0);
          setTier(badgeData.tier || 'Explorer');
          setBadges(badgeData.badges || []);
          setNextBadge(badgeData.nextBadge || null);
        }
      } catch (err) {
        setError('Failed to load profile.');
      }
      setLoading(false);
    };
    load();
  }, []);

  const progressPct = nextBadge
    ? Math.min(100, (points / nextBadge.points) * 100)
    : 100;

  if (loading) return <div style={{ ...wrap, color: '#9aa3b2', paddingTop: '60px', textAlign: 'center' }}>Loading...</div>;
  if (error) return <div style={{ ...wrap, color: '#ef4444', paddingTop: '60px', textAlign: 'center' }}>⚠️ {error}</div>;

  return (
    <div style={wrap}>

      {/* Profile Header */}
      <div style={card}>
        <div style={avatarRow}>
          <div style={avatar}>
            {student?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 style={pageTitle}>{student?.name}</h1>
            <p style={muted}>{student?.rollNumber} · Year {student?.year} · {student?.department || 'Engineering'}</p>
            <p style={{ ...muted, color: '#f97316', fontWeight: '700', marginTop: '4px' }}>⭐ {tier}</p>
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

      {/* Earned Badges */}
      {badges.length > 0 && (
        <div style={card}>
          <h2 style={sectionTitle}>🏅 Badges Earned</h2>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {badges.map((b, idx) => {
              const cfg = BADGE_CONFIG[b.name] || {};
              return (
                <div key={idx} style={{ ...badgeChip, background: cfg.bg, border: `1px solid ${cfg.border}` }}>
                  <span style={{ fontSize: '1.5rem' }}>{cfg.emoji}</span>
                  <div>
                    <p style={{ fontWeight: '800', color: cfg.color, margin: 0, fontSize: '0.875rem' }}>{b.name}</p>
                    <p style={{ color: '#9aa3b2', margin: 0, fontSize: '0.7rem' }}>{b.points} pts</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* All badges progress */}
      <div style={card}>
        <h2 style={sectionTitle}>🎯 Badge Progress</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px,1fr))', gap: '12px' }}>
          {Object.entries(BADGE_CONFIG).map(([level, cfg]) => {
            const earned = badges.some(b => b.name === level);
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

export default StudentProfile;