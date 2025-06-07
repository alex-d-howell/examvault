import { Outlet, NavLink, useLocation, useNavigate } from 'react-router';
import { ExamService } from "Frontend/generated/endpoints";
//import { Button } from '@vaadin/react-components';
import { useEffect } from 'react';
import Font from 'react-font';
import './layout.css';

export default function MainLayout() {

  /* async function createSampleExams() {
    ExamService.createSampleExams()
  } */

  const navigate = useNavigate();
  const location = useLocation();

  const navRoutes = [
    { path: '/home', label: 'HOME' },
    { path: '/exams', label: 'BROWSE EXAMS' },
    { path: '/exams/create', label: 'CREATE EXAM' }
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
    <div className="main-layout-root">
      <Font family='Montserrat'>
        <header className="main-header">
          <h1 className="main-title">EXAM VAULT</h1>
          <div className="main-header-controls">
            <nav style={{ display: 'flex', gap: '1rem' }}>
              {navRoutes.map(({ path, label }) => (
                <NavLink
                  key={path}
                  to={path}
                  style={
                    currentPath == path
                      ? {
                          textDecoration: 'none',
                          color: '#0A21C0',
                          fontWeight: 'bold',
                          padding: '0.25rem .5rem',
                          borderRadius: '4px',
                          backgroundColor: 'white',
                        }
                      : {
                          textDecoration: 'none',
                          color: 'white',
                          fontWeight: 'normal',
                          padding: '0.25rem .5rem',
                          borderRadius: '4px',
                          backgroundColor: 'transparent',
                        }
                  }
                  className="main-nav-link"
                  onMouseEnter={e => {
                    if (currentPath !== path) {
                      e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.18)';
                      e.currentTarget.style.color = '#ffe066';
                      e.currentTarget.style.boxShadow = '0 2px 8px 0 rgba(99,102,241,0.10)';
                    }
                  }}
                  onMouseLeave={e => {
                    if (currentPath !== path) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = 'white';
                      e.currentTarget.style.boxShadow = '';
                    }
                  }}
                >
                  {label}
                </NavLink>
              ))}
            </nav>
            {/* <Button onClick={createSampleExams} className="main-sample-btn">
              CREATE SAMPLE EXAM
            </Button> */}
          </div>
        </header>
        <main className="main-content"><Outlet /></main>
        <footer className="main-footer">
          <p>© 2025 Exam Vault</p>
          <i>Developed by Alex Howell</i>
        </footer>
      </Font>
    </div>
  );
}
