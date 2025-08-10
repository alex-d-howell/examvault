import { useAuth } from 'Frontend/hooks/useAuth';
import { useNavigate } from 'react-router';
import { Button, Icon } from '@vaadin/react-components';
import { useLandingPage } from 'Frontend/hooks/useLandingPage';
import { usePageMeta } from 'Frontend/hooks/usePageMeta';
import './landing.css';

export default function RootView() {
    const { authenticated, authInitialized, loading } = useAuth();
    const navigate = useNavigate();

    usePageMeta({ title: 'Welcome', description: 'Access thousands of practice exams' });

    const { shouldShowLoading, shouldShowLanding } = useLandingPage({ authenticated, authInitialized, loading });

    // Loading state
    if (shouldShowLoading) {
        return <LoadingSpinner message="Loading Exam Vault..." />;
    }

    // Landing page for anonymous users only
    if (shouldShowLanding) {
        return (
            <LandingPage
                onBrowseExams={() => navigate('/exams')}
                onSignIn={() => navigate('/login')}
            />
        );
    }

    return null;
}

const LoadingSpinner = ({ message }: { message: string }) => (
    <div className='loading-spinner-container'>
        <div className='loading-spinner'></div>
        <p className='message-color'>{message}</p>
    </div>
);

const LandingPage = ({ onBrowseExams, onSignIn }: {
    onBrowseExams: () => void;
    onSignIn: () => void;
}) => (
    <div
        data-testid="landing-page"
        className='landing-page-container'
    >
        <div className='landing-page'>
            <h1 className='landing-page-title'>
                Welcome to <span>Exam Vault</span>
            </h1>

            <p className='landing-page-subheading'>
                Access thousands of practice exams, test your knowledge, and track your progress.
                No account required to get started!
            </p>

            <div className='landing-page-call-to-action-container'>
                <Button
                    onClick={onBrowseExams}
                    theme="primary large"
                >
                    <Icon icon="vaadin:book" />
                    Browse Exams
                </Button>

                <Button
                    onClick={onSignIn}
                    theme='secondary large'
                >
                    <Icon icon="vaadin:sign-in" />
                    Sign In with Google
                </Button>
            </div>

            <FeatureCards />

        </div>

        {/* Sign In Benefits */}
        <SignInBenefits onSignIn={onSignIn} />
    </div>
);

const FeatureCards = () => (
    <div
        data-testid="feature-cards"
        className='feature-cards-container'
    >
        {[
            {
                icon: 'vaadin:book',
                title: 'Browse Freely',
                description: 'Explore our exam library without creating an account. Find the perfect practice test for your needs.',
                color: '#3b82f6',
                bgColor: '#dbeafe'
            },
            {
                icon: 'vaadin:play-circle',
                title: 'Take Practice Tests',
                description: 'Jump right into practice exams. No registration barriers between you and your learning goals.',
                color: '#16a34a',
                bgColor: '#dcfce7'
            },
            {
                icon: 'vaadin:chart-line',
                title: 'Track Progress',
                description: 'Sign in to save your progress, create custom exams, and access personalized features.',
                color: '#9333ea',
                bgColor: '#e9d5ff'
            }
        ].map((feature, index) => (
            <FeatureCard key={index} {...feature} />
        ))}
    </div>
);

const FeatureCard = ({ icon, title, description, color, bgColor }: {
    icon: string;
    title: string;
    description: string;
    color: string;
    bgColor: string;
}) => (
    <div
        data-testid="feature-card"
        className='feature-card-container'
    >
        <div style={{
            backgroundColor: bgColor
        }} className='feature-card-icon'>
            <Icon icon={icon} style={{ color }} />
        </div>
        <h3>
            {title}
        </h3>
        <p className='message-color'>
            {description}
        </p>
    </div>
);

const SignInBenefits = ({ onSignIn }: { onSignIn: () => void }) => (
    <div data-testid="sign-in-benefits" className='sign-in-benefits-container'>
        <h2 className='sign-in-benefits-section-title'>
            Why create an account?
        </h2>

        <div className='sign-in-benefits-content-container'>
            {[
                { icon: 'vaadin:check-circle', title: 'Save Your Results', desc: 'Track your exam scores and see your improvement over time.' },
                { icon: 'vaadin:plus-circle', title: 'Create Custom Exams', desc: 'Build and share your own practice tests with the community.' },
                { icon: 'vaadin:chart', title: 'Personal Dashboard', desc: 'Access your exam history, created tests, and performance analytics.' }
            ].map((feature, index) => (
                <div key={index} className='benefit-feature-container'>
                    <Icon
                        icon={feature.icon}
                        className='feature-icon'
                    />
                    <div>
                        <h4 className='feature-title'>
                            {feature.title}
                        </h4>
                        <p className='message-color'>{feature.desc}</p>
                    </div>
                </div>
            ))}
        </div>

        <Button
            onClick={onSignIn}
            theme="primary large"
            className='get-started'
        >
            <Icon icon="vaadin:sign-in" />
            Get Started - It's Free!
        </Button>

    </div>
);