import { useState, useEffect } from 'react';
import { getUser, getToken } from './auth';

const API = 'https://prakalp-backend-e246.onrender.com/api';

function TeamRegister() {
  const [loading, setLoading] = useState(true);
  const [leaderData, setLeaderData] = useState(null);
  const [projectTitle, setProjectTitle] = useState('');
  const [subjectCategory, setSubjectCategory] = useState('');
  const [description, setDescription] = useState('');
  const [memberRolls, setMemberRolls] = useState(['']);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);
  const [successTeam, setSuccessTeam] = useState(null);

  useEffect(() => {
    const loggedInUser = getUser();
    if (!loggedInUser) {
      window.location.href = '/';
      return;
    }
    const checkLeader = async () => {
      setLoading(true);
      setError('');
      try {
        const token = getToken();
        const res = await fetch(`${API}/teams/my`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setSuccessTeam(data.project);
          setStep(3);
        } else {
          setLeaderData(loggedInUser);
        }
      } catch (err) {
        setLeaderData(loggedInUser);
      }
      setLoading(false);
    };
    checkLeader();
  }, []);

  const addMember = () => setMemberRolls([...memberRolls, '']);
  const removeMember = (i) => setMemberRolls(memberRolls.filter((_, idx) => idx !== i));
  const updateMember = (i, val) => {
    const updated = [...memberRolls];
    updated[i] = val;
    setMemberRolls(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const token = getToken();
      const validRolls = memberRolls.map(r => r.trim()).filter(r => r !== '');
      const res = await fetch(`${API}/teams/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ projectTitle, subjectCategory, description, memberRolls: validRolls })
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.message);
      } else {
        setSuccessTeam(data.project);
        setStep(3);
      }
    } catch (err) {
      setError('Something went wrong: ' + err.message);
    }
    setLoading(false);
  };

  return (
    <div style={wrap}>
      {loading && <p style={sub}>Loading...</p>}
      {!loading && error && (
        <div style={errorBox}><p>⚠️ {error}</p></div>
      )}
      {!loading && !error && leaderData && step === 1 && (
        <form onSubmit={handleSubmit}>
          <h2 style={heading}>Register Your Project</h2>
          <p style={sub}>
            Leader: <strong style={{ color: '#f97316' }}>
              {leaderData.name} ({leaderData.roll_number})
            </strong>
          </p>
          <label style={label}>Project Title *</label>
          <input
            placeholder="e.g. Smart Irrigation System"
            value={projectTitle}
            onChange={e => setProjectTitle(e.target.value)}
            required
            style={input}
          />
          <label style={label}>Subject Category</label>
          <select value={subjectCategory} onChange={e => setSubjectCategory(e.target.value)} style={input}>
            <option value="">Select category</option>
            <option>AI & ML</option>
            <option>IoT</option>
            <option>Robotics</option>
            <option>Web & App</option>
            <option>Energy</option>
            <option>Bio-Tech</option>
            <option>Other</option>
          </select>
          <label style={label}>Project Description</label>
          <textarea
            placeholder="Brief description of your project..."
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={3}
            style={{ ...input, resize: 'vertical' }}
          />
          <label style={label}>Team Members (Roll Numbers)</label>
          {memberRolls.map((roll, idx) => (
            <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
              <input
                placeholder={`Member ${idx + 1} roll number`}
                value={roll}
                onChange={e => updateMember(idx, e.target.value)}
                style={{ ...input, marginBottom: 0, flex: 1 }}
              />
              <button type="button" onClick={() => removeMember(idx)} style={removeBtn}>✕</button>
            </div>
          ))}
          <button type="button" onClick={addMember}
            style={{ ...btn, background: '#1e293b', marginBottom: '16px' }}>
            + Add Member
          </button>
          <button type="submit" disabled={loading} style={btn}>
            {loading ? 'Submitting...' : '🚀 Register Project'}
          </button>
        </form>
      )}
      {step === 3 && successTeam && (
        <div style={{ textAlign: 'center', paddingTop: '40px' }}>
          <div style={{ fontSize: '4rem' }}>🎉</div>
          <h2 style={heading}>Project Registered!</h2>
          <p style={sub}>Your team is now active for Prakalp 2025.</p>
          <div style={successCard}>
            <p><strong>Project:</strong> {successTeam.title}</p>
            <p><strong>Category:</strong> {successTeam.subject || '—'}</p>
            <p style={{ fontSize: '0.75rem', color: '#9aa3b2', marginTop: '8px' }}>
              Team ID: {successTeam._id}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

const wrap = { padding: '40px', maxWidth: '580px', margin: '0 auto', background: '#0b1020', minHeight: '100vh', color: '#e9edf5' };
const heading = { fontSize: '1.5rem', marginBottom: '6px', color: '#e9edf5' };
const sub = { color: '#9aa3b2', marginBottom: '24px', fontSize: '0.9rem' };
const label = { display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#9aa3b2', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' };
const input = { width: '100%', padding: '12px', marginBottom: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', background: '#121938', color: '#e9edf5', fontSize: '0.9rem' };
const btn = { width: '100%', padding: '13px', background: 'linear-gradient(135deg,#f97316,#fb923c)', color: '#0b1020', fontWeight: '800', border: 'none', borderRadius: '12px', cursor: 'pointer', fontSize: '0.95rem' };
const removeBtn = { background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', padding: '0 14px', cursor: 'pointer', fontWeight: 'bold' };
const errorBox = { background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', borderRadius: '10px', padding: '16px', color: '#ef4444' };
const successCard = { background: '#121938', borderRadius: '12px', padding: '20px', marginTop: '20px', textAlign: 'left', border: '1px solid rgba(249,115,22,0.3)' };

export default TeamRegister;