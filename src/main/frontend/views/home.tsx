import './home.css';

export default function HomeView() {
    return (<div className="home-centered-container">
        <div className="welcome-card">
            <h2 className="welcome-title">Welcome to Exam Vault!</h2>
            <p className="welcome-desc">Browse and attempt exams created by other users.</p>
        </div>
        <div className="gallery m-l">
        <div className="gallery-item">
            <h3 className="gallery-title">Attempt Exams</h3>
            <p className="gallery-desc">Test your knowledge with various exams.</p>
        </div>
        <div className="gallery-item">
            <h3 className="gallery-title">Create your own exams!</h3>
            <p className="gallery-desc">Share your knowledge with the community.</p>
        </div>
        </div>
        {/* Stylish Ultimate Trivia Exam Card */}
        <div className="ultimate-trivia-card m-l">
            <h3 className="ultimate-title">Ultimate Trivia Exam</h3>
            <p className="ultimate-desc">Test your knowledge with our ULTIMATE trivia exam. Challenge yourself with a variety of fun and tricky questions!</p>
            <ul className="ultimate-list">
                <li><b>100</b> questions</li>
                <li>Mixed topics: history, science, pop culture & more</li>
                <li>Timed: 60 minutes</li>
                <li>Post your score & tag us!</li>
            </ul>
            <button className="btn btn-primary mt-m ultimate-btn btn-hover-animate">Start Exam</button>
        </div>
    </div>);
}