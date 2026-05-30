import { useState, useEffect } from 'react';
import supabase from './supabaseClient';
import { getUser } from './auth';

const loggedInUser = getUser();
const SIMULATED_ROLL = loggedInUser?.roll_number || loggedInUser?.rollNumber;

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
    if (!loggedInUser) { window.location.href = '/'; return; }
    const checkLeader = async () => {
      setLoading(true);
      setError('');
      const { data: student, error: sErr } = await supabase
        .from('college_students')
        .select('*')
        .eq('roll_number', SIMULATED_ROLL)
        .single();

      if (sErr || !student) { setError('Roll number not found. Contact admin.'); setLoading(false); return; }
      if (student.year_of_study !== 1) { setError('Only 1st year students can register a project.'); setLoading(false); return; }

      const { data: existing } = await supabase
        .from('prakalp_team_members')
        .select('id')
        .eq('student_id', student.id)
        .is('removed_at', null);

      if (existing && existing.length > 0) { setError('You are already registered in a team.'); setLoading(false); return; }
      setLeaderData(student);
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
    const validRolls = memberRolls.map(r => r.trim()).filter(r => r !== '' && r !== SIMULATED_ROLL);
    const memberStudents = [];
    for (let roll of validRolls) {
      const { data: student } = await supabase.from('college_students').select('id, roll_number, full_name').eq('roll_number', roll).single();
      if (!student) { setError(`Roll number "${roll}" not found.`); setLoading(false); return; }
      const { data: memCheck } = await supabase.from('prakalp_team_members').select('id').eq('student_id', student.id).is('removed_at', null);
      if (memCheck && memCheck.length > 0) { setError(`${roll} is already in another team.`); setLoading(false); return; }
      memberStudents.push(student);
    }
    try {
      const { data: event } = await supabase.from('events').select('id').eq('is_active', true).eq('eligible_year', 1).single();
      if (!event) { setError('No active event found. Contact admin.'); setLoading(false); return; }
      const { data: team, error: teamErr } = await supabase.from('prakalp_teams').insert({ event_id: event.id, project_title: projectTitle, subject_category: subjectCategory, description: description, leader_id: leaderData.id }).select().single();
      if (teamErr) throw teamErr;
      const allMembers = [leaderData, ...memberStudents].map(s => ({ team_id: team.id, student_id: s.id }));
      const { error: memberErr } = await supabase.from('prakalp_team_members').insert(allMembers);
      if (memberErr) throw memberErr;
      setSuccessTeam(team);
      setStep(3);
    } catch (err) {
      setError('Something went wrong: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={wrap}>
      <div style={header}>
        <div style={eyebrow}><span style={eyebrowLine}/>Prakalp 2025</div>
        <h1 style={pageTitle}>Register Your Team</h1>
        <p style={muted}>Only 1st year students can register a Prakalp project team.</p>
      </div>

      {loading && <div style={card}><p style={muted}>Loading...</p></div>}

      {!loading && error && (
        <div style={errorBox}>⚠️ {error}</div>
      )}

      {!loading && !error && leaderData && step === 1 && (
        <div style={card}>
          <div style={leaderBadge}>
            <span style={{fontSize:'1.25rem'}}>⭐</span>
            <div>
              <p style={{fontWeight:'700', color:'#1a1508', margin:0, fontSize:'0.9rem'}}>Team Leader</p>
              <p style={{color:'#8a7d65', margin:0, fontSize:'0.8rem'}}>{leaderData.full_name} · {leaderData.roll_number}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <label style={label}>Project Title *</label>
            <input placeholder="e.g. Smart Irrigation System" value={projectTitle} onChange={e => setProjectTitle(e.target.value)} required style={input}/>

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
            <textarea placeholder="Brief description of your project..." value={description} onChange={e => setDescription(e.target.value)} rows={3} style={{...input, resize:'vertical'}}/>

            <label style={label}>Team Members (Roll Numbers)</label>
            {memberRolls.map((roll, idx) => (
              <div key={idx} style={{display:'flex', gap:'8px', marginBottom:'10px'}}>
                <input placeholder={`Member ${idx + 1} roll number`} value={roll} onChange={e => updateMember(idx, e.target.value)} style={{...input, marginBottom:0, flex:1}}/>
                <button type="button" onClick={() => removeMember(idx)} style={removeBtn}>✕</button>
              </div>
            ))}

            <button type="button" onClick={addMember} style={ghostBtn}>+ Add Member</button>
            <button type="submit" disabled={loading} style={primaryBtn}>
              {loading ? 'Submitting...' : '🚀 Register Project'}
            </button>
          </form>
        </div>
      )}

      {step === 3 && successTeam && (
        <div style={card}>
          <div style={{textAlign:'center', padding:'2rem 0'}}>
            <div style={{fontSize:'4rem', marginBottom:'1rem'}}>🎉</div>
            <h2 style={{fontFamily:"'Clash Display',sans-serif", fontWeight:'700', fontSize:'1.5rem', color:'#1a1508', marginBottom:'0.5rem'}}>Project Registered!</h2>
            <p style={muted}>Your team is now active for Prakalp 2025.</p>
            <div style={successCard}>
              <p style={{fontWeight:'700', color:'#1a1508'}}>{successTeam.project_title}</p>
              <p style={{color:'#8a7d65', fontSize:'0.85rem'}}>{successTeam.subject_category || '—'}</p>
              <p style={{fontSize:'0.72rem', color:'#8a7d65', marginTop:'8px'}}>Team ID: {successTeam.id}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const wrap = { background:'#f5f0e8', minHeight:'100vh', fontFamily:"'Cabinet Grotesk',sans-serif", color:'#1a1508', padding:'32px 20px' };
const header = { maxWidth:'600px', margin:'0 auto 20px', paddingBottom:'20px', borderBottom:'1.5px solid #ddd5c0' };
const eyebrow = { display:'flex', alignItems:'center', gap:'8px', fontSize:'0.72rem', fontWeight:'700', letterSpacing:'0.1em', textTransform:'uppercase', color:'#c84b1f', marginBottom:'8px' };
const eyebrowLine = { display:'inline-block', width:'18px', height:'2px', background:'#c84b1f' };
const pageTitle = { fontFamily:"'Clash Display',sans-serif", fontSize:'1.75rem', fontWeight:'700', color:'#1a1508', marginBottom:'6px', margin:'0 0 6px' };
const muted = { color:'#8a7d65', fontSize:'0.875rem', margin:0 };
const card = { background:'#fff', borderRadius:'16px', border:'1.5px solid #ddd5c0', padding:'24px', marginBottom:'20px', maxWidth:'600px', margin:'0 auto 20px' };
const label = { display:'block', fontSize:'0.75rem', fontWeight:'700', color:'#4a4030', marginBottom:'6px', textTransform:'uppercase', letterSpacing:'0.05em' };
const input = { width:'100%', padding:'12px', marginBottom:'16px', borderRadius:'9px', border:'1.5px solid #ddd5c0', background:'#f5f0e8', color:'#1a1508', fontSize:'0.9rem', fontFamily:"'Cabinet Grotesk',sans-serif", boxSizing:'border-box' };
const primaryBtn = { width:'100%', padding:'13px', background:'#1a1508', color:'#f5f0e8', fontWeight:'800', border:'2px solid #1a1508', borderRadius:'9px', cursor:'pointer', fontSize:'0.95rem', fontFamily:"'Cabinet Grotesk',sans-serif", marginTop:'8px' };
const ghostBtn = { width:'100%', padding:'11px', background:'transparent', color:'#1a1508', fontWeight:'700', border:'2px solid #ddd5c0', borderRadius:'9px', cursor:'pointer', fontSize:'0.875rem', fontFamily:"'Cabinet Grotesk',sans-serif", marginBottom:'12px' };
const removeBtn = { background:'#c84b1f', color:'white', border:'none', borderRadius:'8px', padding:'0 14px', cursor:'pointer', fontWeight:'bold' };
const errorBox = { background:'rgba(200,75,31,0.08)', border:'1px solid rgba(200,75,31,0.3)', borderRadius:'10px', padding:'12px 16px', color:'#c84b1f', marginBottom:'16px', maxWidth:'600px', margin:'0 auto 16px', fontSize:'0.875rem' };
const leaderBadge = { display:'flex', alignItems:'center', gap:'12px', background:'#f5f0e8', border:'1.5px solid #ddd5c0', borderRadius:'12px', padding:'14px 16px', marginBottom:'20px' };
const successCard = { background:'#f5f0e8', borderRadius:'12px', padding:'20px', marginTop:'20px', border:'1.5px solid #ddd5c0' };

export default TeamRegister;