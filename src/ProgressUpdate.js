import { useState, useEffect } from 'react';
import supabase from './supabaseClient';
import { getUser } from './auth';

const loggedInUser = getUser();
const SIMULATED_ROLL = loggedInUser?.roll_number || loggedInUser?.rollNumber;

function ProgressUpdate() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [team, setTeam] = useState(null);
  const [updates, setUpdates] = useState([]);
  const [error, setError] = useState('');
  const [percentage, setPercentage] = useState('');
  const [note, setNote] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!loggedInUser) { window.location.href = '/'; return; }
    const loadTeam = async () => {
      setLoading(true); setError('');
      const { data: student } = await supabase.from('college_students').select('id, full_name').eq('roll_number', SIMULATED_ROLL).single();
      if (!student) { setError('Student not found.'); setLoading(false); return; }
      const { data: teamData } = await supabase.from('prakalp_teams').select('id, project_title, subject_category, description, is_active, events(name, active_start_date, active_end_date)').eq('leader_id', student.id).single();
      if (!teamData) { setError('You are not a team leader. Only leaders can post updates.'); setLoading(false); return; }
      setTeam(teamData);
      const { data: existingUpdates } = await supabase.from('progress_updates').select('*').eq('team_id', teamData.id).order('created_at', { ascending: false });
      setUpdates(existingUpdates || []);
      setLoading(false);
    };
    loadTeam();
  }, []);

  const latestPercentage = updates.length > 0 ? updates[0].percentage : 0;
  const isComplete = latestPercentage === 100;

  const handleSubmit = async (e) => {
    e.preventDefault(); setSubmitting(true); setError(''); setSuccess('');
    const pct = parseInt(percentage);
    if (isNaN(pct) || pct < 0 || pct > 100) { setError('Percentage must be between 0 and 100.'); setSubmitting(false); return; }
    if (pct < latestPercentage) { setError(`Cannot go below current progress (${latestPercentage}%).`); setSubmitting(false); return; }
    const { data: student } = await supabase.from('college_students').select('id').eq('roll_number', SIMULATED_ROLL).single();
    const { error: insertErr } = await supabase.from('progress_updates').insert({ team_id: team.id, uploaded_by: student.id, percentage: pct, note: note.trim() || null, photo_url: null });
    if (insertErr) { setError('Failed to save update: ' + insertErr.message); setSubmitting(false); return; }
    const { data: refreshed } = await supabase.from('progress_updates').select('*').eq('team_id', team.id).order('created_at', { ascending: false });
    setUpdates(refreshed || []);
    setPercentage(''); setNote('');
    setSuccess(pct === 100 ? '🎉 Project marked 100% complete! You can now upload photos/videos.' : '✅ Progress updated successfully!');
    setSubmitting(false);
  };

  return (
    <div style={wrap}>
      <div style={header}>
        <div style={eyebrow}><span style={eyebrowLine}/>Prakalp 2025</div>
        <h1 style={pageTitle}>My Project Progress</h1>
      </div>

      {loading && <div style={card}><p style={muted}>Loading...</p></div>}
      {!loading && error && !team && <div style={errorBox}>⚠️ {error}</div>}

      {!loading && team && (
        <>
          <div style={card}>
            <p style={{fontSize:'0.72rem', fontWeight:'700', color:'#c84b1f', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:'6px'}}>Current Project</p>
            <h2 style={{fontFamily:"'Clash Display',sans-serif", fontWeight:'700', fontSize:'1.3rem', color:'#1a1508', marginBottom:'4px'}}>{team.project_title}</h2>
            <p style={muted}>{team.subject_category}</p>

            <div style={ringWrap}>
              <svg width="120" height="120" style={{transform:'rotate(-90deg)'}}>
                <circle cx="60" cy="60" r="50" fill="none" stroke="#ece6d8" strokeWidth="10"/>
                <circle cx="60" cy="60" r="50" fill="none" stroke={isComplete ? '#2d6a4f' : '#c84b1f'} strokeWidth="10"
                  strokeDasharray={`${2 * Math.PI * 50}`}
                  strokeDashoffset={`${2 * Math.PI * 50 * (1 - latestPercentage / 100)}`}
                  strokeLinecap="round" style={{transition:'stroke-dashoffset 0.8s ease'}}/>
              </svg>
              <div style={ringLabel}>
                <span style={{fontSize:'1.75rem', fontWeight:'800', color: isComplete ? '#2d6a4f' : '#c84b1f'}}>{latestPercentage}%</span>
                <span style={{fontSize:'0.72rem', color:'#8a7d65', textTransform:'uppercase', letterSpacing:'0.05em'}}>Complete</span>
              </div>
            </div>
          </div>

          {isComplete && (
            <div style={{...card, borderColor:'rgba(45,106,79,0.3)', background:'rgba(45,106,79,0.04)', textAlign:'center'}}>
              <p style={{fontSize:'1.5rem'}}>🎉</p>
              <p style={{color:'#2d6a4f', fontWeight:'700', marginBottom:'12px'}}>Project Complete!</p>
              <button onClick={() => window.location.href = '/upload-media'} style={{...primaryBtn, background:'#2d6a4f', borderColor:'#2d6a4f'}}>📸 Upload Photos & Videos</button>
            </div>
          )}

          {!isComplete && (
            <div style={card}>
              <h3 style={{fontFamily:"'Clash Display',sans-serif", fontWeight:'700', fontSize:'1rem', marginBottom:'16px', color:'#1a1508'}}>Post Progress Update</h3>
              {error && <div style={errorBox}>⚠️ {error}</div>}
              {success && <div style={successBox}>{success}</div>}
              <form onSubmit={handleSubmit}>
                <label style={label}>Completion Percentage *</label>
                <input type="number" min={latestPercentage} max="100" placeholder={`Current: ${latestPercentage}% — enter new %`} value={percentage} onChange={e => setPercentage(e.target.value)} required style={input}/>
                <label style={label}>Note / Update Description</label>
                <textarea placeholder="What did your team work on?" value={note} onChange={e => setNote(e.target.value)} rows={3} style={{...input, resize:'vertical'}}/>
                <button type="submit" disabled={submitting} style={primaryBtn}>{submitting ? 'Saving...' : '📊 Post Update'}</button>
              </form>
            </div>
          )}

          {updates.length > 0 && (
            <div style={card}>
              <h3 style={{fontFamily:"'Clash Display',sans-serif", fontWeight:'700', fontSize:'1rem', marginBottom:'16px', color:'#1a1508'}}>Progress History</h3>
              {updates.map((u, idx) => (
                <div key={u.id} style={historyItem}>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'4px'}}>
                    <span style={{fontWeight:'800', fontSize:'1.1rem', color: u.percentage === 100 ? '#2d6a4f' : '#c84b1f'}}>{u.percentage}%</span>
                    <span style={{fontSize:'0.75rem', color:'#8a7d65'}}>{new Date(u.created_at).toLocaleDateString('en-IN', {day:'numeric', month:'short', year:'numeric'})}</span>
                  </div>
                  {u.note && <p style={{fontSize:'0.875rem', color:'#4a4030', margin:0}}>{u.note}</p>}
                  {idx < updates.length - 1 && <div style={divider}/>}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

const wrap = { background:'#f5f0e8', minHeight:'100vh', fontFamily:"'Cabinet Grotesk',sans-serif", color:'#1a1508', padding:'32px 20px' };
const header = { maxWidth:'600px', margin:'0 auto 20px', paddingBottom:'20px', borderBottom:'1.5px solid #ddd5c0' };
const eyebrow = { display:'flex', alignItems:'center', gap:'8px', fontSize:'0.72rem', fontWeight:'700', letterSpacing:'0.1em', textTransform:'uppercase', color:'#c84b1f', marginBottom:'8px' };
const eyebrowLine = { display:'inline-block', width:'18px', height:'2px', background:'#c84b1f' };
const pageTitle = { fontFamily:"'Clash Display',sans-serif", fontSize:'1.75rem', fontWeight:'700', color:'#1a1508', margin:'0 0 6px' };
const muted = { color:'#8a7d65', fontSize:'0.875rem', margin:0 };
const card = { background:'#fff', borderRadius:'16px', border:'1.5px solid #ddd5c0', padding:'24px', marginBottom:'20px', maxWidth:'600px', margin:'0 auto 20px' };
const label = { display:'block', fontSize:'0.75rem', fontWeight:'700', color:'#4a4030', marginBottom:'6px', textTransform:'uppercase', letterSpacing:'0.05em' };
const input = { width:'100%', padding:'12px', marginBottom:'16px', borderRadius:'9px', border:'1.5px solid #ddd5c0', background:'#f5f0e8', color:'#1a1508', fontSize:'0.9rem', fontFamily:"'Cabinet Grotesk',sans-serif", boxSizing:'border-box' };
const primaryBtn = { width:'100%', padding:'13px', background:'#1a1508', color:'#f5f0e8', fontWeight:'800', border:'2px solid #1a1508', borderRadius:'9px', cursor:'pointer', fontSize:'0.95rem', fontFamily:"'Cabinet Grotesk',sans-serif", marginTop:'8px' };
const errorBox = { background:'rgba(200,75,31,0.08)', border:'1px solid rgba(200,75,31,0.3)', borderRadius:'10px', padding:'12px 16px', color:'#c84b1f', marginBottom:'16px', fontSize:'0.875rem' };
const successBox = { background:'rgba(45,106,79,0.08)', border:'1px solid rgba(45,106,79,0.3)', borderRadius:'10px', padding:'12px 16px', color:'#2d6a4f', marginBottom:'16px', fontSize:'0.875rem' };
const ringWrap = { position:'relative', width:'120px', height:'120px', margin:'20px auto 0' };
const ringLabel = { position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' };
const historyItem = { paddingBottom:'12px' };
const divider = { height:'1px', background:'#ddd5c0', margin:'12px 0' };

export default ProgressUpdate;