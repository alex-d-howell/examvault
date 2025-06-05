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
    { path: '/home', label: 'Home', prefetch: () => import('./home') },
    { path: '/exams', label: 'Browse Exams', prefetch: () => import('./exams/@index') },
    // { path: '/create-exam', label: 'Create Exam' }
  ];

  const currentPath = location.pathname;

  async function rerouteHomePath() {
    if (currentPath === '/') {
      navigate('/home');
    }
  }

  const currentTabIndex = navRoutes.findIndex(r => currentPath.startsWith(r.path));

  useEffect(() => {
    rerouteHomePath();
    if (currentTabIndex >= 0) {
      navRoutes[currentTabIndex].prefetch();
    }
  }, [currentTabIndex]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <header style={{ height: '10vh' }}>
        <h1 className="m-s">Exam Vault</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Tabs
            selected={currentTabIndex}
            onSelectedChanged={(e) => {
              const next = navRoutes[e.detail.value];
              if (next) navigate(next.path);
            }}
          >
            {navRoutes.map(({ label, prefetch }, idx) => (
              <Tab
                key={label}
                onMouseEnter={prefetch}
              >
                {label}
              </Tab>
            ))}
          </Tabs>
          <Button onClick={createSampleExams} style={{ postition: 'relative', top: '4px', left: '2rem', cursor: 'pointer' }}>
            Create Exam
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
