import { useState, useEffect } from 'react';
import supabase from './supabaseClient';
import { QRCodeCanvas } from 'qrcode.react';
import { getUser } from './auth';

const loggedInUser = getUser();
const SIMULATED_ROLL = loggedInUser?.roll_number;

function MediaUpload() {
  const [loading, setLoading] = useState(true);
  const [team, setTeam] = useState(null);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [mediaFiles, setMediaFiles] = useState([]);
  const [uploadedUrls, setUploadedUrls] = useState([]);
  const [qrUrl, setQrUrl] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!loggedInUser) { window.location.href = '/'; return; }
    const load = async () => {
      setLoading(true);

      const { data: student } = await supabase
        .from('college_students')
        .select('id')
        .eq('roll_number', SIMULATED_ROLL)
        .single();

      if (!student) { setError('Student not found.'); setLoading(false); return; }

      const { data: teamData } = await supabase
        .from('prakalp_teams')
        .select('id, project_title, subject_category')
        .eq('leader_id', student.id)
        .single();

      if (!teamData) { setError('You are not a team leader.'); setLoading(false); return; }

      const { data: latestUpdate } = await supabase
        .from('progress_updates')
        .select('percentage')
        .eq('team_id', teamData.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!latestUpdate || latestUpdate.percentage < 100) {
        setError('You can only upload media after reaching 100% progress.');
        setLoading(false);
        return;
      }

      setTeam(teamData);

      const { data: qrData } = await supabase
        .from('project_qr')
        .select('external_link')
        .eq('team_id', teamData.id)
        .single();

      if (qrData?.external_link) setQrUrl(qrData.external_link);

      const { data: files } = await supabase.storage.from('prakalp-projects').list(teamData.id);
      if (files) {
        const urls = files.map(f => ({
          name: f.name,
          url: supabase.storage.from('prakalp-projects').getPublicUrl(`${teamData.id}/${f.name}`).data.publicUrl
        }));
        setUploadedUrls(urls);
        if (!qrData?.external_link && urls.length > 0) {
          setQrUrl(`${window.location.origin}/project/${teamData.id}`);
        }
      }
      setLoading(false);
    };
    load();
  }, []);

  const handleUpload = async () => {
    if (!mediaFiles.length) return;
    setUploading(true); setError(''); setSuccess('');
    try {
      const newUrls = [];
      for (let file of mediaFiles) {
        const filePath = `${team.id}/${Date.now()}_${file.name}`;
        const { error: uploadErr } = await supabase.storage.from('prakalp-projects').upload(filePath, file, { upsert: true });
        if (uploadErr) throw uploadErr;
        const { data: urlData } = supabase.storage.from('prakalp-projects').getPublicUrl(filePath);
        newUrls.push({ name: file.name, url: urlData.publicUrl });
      }
      const allUrls = [...uploadedUrls, ...newUrls];
      setUploadedUrls(allUrls);
      const projectUrl = `${window.location.origin}/project/${team.id}`;
      setQrUrl(projectUrl);
      await supabase.from('project_qr').upsert({ team_id: team.id, external_link: projectUrl, qr_image_url: projectUrl }, { onConflict: 'team_id' });
      setMediaFiles([]);
      setSuccess(`✅ ${newUrls.length} file(s) uploaded successfully!`);
    } catch (err) {
      setError('Upload failed: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const downloadQR = () => {
    const canvas = document.getElementById('project-qr');
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `prakalp-qr-${team.project_title}.png`;
    a.click();
  };

  return (
    <div style={wrap}>
      {loading && <p style={muted}>Loading...</p>}
      {!loading && error && !team && <div style={errorBox}>⚠️ {error}</div>}
      {!loading && team && (
        <>
          <div style={card}>
            <div style={eyebrow}><span style={eyebrowLine} />Prakalp 2025</div>
            <h1 style={pageTitle}>{team.project_title}</h1>
            <span style={tagCat}>{team.subject_category}</span>
            <span style={{ ...tagCat, marginLeft: '8px', background: 'rgba(45,106,79,0.1)', color: '#2d6a4f', border: '1px solid rgba(45,106,79,0.2)' }}>
              🏆 100% Complete
            </span>
          </div>

          <div style={card}>
            <h2 style={sectionTitle}>Upload Photos & Videos</h2>
            <p style={muted}>Upload photos or videos of your project showcase. These will be visible to anyone who scans your QR code.</p>
            {error && <div style={errorBox}>⚠️ {error}</div>}
            {success && <div style={successBox}>{success}</div>}
            <div style={uploadZone} onClick={() => document.getElementById('fileInput').click()}>
              <p style={{ fontSize: '2rem', marginBottom: '8px' }}>📁</p>
              <p style={{ fontWeight: '700', color: '#1a1508', marginBottom: '4px' }}>Click to select files</p>
              <p style={{ fontSize: '0.8rem', color: '#8a7d65' }}>Photos (JPG, PNG) or Videos (MP4) — max 50MB each</p>
              {mediaFiles.length > 0 && (
                <p style={{ marginTop: '8px', color: '#c84b1f', fontWeight: '700' }}>{mediaFiles.length} file(s) selected</p>
              )}
            </div>
            <input id="fileInput" type="file" multiple accept="image/*,video/*" style={{ display: 'none' }}
              onChange={e => setMediaFiles(Array.from(e.target.files))} />
            <button onClick={handleUpload} disabled={uploading || !mediaFiles.length}
              style={{ ...btnSolid, marginTop: '16px', opacity: (!mediaFiles.length || uploading) ? 0.5 : 1 }}>
              {uploading ? 'Uploading...' : '⬆️ Upload Files'}
            </button>
          </div>

          {uploadedUrls.length > 0 && (
            <div style={card}>
              <h2 style={sectionTitle}>Uploaded Media ({uploadedUrls.length} files)</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px,1fr))', gap: '12px' }}>
                {uploadedUrls.map((f, idx) => (
                  <div key={idx} style={mediaThumb}>
                    {f.name.match(/\.(mp4|mov|avi|webm)$/i)
                      ? <video src={f.url} style={mediaEl} controls />
                      : <img src={f.url} alt={f.name} style={mediaEl} />}
                    <p style={{ fontSize: '0.7rem', color: '#8a7d65', marginTop: '6px', wordBreak: 'break-all' }}>
                      {f.name.length > 20 ? f.name.slice(0, 20) + '...' : f.name}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {qrUrl && (
            <div style={{ ...card, textAlign: 'center' }}>
              <h2 style={sectionTitle}>Your Project QR Code</h2>
              <p style={{ ...muted, marginBottom: '20px' }}>Anyone who scans this QR will see your project page with all uploaded photos and videos.</p>
              <div style={{ display: 'inline-block', padding: '20px', background: '#fff', borderRadius: '16px', border: '1.5px solid #ddd5c0', marginBottom: '20px' }}>
                <QRCodeCanvas id="project-qr" value={qrUrl} size={200} bgColor="#ffffff" fgColor="#1a1508" level="H" />
              </div>
              <p style={{ fontSize: '0.75rem', color: '#8a7d65', marginBottom: '20px' }}>{qrUrl}</p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button onClick={downloadQR} style={btnSolid}>⬇️ Download QR Code</button>
                <button onClick={() => window.open(`/project/${team.id}`, '_blank')} style={btnGhost}>👁️ Preview Project Page</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

const wrap = { background: '#f5f0e8', minHeight: '100vh', fontFamily: "'Cabinet Grotesk',sans-serif", color: '#1a1508', padding: '32px 20px' };
const card = { background: '#fff', borderRadius: '16px', border: '1.5px solid #ddd5c0', padding: '24px', marginBottom: '20px', maxWidth: '640px', margin: '0 auto 20px' };
const eyebrow = { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.72rem', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#c84b1f', marginBottom: '8px' };
const eyebrowLine = { display: 'inline-block', width: '18px', height: '2px', background: '#c84b1f' };
const pageTitle = { fontFamily: "'Clash Display',sans-serif", fontSize: '1.6rem', fontWeight: '700', color: '#1a1508', marginBottom: '12px' };
const sectionTitle = { fontFamily: "'Clash Display',sans-serif", fontSize: '1.1rem', fontWeight: '600', color: '#1a1508', marginBottom: '12px' };
const muted = { color: '#8a7d65', fontSize: '0.875rem', marginBottom: '16px' };
const tagCat = { fontSize: '0.68rem', fontWeight: '700', padding: '3px 8px', borderRadius: '5px', background: 'rgba(200,75,31,0.1)', color: '#c84b1f', border: '1px solid rgba(200,75,31,0.2)' };
const uploadZone = { border: '2px dashed #ddd5c0', borderRadius: '12px', padding: '32px', textAlign: 'center', cursor: 'pointer', background: '#faf7f2', transition: 'border-color 0.2s' };
const mediaThumb = { textAlign: 'center' };
const mediaEl = { width: '100%', height: '100px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #ddd5c0' };
const btnSolid = { padding: '11px 24px', background: '#1a1508', color: '#f5f0e8', border: '2px solid #1a1508', borderRadius: '9px', fontFamily: "'Cabinet Grotesk',sans-serif", fontWeight: '700', fontSize: '0.875rem', cursor: 'pointer' };
const btnGhost = { padding: '11px 24px', background: 'transparent', color: '#1a1508', border: '2px solid #ddd5c0', borderRadius: '9px', fontFamily: "'Cabinet Grotesk',sans-serif", fontWeight: '700', fontSize: '0.875rem', cursor: 'pointer' };
const errorBox = { background: 'rgba(200,75,31,0.08)', border: '1px solid rgba(200,75,31,0.3)', borderRadius: '10px', padding: '12px 16px', color: '#c84b1f', marginBottom: '16px', fontSize: '0.875rem' };
const successBox = { background: 'rgba(45,106,79,0.08)', border: '1px solid rgba(45,106,79,0.3)', borderRadius: '10px', padding: '12px 16px', color: '#2d6a4f', marginBottom: '16px', fontSize: '0.875rem' };

export default MediaUpload;