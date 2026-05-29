import { useState, useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { getUser, getToken } from './auth';

const API = 'https://prakalp-backend-e246.onrender.com/api';

function MediaUpload() {
  const [loading, setLoading] = useState(true);
  const [team, setTeam] = useState(null);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [qrLink, setQrLink] = useState('');
  const [savedQr, setSavedQr] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const loggedInUser = getUser();
    if (!loggedInUser) { window.location.href = '/'; return; }
    const load = async () => {
      setLoading(true);
      try {
        const token = getToken();
        const res = await fetch(`${API}/teams/my`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (!data.success) {
          setError('You are not a team leader.');
        } else if (data.project.progress < 100) {
          setError('You can only upload QR after reaching 100% progress.');
        } else {
          setTeam(data.project);
          if (data.project.showcaseQRUrl) {
            setSavedQr(data.project.showcaseQRUrl);
            setQrLink(data.project.showcaseQRUrl);
          }
        }
      } catch (err) {
        setError('Failed to load team.');
      }
      setLoading(false);
    };
    load();
  }, []);

  const handleSaveQR = async () => {
    if (!qrLink.trim()) { setError('Please enter a link first.'); return; }
    setUploading(true); setError(''); setSuccess('');
    try {
      const token = getToken();
      const res = await fetch(`${API}/teams/qr`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ qrLink: qrLink.trim() })
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.message);
      } else {
        setSavedQr(qrLink.trim());
        setSuccess('✅ QR code saved successfully!');
      }
    } catch (err) {
      setError('Something went wrong: ' + err.message);
    }
    setUploading(false);
  };

  const downloadQR = () => {
    const canvas = document.getElementById('project-qr');
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `prakalp-qr-${team.title}.png`;
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
            <h1 style={pageTitle}>{team.title}</h1>
            <span style={tagCat}>{team.subject}</span>
            <span style={{ ...tagCat, marginLeft: '8px', background: 'rgba(45,106,79,0.1)', color: '#2d6a4f', border: '1px solid rgba(45,106,79,0.2)' }}>
              🏆 100% Complete
            </span>
          </div>

          <div style={card}>
            <h2 style={sectionTitle}>Project QR Code Link</h2>
            <p style={muted}>Enter your Google Drive, YouTube, or project link. We'll generate a QR code from it.</p>
            {error && <div style={errorBox}>⚠️ {error}</div>}
            {success && <div style={successBox}>{success}</div>}
            <input
              type="url"
              placeholder="https://drive.google.com/your-project-link"
              value={qrLink}
              onChange={e => setQrLink(e.target.value)}
              style={input}
            />
            <button onClick={handleSaveQR} disabled={uploading || !qrLink.trim()} style={{ ...btnSolid, opacity: (!qrLink.trim() || uploading) ? 0.5 : 1 }}>
              {uploading ? 'Saving...' : '💾 Save QR Link'}
            </button>
          </div>

          {savedQr && (
            <div style={{ ...card, textAlign: 'center' }}>
              <h2 style={sectionTitle}>Your Project QR Code</h2>
              <p style={{ ...muted, marginBottom: '20px' }}>Anyone who scans this QR will see your project.</p>
              <div style={{ display: 'inline-block', padding: '20px', background: '#fff', borderRadius: '16px', border: '1.5px solid #ddd5c0', marginBottom: '20px' }}>
                <QRCodeCanvas id="project-qr" value={savedQr} size={200} bgColor="#ffffff" fgColor="#1a1508" level="H" />
              </div>
              <p style={{ fontSize: '0.75rem', color: '#8a7d65', marginBottom: '20px' }}>{savedQr}</p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button onClick={downloadQR} style={btnSolid}>⬇️ Download QR Code</button>
                <button onClick={() => window.open(savedQr, '_blank')} style={btnGhost}>👁️ Open Link</button>
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
const input = { width: '100%', padding: '12px', marginBottom: '16px', borderRadius: '8px', border: '1px solid #ddd5c0', background: '#faf7f2', color: '#1a1508', fontSize: '0.9rem', boxSizing: 'border-box' };
const btnSolid = { padding: '11px 24px', background: '#1a1508', color: '#f5f0e8', border: '2px solid #1a1508', borderRadius: '9px', fontWeight: '700', fontSize: '0.875rem', cursor: 'pointer' };
const btnGhost = { padding: '11px 24px', background: 'transparent', color: '#1a1508', border: '2px solid #ddd5c0', borderRadius: '9px', fontWeight: '700', fontSize: '0.875rem', cursor: 'pointer' };
const errorBox = { background: 'rgba(200,75,31,0.08)', border: '1px solid rgba(200,75,31,0.3)', borderRadius: '10px', padding: '12px 16px', color: '#c84b1f', marginBottom: '16px', fontSize: '0.875rem' };
const successBox = { background: 'rgba(45,106,79,0.08)', border: '1px solid rgba(45,106,79,0.3)', borderRadius: '10px', padding: '12px 16px', color: '#2d6a4f', marginBottom: '16px', fontSize: '0.875rem' };

export default MediaUpload;