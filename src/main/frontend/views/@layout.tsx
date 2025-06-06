import { Outlet, NavLink, useLocation, useNavigate } from 'react-router';
import { ExamService } from "Frontend/generated/endpoints";
import { Button, Tabs, Tab } from '@vaadin/react-components';
import { useEffect } from 'react';

export default function MainLayout() {

  async function createSampleExams() {
    ExamService.createSampleExams()
  }

  const navigate = useNavigate();
  const location = useLocation();

  const navRoutes = [
    { path: '/home', label: 'Home' },
    { path: '/exams', label: 'Browse Exams' },
    { path: '/exams/create', label: 'Create Exam' }
  ];

  const currentPath = location.pathname;

  async function rerouteHomePath() {
    if (currentPath === '/') {
      navigate('/home');
    }
  }

  useEffect(() => {
    rerouteHomePath();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <header className='grid grid-rows-2 gap-l pt-l' style={{ height: '10vh', width: '100%', backgroundColor: '#B3B4BD', alignItems: 'center', justifyContent: 'center' }}>
        <h1 className='m-auto' style={{ color: '#141619' }}>Exam Vault</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <nav style={{ display: 'flex', gap: '1rem' }}>
            {navRoutes.map(({ path, label }) => (
              <NavLink
                key={path}
                to={path}
                style={{
                  textDecoration: 'none',
                  color: currentPath == path ? '#0A21C0' : 'black',
                  fontWeight: currentPath == path ? 'bold' : 'normal',
                  padding: '0.5rem 1rem',
                  borderRadius: '4px',
                  backgroundColor: currentPath == path ? 'white' : 'transparent'
                }}
              >
                {label}
              </NavLink>
            ))}
          </nav>
          <Button onClick={createSampleExams} style={{ postition: 'relative', top: '4px', left: '2rem', cursor: 'pointer' }}>
            Create Sample Exam
          </Button>
        </div>
      </header>

      <main style={{ height: '80vh' }}><Outlet /></main>

      <footer
        style={{
          textAlign: 'center',
          backgroundColor: '#f1f1f1',
          height: '10vh',
        }}
      >
        <p>© 2025 Exam Vault</p>
        <i>Developed by Alex Howell</i>
      </footer>
    </div>
  );
}
