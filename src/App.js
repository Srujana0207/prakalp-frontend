import { BrowserRouter, Routes, Route } from 'react-router-dom';
import TeamRegister from './TeamRegister';
import ProgressUpdate from './ProgressUpdate';
import MediaUpload from './MediaUpload';
import ProjectPage from './ProjectPage';

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

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/register-team" element={<TeamRegister />} />
        <Route path="/progress" element={<ProgressUpdate />} />
        <Route path="/upload-media" element={<MediaUpload />} />
        <Route path="/project/:teamId" element={<ProjectPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;