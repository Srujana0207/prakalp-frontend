import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import supabase from './supabaseClient';

function ProjectPage() {
  const { teamId } = useParams();
  const [loading, setLoading] = useState(true);
  const [team, setTeam] = useState(null);
  const [members, setMembers] = useState([]);
  const [media, setMedia] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      // Get team info
      const { data: teamData } = await supabase
        .from('prakalp_teams')
        .select('id, project_title, subject_category, description, events(name)')
        .eq('id', teamId)
        .single();

      if (!teamData) {
        setError('Project not found.');
        setLoading(false);
        return;
      }

      setTeam(teamData);

      // Get members
      const { data: memberData } = await supabase
        .from('prakalp_team_members')
        .select('student_id')
        .eq('team_id', teamId)
        .is('removed_at', null);

      if (memberData) {
        const ids = memberData.map(m => m.student_id);
        const { data: students } = await supabase
          .from('college_students')
          .select('full_name, roll_number, department')
          .in('id', ids);
        setMembers(students || []);
      }

      // Get uploaded media
      const { data: files } = await supabase
        .storage
        .from('prakalp-projects')
        .list(teamId);

      if (files) {
        const urls = files.map(f => ({
          name: f.name,
          url: supabase.storage
            .from('prakalp-projects')
            .getPublicUrl(`${teamId}/${f.name}`).data.publicUrl
        }));
        setMedia(urls);
      }

      setLoading(false);
    };

    load();
  }, [teamId]);

  if (loading) return (
    <div style={wrap}>
      <p style={muted}>Loading project...</p>
    </div>
  );

  if (error) return (
    <div style={wrap}>
      <div style={errorBox}>⚠️ {error}</div>
    </div>
  );

  return (
    <div style={wrap}>
      <link href="https://fonts.googleapis.com/css2?family=Clash+Display:wght@400;500;600;700&family=Cabinet+Grotesk:wght@300;400;500;700;800&display=swap" rel="stylesheet"/>

      {/* Header */}
      <div style={card}>
        <div style={eyebrow}><span style={eyebrowLine}/>{team.events?.name || 'Prakalp 2025'}</div>
        <h1 style={pageTitle}>{team.project_title}</h1>
        <div style={{display:'flex', gap:'8px', flexWrap:'wrap', marginBottom:'16px'}}>
          <span style={tagCat}>{team.subject_category}</span>
          <span style={tagGold}>🏆 Showcase Ready</span>
        </div>
        {team.description && (
          <p style={{color:'#4a4030', fontSize:'0.9rem', lineHeight:1.6}}>
            {team.description}
          </p>
        )}
      </div>

      {/* Team Members */}
      <div style={card}>
        <h2 style={sectionTitle}>Team Members</h2>
        {members.map((m, idx) => (
          <div key={idx} style={{display:'flex', alignItems:'center',
            gap:'12px', padding:'10px 0',
            borderBottom: idx < members.length-1 ? '1px solid #ece6d8' : 'none'}}>
            <div style={{width:'36px', height:'36px', borderRadius:'50%',
              background:'#c84b1f', color:'#fff', display:'flex',
              alignItems:'center', justifyContent:'center',
              fontWeight:'700', fontSize:'0.8rem', flexShrink:0}}>
              {m.full_name.split(' ').map(n=>n[0]).join('').slice(0,2)}
            </div>
            <div>
              <p style={{fontWeight:'700', fontSize:'0.875rem', color:'#1a1508', margin:0}}>
                {m.full_name}
              </p>
              <p style={{fontSize:'0.75rem', color:'#8a7d65', margin:0}}>
                {m.roll_number} · {m.department}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Media Gallery */}
      {media.length > 0 && (
        <div style={card}>
          <h2 style={sectionTitle}>Project Showcase</h2>
          <div style={{display:'grid',
            gridTemplateColumns:'repeat(auto-fill, minmax(160px,1fr))', gap:'12px'}}>
            {media.map((f, idx) => (
              <div key={idx}>
                {f.name.match(/\.(mp4|mov|avi|webm)$/i) ? (
                  <video src={f.url} controls
                    style={{width:'100%', borderRadius:'10px',
                      border:'1px solid #ddd5c0'}}/>
                ) : (
                  <img src={f.url} alt={f.name}
                    style={{width:'100%', height:'160px', objectFit:'cover',
                      borderRadius:'10px', border:'1px solid #ddd5c0',
                      cursor:'pointer'}}
                    onClick={() => window.open(f.url, '_blank')}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {media.length === 0 && (
        <div style={{...card, textAlign:'center'}}>
          <p style={{fontSize:'2rem'}}>📭</p>
          <p style={muted}>No media uploaded yet.</p>
        </div>
      )}
    </div>
  );
}

// Styles
const wrap = {
  background:'#f5f0e8', minHeight:'100vh',
  fontFamily:"'Cabinet Grotesk',sans-serif",
  color:'#1a1508', padding:'32px 20px'
};
const card = {
  background:'#fff', borderRadius:'16px', border:'1.5px solid #ddd5c0',
  padding:'24px', marginBottom:'20px', maxWidth:'640px', margin:'0 auto 20px'
};
const eyebrow = {
  display:'flex', alignItems:'center', gap:'8px', fontSize:'0.72rem',
  fontWeight:'700', letterSpacing:'0.1em', textTransform:'uppercase',
  color:'#c84b1f', marginBottom:'8px'
};
const eyebrowLine = {
  display:'inline-block', width:'18px', height:'2px', background:'#c84b1f'
};
const pageTitle = {
  fontFamily:"'Clash Display',sans-serif", fontSize:'1.6rem',
  fontWeight:'700', color:'#1a1508', marginBottom:'12px'
};
const sectionTitle = {
  fontFamily:"'Clash Display',sans-serif", fontSize:'1.1rem',
  fontWeight:'600', color:'#1a1508', marginBottom:'16px'
};
const muted = { color:'#8a7d65', fontSize:'0.875rem' };
const tagCat = {
  fontSize:'0.68rem', fontWeight:'700', padding:'3px 8px', borderRadius:'5px',
  background:'rgba(200,75,31,0.1)', color:'#c84b1f',
  border:'1px solid rgba(200,75,31,0.2)'
};
const tagGold = {
  fontSize:'0.68rem', fontWeight:'700', padding:'3px 8px', borderRadius:'5px',
  background:'rgba(184,134,11,0.1)', color:'#b8860b',
  border:'1px solid rgba(184,134,11,0.2)'
};
const errorBox = {
  background:'rgba(200,75,31,0.08)', border:'1px solid rgba(200,75,31,0.3)',
  borderRadius:'10px', padding:'12px 16px', color:'#c84b1f', fontSize:'0.875rem'
};

export default ProjectPage;