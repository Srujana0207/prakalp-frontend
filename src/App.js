import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import TeamRegister from './TeamRegister';
import ProgressUpdate from './ProgressUpdate';
import MediaUpload from './MediaUpload';
import ProjectPage from './ProjectPage';
import StudentProfile from './StudentProfile';
import Navbar from './Navbar';

function Home() {
  return (
    <iframe
      src="/prakalp-modified (4).html"
      title="Prakalp Frontend"
      width="100%"
      style={{ border: "none", height: "100vh" }}
    />
  );
}

function ProtectedRoute({ children }) {
  const user = JSON.parse(localStorage.getItem('prakalp_student') || 'null');
  if (!user) return <Navigate to="/" replace />;
  return (
    <>
      <Navbar />
      {children}
    </>
  );
}

function FirstYearOnly({ children }) {
  const user = JSON.parse(localStorage.getItem('prakalp_student') || 'null');
  if (!user) return <Navigate to="/" replace />;
  if (user.year !== 1) return (
    <>
      <Navbar />
      <div style={{ padding:'40px', textAlign:'center', color:'#c84b1f', background:'#f5f0e8', minHeight:'100vh', fontFamily:"'Cabinet Grotesk',sans-serif" }}>
        ⚠️ Only 1st year students can access this page.
      </div>
    </>
  );
  return (
    <>
      <Navbar />
      {children}
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/register-team" element={<FirstYearOnly><TeamRegister /></FirstYearOnly>} />
        <Route path="/progress" element={<ProtectedRoute><ProgressUpdate /></ProtectedRoute>} />
        <Route path="/upload-media" element={<ProtectedRoute><MediaUpload /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><StudentProfile /></ProtectedRoute>} />
        <Route path="/project/:teamId" element={<ProjectPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;