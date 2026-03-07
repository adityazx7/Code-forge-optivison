'use client';

import Link from 'next/link';
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs';
import { Zap, Brain, BarChart3, AlertTriangle, Box, TrendingUp, Shield, Users, Briefcase, GraduationCap, ArrowRight, Activity, Layers, Database, Cpu } from 'lucide-react';
import ThreeBackground from '@/components/ThreeBackground';

export default function LandingPage() {
  const features = [
    { icon: Brain, color: 'cyan', title: 'AI Anomaly Detection', desc: 'Isolation Forest ML model trained on 9 feature dimensions scans 147K+ data points to flag unusual options activity in real-time.' },
    { icon: Box, color: 'purple', title: '3D Volatility Surface', desc: 'Interactive 3D plots mapping IV across strikes and time-to-expiry. Rotate, zoom, and explore volatility patterns like a pro.' },
    { icon: BarChart3, color: 'green', title: 'Smart Options Chain', desc: 'Strike-wise OI and volume breakdown with automated Max Pain calculation — see where the market makers want NIFTY to expire.' },
    { icon: Activity, color: 'orange', title: 'PCR & Volume Flow', desc: 'Track Put-Call Ratio trends and volume flow across strikes. Identify bullish/bearish sentiment shifts as they happen.' },
    { icon: Layers, color: 'blue', title: 'OI Heatmaps', desc: 'Industry-grade heatmaps (yellow-orange-red) showing OI concentration across strikes and dates — spot support/resistance zones instantly.' },
    { icon: Cpu, color: 'red', title: 'K-Means Clustering', desc: 'AI groups 101 strike prices into behavioral clusters — high-activity zones, bullish regions, bearish clusters, and dead zones.' },
  ];

  const usecases = [
    { icon: TrendingUp, title: 'Options Traders', desc: 'Spot unusual OI buildup, track smart money flow, and identify high-probability trade setups with AI-backed signals.' },
    { icon: Briefcase, title: 'Hedge Fund Analysts', desc: 'Detect institutional positioning through anomaly alerts. Monitor cross-strike correlations and sector rotation patterns.' },
    { icon: Shield, title: 'Risk Managers', desc: 'Assess portfolio risk through volatility surface analysis. Get early warnings of market stress via anomaly detection.' },
    { icon: GraduationCap, title: 'Finance Students', desc: 'Learn options Greeks, PCR analysis, and market microstructure through interactive visualizations and real market data.' },
  ];

  const techStack = [
    'Next.js', 'React 19', 'Three.js', 'Plotly.js', 'FastAPI', 'Python', 'Pandas', 'NumPy',
    'Scikit-learn', 'Isolation Forest', 'K-Means', 'Docker', 'GitHub Actions', 'Clerk Auth',
  ];

  return (
    <div className="landing">
      <ThreeBackground />

      {/* Navigation */}
      <nav className="landing-nav">
        <Link href="/" className="landing-nav-logo">
          <div className="icon-box"><Zap /></div>
          <span>OptiVision AI</span>
        </Link>
        <div className="landing-nav-actions">
          <SignedOut>
            <SignInButton mode="modal">
              <button className="btn btn-outline">Sign In</button>
            </SignInButton>
            <Link href="/dashboard" className="btn btn-primary">
              Launch Dashboard <ArrowRight size={16} />
            </Link>
          </SignedOut>
          <SignedIn>
            <Link href="/dashboard" className="btn btn-primary">
              Dashboard <ArrowRight size={16} />
            </Link>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-badge">
            <Zap size={14} />
            AI-Powered FOSS Analytics Platform
          </div>
          <h1>
            Turn Options Data<br />
            Into <span className="gradient-text">Market Intelligence</span>
          </h1>
          <p>
            OptiVision AI transforms 147K+ NIFTY options records into actionable insights
            using machine learning anomaly detection, 3D volatility surfaces, and
            interactive analytics dashboards — built entirely with FOSS.
          </p>
          <div className="hero-cta">
            <SignedOut>
              <SignInButton mode="modal">
                <button className="btn btn-primary">
                  Get Started Free <ArrowRight size={16} />
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <Link href="/dashboard" className="btn btn-primary">
                Open Dashboard <ArrowRight size={16} />
              </Link>
            </SignedIn>
            <a href="https://github.com/HarshadPanchal12/codeforge_optiVisionAI" target="_blank" rel="noreferrer" className="btn btn-outline">
              <Database size={16} /> View Source
            </a>
          </div>
          <div className="hero-stats">
            <div className="hero-stat">
              <div className="hero-stat-value">147K+</div>
              <div className="hero-stat-label">Data Points Analyzed</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-value">7,353</div>
              <div className="hero-stat-label">Anomalies Detected</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-value">101</div>
              <div className="hero-stat-label">Strike Prices Tracked</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-value">13</div>
              <div className="hero-stat-label">API Endpoints</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features-section">
        <div className="section-header">
          <h2>Powerful Analytics Suite</h2>
          <p>Everything you need to decode the derivatives market — powered by AI and open-source tools.</p>
        </div>
        <div className="features-grid">
          {features.map((f, i) => (
            <div key={i} className="feature-card">
              <div className={`feature-icon ${f.color}`}><f.icon /></div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Use Cases */}
      <section className="usecases-section">
        <div className="section-header">
          <h2>Who Should Use This</h2>
          <p>Built for anyone who needs to make sense of options market complexity.</p>
        </div>
        <div className="usecase-grid">
          {usecases.map((u, i) => (
            <div key={i} className="usecase-card">
              <div className="usecase-icon"><u.icon /></div>
              <h3>{u.title}</h3>
              <p>{u.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Tech Stack */}
      <section className="tech-section">
        <div className="section-header">
          <h2>Built With FOSS</h2>
          <p>14 open-source technologies powering every layer of the stack.</p>
        </div>
        <div className="tech-grid">
          {techStack.map((t, i) => (
            <span key={i} className="tech-badge">{t}</span>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="cta-box">
          <h2>Ready to Decode the Market?</h2>
          <p>Sign in to access AI-powered dashboards, 3D volatility surfaces, and real-time anomaly detection.</p>
          <SignedOut>
            <SignInButton mode="modal">
              <button className="btn btn-primary">
                Launch OptiVision AI <ArrowRight size={16} />
              </button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <Link href="/dashboard" className="btn btn-primary">
              Go to Dashboard <ArrowRight size={16} />
            </Link>
          </SignedIn>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        Built with FOSS by <a href="https://github.com/HarshadPanchal12/codeforge_optiVisionAI" target="_blank" rel="noreferrer">Team Antigravity</a> &middot; CodeForge Hackathon 2026
      </footer>
    </div>
  );
}
