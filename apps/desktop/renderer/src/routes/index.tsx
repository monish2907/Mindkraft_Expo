import { useState } from 'react';
import FaceLogin from '../features/auth/FaceLogin';
import FaceRegister from '../features/auth/FaceRegister';

type AuthView = 'home' | 'register' | 'login';

export default function AppRoutes() {
	const userId = 'student-001';
	const [view, setView] = useState<AuthView>('home');

	if (view === 'register') {
		return (
			<main className="page auth-workflow-page">
				<header className="workflow-header">
					<button type="button" className="back-link" onClick={() => setView('home')}>
						← Back to Student Login
					</button>
					<h1>Face Registration</h1>
				</header>
				<FaceRegister userId={userId} />
			</main>
		);
	}

	if (view === 'login') {
		return (
			<main className="page auth-workflow-page">
				<header className="workflow-header">
					<button type="button" className="back-link" onClick={() => setView('home')}>
						← Back to Student Login
					</button>
					<h1>Face Authentication</h1>
				</header>
				<FaceLogin userId={userId} />
			</main>
		);
	}

	return (
		<main className="page auth-landing-page">
			<section className="auth-landing-card">
				<p className="landing-back">← Student Portal</p>
				<div className="landing-avatar" aria-hidden="true">
					S
				</div>
				<h1>Student Login</h1>
				<p className="landing-subtitle">Use biometric verification to continue</p>

				<div className="landing-actions">
					<button type="button" className="landing-button landing-button-secondary" onClick={() => setView('register')}>
						Face Registration
					</button>
					<button type="button" className="landing-button landing-button-primary" onClick={() => setView('login')}>
						Face Authentication
					</button>
				</div>
			</section>
		</main>
	);
}
