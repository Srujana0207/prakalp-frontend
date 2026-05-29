import { useState, useEffect } from 'react';
import { getUser, getToken } from './auth';

const API = 'https://prakalp-backend-e246.onrender.com/api';

function ProgressUpdate() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [team, setTeam] = useState(null);
  const [error, setError] = useState('');
  const [percentage, setPercentage] = useState('');
  const [note, setNote] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const loggedInUser = getUser();
    if (!loggedInUser) { window.location.href = '/'; return; }
    const loadTeam = async () => {
      setLoading(true);
      setError('');
      try {
        const token = getToken();
        const res = await fetch(`${API}/teams/my`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (!data.success) {
          setError('You are not a team leader. Only leaders can post updates.');
        } else {
          setTeam(data.project);
        }
      } catch (err) {
        setError('Failed to load team.');
      }
      setLoading(false);
    };
    loadTeam();
  }, []);

  const latestPercentage = team?.progress || 0;
  const isComplete = latestPercentage === 100;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');
    const pct = parseInt(percentage);
    if (isNaN(pct) || pct < 0 || pct > 100) {
      setError('Percentage must be between 0 and 100.');
      setSubmitting(false);
      return;
    }
    try {
      const token = getToken();
      const res = await fetch(`${API}/teams/progress`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ percentage: pct, note: note.trim() })
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.message);
      } else {
        setTeam(data.project);
        setPercentage('');
        setNote('');
        setSuccess(pct === 100 ? '🎉 Project marked 100% complete! You can now upload QR.' : '✅ Progress updated successfully!');
      }
    } catch (err) {
      setError('Something went wrong: ' + err.message);
    }
    setSubmitting(false);
  };

  return (
    <div style={wrap}>
      {loading && <p style={muted}>Loading...</p>}
      {!loading && error && !team && <div style={errorBox}><p>⚠️ {error}</p></div>}
      {!loading && team && (
        <>
          <div style={card}>
            <div style={eyebrow}>Prakalp 2025</div>
            <h2 style={heading}>{team.title}</h2>
            <p style={muted}>{team.subject} · {team.description}</p>
            <div style={ringWrap}>
              <svg width="120" height="120" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="60" cy="60" r="50" fill="none" stroke="#1e293b" strokeWidth="10" />
                <circle cx="60" cy="60" r="50" fill="none"
                  stroke={isComplete ? '#22c55e' : '#f97316'}
                  strokeWidth="10"
                  strokeDasharray={`${2 * Math.PI * 50}`}
                  strokeDashoffset={`${2 * Math.PI * 50 * (1 - latestPercentage / 100)}`}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                />
              </svg>
              <div style={ringLabel}>
                <span style={{ fontSize: '1.75rem', fontWeight: '800', color: isComplete ? '#22c55e' : '#f97316' }}>
                  {latestPercentage}%
                </span>
                <span style={{ fontSize: '0.72rem', color: '#9aa3b2', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Complete
                </span>
              </div>
            </div>
          </div>

          {isComplete && (
            <div style={{ ...card, borderColor: 'rgba(34,197,94,0.3)', background: 'rgba(34,197,94,0.05)', textAlign: 'center' }}>
              <p style={{ fontSize: '1.5rem' }}>🎉</p>
              <p style={{ color: '#22c55e', fontWeight: '700', marginBottom: '12px' }}>Project Complete!</p>
              <button onClick={() => window.location.href = '/upload-media'} style={{ ...btn, background: '#22c55e' }}>
                📸 Upload QR Code
              </button>
            </div>
          )}

          {!isComplete && (
            <div style={card}>
              <h3 style={{ ...heading, fontSize: '1.1rem', marginBottom: '16px' }}>Post Progress Update</h3>
              {error && <div style={errorBox}><p>⚠️ {error}</p></div>}
              {success && <div style={successBox}><p>{success}</p></div>}
              <form onSubmit={handleSubmit}>
                <label style={label}>Completion Percentage *</label>
                <input
                  type="number"
                  min={latestPercentage}
                  max="100"
                  placeholder={`Current: ${latestPercentage}% — enter new %`}
                  value={percentage}
                  onChange={e => setPercentage(e.target.value)}
                  required
                  style={input}
                />
                <label style={label}>Note / Update Description</label>
                <textarea
                  placeholder="What did your team work on?"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  rows={3}
                  style={{ ...input, resize: 'vertical' }}
                />
                <button type="submit" disabled={submitting} style={btn}>
                  {submitting ? 'Saving...' : '📊 Post Update'}
                </button>
              </form>
            </div>
          )}
        </>
      )}
    </div>
  );
}

const wrap = { padding: '32px 20px', maxWidth: '580px', margin: '0 auto', background: '#0b1020', minHeight: '100vh', color: '#e9edf5' };
const card = { background: '#121938', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', padding: '24px', marginBottom: '20px' };
const heading = { fontSize: '1.4rem', fontWeight: '800', color: '#e9edf5', marginBottom: '6px' };
const muted = { color: '#9aa3b2', fontSize: '0.875rem', marginBottom: '0' };
const eyebrow = { fontSize: '0.7rem', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#f97316', marginBottom: '6px' };
const label = { display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#9aa3b2', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' };
const input = { width: '100%', padding: '12px', marginBottom: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: '#0b1020', color: '#e9edf5', fontSize: '0.9rem' };
const btn = { width: '100%', padding: '13px', background: 'linear-gradient(135deg,#f97316,#fb923c)', color: '#0b1020', fontWeight: '800', border: 'none', borderRadius: '12px', cursor: 'pointer', fontSize: '0.95rem' };
const errorBox = { background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', borderRadius: '10px', padding: '12px 16px', color: '#ef4444', marginBottom: '16px' };
const successBox = { background: 'rgba(34,197,94,0.1)', border: '1px solid #22c55e', borderRadius: '10px', padding: '12px 16px', color: '#22c55e', marginBottom: '16px' };
const ringWrap = { position: 'relative', width: '120px', height: '120px', margin: '20px auto 0' };
const ringLabel = { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' };

export default ProgressUpdate;