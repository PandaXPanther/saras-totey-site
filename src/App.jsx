import React from 'react';
import Nav from './components/Nav.jsx';
import AudioControl from './components/AudioControl.jsx';
import ScrollWorld from './components/ScrollWorld.jsx';
import ProjectPage from './components/ProjectPage.jsx';

export default function App() {
  const path = typeof window === 'undefined' ? '/' : (window.location.pathname.replace(/\/$/, '') || '/');
  return (
    <>
      <Nav />
      <AudioControl />
      {path === '/' ? <ScrollWorld /> : <ProjectPage slug={path.slice(1)} />}
    </>
  );
}
