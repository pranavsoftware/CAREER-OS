import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Cpu, Briefcase, Sparkles,
  ArrowRight, ShieldCheck, Target,
  ArrowLeft, Menu, X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function About() {
  const { isAuthenticated, user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  const dashboardRoute =
    user?.role === 'student' ? '/student/dashboard' :
    user?.role === 'university' ? '/university/dashboard' :
    user?.role === 'company' ? '/company/dashboard' : '/login';

  const leaders = [
    {
      name: 'DWARAKADHISH PATIL',
      role: 'Founder & CEO',
      photoPosition: 'Center in leadership portrait',
      tagline: 'Strategic Vision, Product Strategy & Institutional Growth',
      bio: 'Visionary founder steering the mission, strategy, and nationwide expansion of CAREER-OS. Dwarakadhish is dedicated to solving the deep-rooted friction in campus recruitment, transforming disconnected placement workflows into an intelligent, institutional-grade career operating system.',
      specialties: ['Product Strategy', 'Institutional Partnerships', 'Ecosystem Scaling', 'Strategic Leadership'],
      accentColor: '#4F46E5',
      lightBg: '#EEF2FF',
    },
    {
      name: 'Pranav Rayban',
      role: 'Chief Technology Officer (CTO)',
      photoPosition: 'Left in leadership portrait',
      tagline: 'Core Architecture, AI Engineering & Distributed Infrastructure',
      bio: 'Deep-tech architect spearheading the full-stack engineering, AI models, and infrastructure of CAREER-OS. Pranav builds the deterministic ATS evaluation engine, real-time audio/video AI mock interview pipelines, resilient database layers, and high-performance cloud architecture.',
      specialties: ['AI & Speech Pipelines', 'Deterministic ATS Engines', 'Distributed PostgreSQL', 'Full-Stack Architecture'],
      accentColor: '#7C3AED',
      lightBg: '#F5F3FF',
    },
    {
      name: 'Kshitij Jamma',
      role: 'Chief Operating Officer (COO)',
      photoPosition: 'Right in leadership portrait',
      tagline: 'Operational Execution, Recruiter Alliances & Campus Deployments',
      bio: 'Operations leader directing university onboarding, corporate relations, and end-to-end recruitment drive execution. Kshitij ensures seamless campus-to-corporate pipelines, streamlined placement cell coordination, and frictionless hiring experiences for top enterprises.',
      specialties: ['Campus Drive Operations', 'Corporate Relations', 'Institutional Onboarding', 'Execution Excellence'],
      accentColor: '#0284C7',
      lightBg: '#F0F9FF',
    },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#F8F9FD', color: '#111827', fontFamily: 'var(--font-sans)' }}>

      {/* ─── HEADER ─── */}
      <header style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)', borderBottom: '1px solid #EBEFFA' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto', padding: '0 20px', height: 68, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          
          {/* Logo */}
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <span style={{ fontSize: 20, fontWeight: 800, color: '#4F46E5', letterSpacing: '-0.04em' }}>CAREER-OS</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="desktop-flex" style={{ alignItems: 'center', gap: 28, flex: 1, justifyContent: 'center' }}>
            <Link to="/" style={{ fontSize: 14, fontWeight: 500, color: '#4B5563', textDecoration: 'none' }}>Home</Link>
            <a href="/#about" style={{ fontSize: 14, fontWeight: 500, color: '#4B5563', textDecoration: 'none' }}>Platform</a>
            <a href="/#capabilities" style={{ fontSize: 14, fontWeight: 500, color: '#4B5563', textDecoration: 'none' }}>Capabilities</a>
            <a href="#team" style={{ fontSize: 14, fontWeight: 600, color: '#4F46E5', textDecoration: 'none' }}>Leadership</a>
            <a href="#mission" style={{ fontSize: 14, fontWeight: 500, color: '#4B5563', textDecoration: 'none' }}>Mission</a>
            <a href="/#contact" style={{ fontSize: 14, fontWeight: 500, color: '#4B5563', textDecoration: 'none' }}>Contact</a>
          </nav>

          {/* Right side */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <Link
              to={isAuthenticated ? dashboardRoute : '/login'}
              className="desktop-inline-flex"
              style={{
                padding: '9px 22px',
                borderRadius: 9999,
                background: '#4F46E5',
                color: '#fff',
                fontSize: 13,
                fontWeight: 600,
                textDecoration: 'none',
                boxShadow: '0 4px 12px rgba(79,70,229,0.25)',
                alignItems: 'center',
                whiteSpace: 'nowrap'
              }}
            >
              {isAuthenticated ? 'Dashboard' : 'Launch Portal'}
            </Link>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="mobile-only"
              aria-label="Open menu"
              style={{ background: '#F3F4F6', border: 'none', borderRadius: 8, padding: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Menu size={22} color="#374151" />
            </button>
          </div>
        </div>
      </header>

      {/* ─── MOBILE RIGHT DRAWER ─── */}
      {mobileMenuOpen && (
        <>
          <div
            onClick={() => setMobileMenuOpen(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(17,24,39,0.5)', backdropFilter: 'blur(4px)', zIndex: 9998 }}
          />
          <div
            className="animate-slide-in-right"
            style={{
              position: 'fixed', top: 0, right: 0,
              width: 300, maxWidth: '88vw', height: '100vh',
              background: '#fff',
              boxShadow: '-8px 0 40px rgba(0,0,0,0.18)',
              zIndex: 9999,
              display: 'flex', flexDirection: 'column',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 20px 16px', borderBottom: '1px solid #F3F4F6' }}>
              <span style={{ fontSize: 18, fontWeight: 800, color: '#4F46E5', letterSpacing: '-0.04em' }}>CAREER-OS</span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                style={{ background: '#F3F4F6', border: 'none', borderRadius: 8, padding: '7px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              >
                <X size={20} color="#374151" />
              </button>
            </div>

            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Link to="/" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: 15, fontWeight: 500, color: '#374151', textDecoration: 'none' }}>Home</Link>
              <a href="/#about" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: 15, fontWeight: 500, color: '#374151', textDecoration: 'none' }}>Platform</a>
              <a href="/#capabilities" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: 15, fontWeight: 500, color: '#374151', textDecoration: 'none' }}>Capabilities</a>
              <a href="#team" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: 15, fontWeight: 600, color: '#4F46E5', textDecoration: 'none' }}>Leadership Team</a>
              <a href="#mission" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: 15, fontWeight: 500, color: '#374151', textDecoration: 'none' }}>Our Mission</a>
              <a href="/#contact" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: 15, fontWeight: 500, color: '#374151', textDecoration: 'none' }}>Contact Placement Cell</a>
              
              <div style={{ borderTop: '1px solid #F3F4F6', paddingTop: 16, marginTop: 8 }}>
                <Link
                  to={isAuthenticated ? dashboardRoute : '/login'}
                  onClick={() => setMobileMenuOpen(false)}
                  style={{ display: 'block', textAlign: 'center', padding: '12px', borderRadius: 10, background: '#4F46E5', color: '#fff', fontWeight: 600, textDecoration: 'none' }}
                >
                  {isAuthenticated ? 'Go to Dashboard' : 'Launch Portal'}
                </Link>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ─── HERO SECTION ─── */}
      <section style={{ maxWidth: 1140, margin: '0 auto', padding: '56px 20px 40px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 9999, background: '#EEF2FF', border: '1px solid #E0E7FF', marginBottom: 20 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#4F46E5', display: 'inline-block' }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: '#4338CA', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            The Leadership Team
          </span>
        </div>

        <h1 style={{ fontSize: 'clamp(32px, 5.5vw, 52px)', fontWeight: 800, color: '#111827', letterSpacing: '-0.04em', lineHeight: 1.15, margin: '0 0 18px' }}>
          Meet the Minds Behind <span style={{ color: '#4F46E5' }}>CAREER-OS</span>.
        </h1>

        <p style={{ fontSize: 'clamp(15px, 2vw, 18px)', color: '#4B5563', maxWidth: 740, margin: '0 auto 40px', lineHeight: 1.65 }}>
          We are building the intelligent, tri-party campus recruitment operating system that connects students, universities, and top-tier recruiters with zero friction and 100% verified trust.
        </p>

        {/* ─── GROUP PHOTO SHOWCASE ─── */}
        <div style={{ maxWidth: 860, margin: '0 auto', position: 'relative' }}>
          <div
            style={{
              position: 'relative',
              borderRadius: 24,
              overflow: 'hidden',
              background: '#0F172A',
              border: '1px solid #E2E8F0',
              boxShadow: '0 25px 60px -15px rgba(79, 70, 229, 0.22), 0 10px 30px rgba(0,0,0,0.08)',
            }}
          >
            <img
              src="/team_founders.jpeg"
              alt="CAREER-OS Leadership Team - Dwarakadhish Patil, Pranav Rayban, Kshitij Jamma"
              style={{
                width: '100%',
                maxHeight: 560,
                objectFit: 'cover',
                objectPosition: 'center 20%',
                display: 'block',
              }}
            />
            
            {/* Bottom Gradient Overlay */}
            <div
              style={{
                position: 'absolute',
                inset: 'auto 0 0 0',
                background: 'linear-gradient(to top, rgba(15,23,42,0.92) 0%, rgba(15,23,42,0.6) 60%, transparent 100%)',
                padding: '36px 24px 24px',
                color: '#fff',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
              }}
            >
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 9999, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', fontSize: 11, fontWeight: 700, color: '#E0E7FF', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                <Sparkles size={13} color="#A5B4FC" /> Founding Executive Board
              </div>
              <h2 style={{ fontSize: 'clamp(18px, 3vw, 24px)', fontWeight: 700, margin: '0 0 6px', color: '#fff' }}>
                Pranav Rayban (CTO) • Dwarakadhish Patil (Founder) • Kshitij Jamma (COO)
              </h2>
              <p style={{ fontSize: 13, color: '#CBD5E1', margin: 0, maxWidth: 600 }}>
                United by the conviction that institutional placement deserves a state-of-the-art, deterministic AI operating system.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── LEADERSHIP PROFILES ─── */}
      <section id="team" style={{ maxWidth: 1140, margin: '0 auto', padding: '40px 20px 64px' }}>
        <div style={{ textAlign: 'center', marginBottom: 44 }}>
          <h2 style={{ fontSize: 'clamp(26px, 4vw, 36px)', fontWeight: 800, color: '#111827', letterSpacing: '-0.03em', margin: '0 0 12px' }}>
            Executive Leadership.
          </h2>
          <p style={{ fontSize: 15, color: '#6B7280', margin: 0, maxWidth: 560, marginLeft: 'auto', marginRight: 'auto' }}>
            Meet the leaders driving strategy, artificial intelligence infrastructure, and nationwide campus operations.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: 24 }}>
          {leaders.map((leader) => (
            <div
              key={leader.name}
              className="card-hover"
              style={{
                background: '#fff',
                borderRadius: 22,
                border: '1px solid #EBEFFA',
                boxShadow: '0 4px 20px -2px rgba(0,0,0,0.05)',
                padding: '30px 26px',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Top Accent Bar */}
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: leader.accentColor }} />

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <span
                  style={{
                    padding: '4px 12px',
                    borderRadius: 9999,
                    background: leader.lightBg,
                    color: leader.accentColor,
                    fontSize: 12,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  {leader.role}
                </span>
                <span style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 500 }}>
                  {leader.photoPosition}
                </span>
              </div>

              <h3 style={{ fontSize: 20, fontWeight: 800, color: '#111827', margin: '0 0 6px', letterSpacing: '-0.02em' }}>
                {leader.name}
              </h3>

              <div style={{ fontSize: 13, fontWeight: 600, color: leader.accentColor, marginBottom: 14 }}>
                {leader.tagline}
              </div>

              <p style={{ fontSize: 13, color: '#4B5563', lineHeight: 1.65, margin: '0 0 20px', flex: 1 }}>
                {leader.bio}
              </p>

              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                  Key Areas of Focus
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {leader.specialties.map((spec) => (
                    <span
                      key={spec}
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: '#374151',
                        background: '#F3F4F6',
                        padding: '4px 10px',
                        borderRadius: 6,
                        border: '1px solid #E5E7EB',
                      }}
                    >
                      {spec}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── MISSION & PILLARS ─── */}
      <section id="mission" style={{ background: '#fff', borderTop: '1px solid #EBEFFA', borderBottom: '1px solid #EBEFFA', padding: '64px 20px' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto' }}>
          
          <div style={{ textAlign: 'center', marginBottom: 44 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 14px', borderRadius: 9999, background: '#EEF2FF', fontSize: 12, fontWeight: 700, color: '#4F46E5', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
              Our Foundational Beliefs
            </div>
            <h2 style={{ fontSize: 'clamp(26px, 4vw, 36px)', fontWeight: 800, color: '#111827', letterSpacing: '-0.03em', margin: '0 0 12px' }}>
              Why We Built CAREER-OS.
            </h2>
            <p style={{ fontSize: 15, color: '#6B7280', margin: 0, maxWidth: 640, marginLeft: 'auto', marginRight: 'auto' }}>
              Campus recruitment in top universities handles thousands of students, hundreds of hiring partners, and millions of data points — yet relies on scattered forms, unverified resumes, and manual spreadsheets.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 250px), 1fr))', gap: 20 }}>
            {[
              {
                icon: ShieldCheck,
                title: 'Deterministic Trust',
                desc: 'Every student credential, CGPA, and certificate is officially verified by placement officers before companies shortlist, eliminating fraudulent resumes.',
              },
              {
                icon: Cpu,
                title: 'High-Velocity AI Systems',
                desc: 'From deterministic ATS keyword scoring to real-time speech AI interviews, students practice with objective feedback rather than random guesswork.',
              },
              {
                icon: Briefcase,
                title: 'Automated Recruiter Pipelines',
                desc: 'Hiring criteria from recruiter emails are automatically extracted into a live Kanban pipeline, syncing eligibility filters across thousands of applicants.',
              },
              {
                icon: Target,
                title: 'Skill Gap Transparency',
                desc: 'Students receive real-time match scores against active job descriptions, alongside targeted roadmap recommendations to bridge weak areas immediately.',
              },
            ].map((pillar) => {
              const Icon = pillar.icon;
              return (
                <div
                  key={pillar.title}
                  style={{
                    background: '#F8F9FD',
                    borderRadius: 18,
                    padding: '24px 20px',
                    border: '1px solid #EBEFFA',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <div style={{ width: 42, height: 42, borderRadius: 12, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                    <Icon size={20} color="#4F46E5" />
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: '0 0 8px' }}>{pillar.title}</h3>
                  <p style={{ fontSize: 13, color: '#4B5563', lineHeight: 1.6, margin: 0 }}>{pillar.desc}</p>
                </div>
              );
            })}
          </div>

          {/* Stats Bar */}
          <div style={{ marginTop: 40, padding: '30px 24px', background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 100%)', borderRadius: 20, color: '#fff', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: 24, textAlign: 'center' }}>
            <div>
              <div style={{ fontSize: 32, fontWeight: 800, color: '#818CF8' }}>100%</div>
              <div style={{ fontSize: 12, color: '#C7D2FE', fontWeight: 500, marginTop: 4 }}>Verified Academic Data</div>
            </div>
            <div>
              <div style={{ fontSize: 32, fontWeight: 800, color: '#818CF8' }}>40+</div>
              <div style={{ fontSize: 12, color: '#C7D2FE', fontWeight: 500, marginTop: 4 }}>Adaptive Interview Modules</div>
            </div>
            <div>
              <div style={{ fontSize: 32, fontWeight: 800, color: '#818CF8' }}>&lt; 1.2s</div>
              <div style={{ fontSize: 12, color: '#C7D2FE', fontWeight: 500, marginTop: 4 }}>Deterministic ATS Engine</div>
            </div>
            <div>
              <div style={{ fontSize: 32, fontWeight: 800, color: '#818CF8' }}>3-in-1</div>
              <div style={{ fontSize: 12, color: '#C7D2FE', fontWeight: 500, marginTop: 4 }}>Student • Uni • Recruiter Portal</div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA BANNER ─── */}
      <section style={{ maxWidth: 1140, margin: '0 auto', padding: '64px 20px' }}>
        <div
          style={{
            background: 'linear-gradient(135deg, #4F46E5 0%, #4338CA 100%)',
            borderRadius: 24,
            padding: '48px 32px',
            color: '#fff',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            boxShadow: '0 16px 40px -10px rgba(79,70,229,0.4)',
          }}
        >
          <h2 style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 12px' }}>
            Ready to Experience Modern Placement?
          </h2>
          <p style={{ fontSize: 15, color: '#E0E7FF', maxWidth: 540, margin: '0 0 28px', lineHeight: 1.6 }}>
            Whether you are a student preparing for upcoming drives, a university placement officer, or an enterprise recruiter — CAREER-OS is built for you.
          </p>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link
              to={isAuthenticated ? dashboardRoute : '/login'}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '12px 28px',
                borderRadius: 9999,
                background: '#fff',
                color: '#4F46E5',
                fontSize: 14,
                fontWeight: 700,
                textDecoration: 'none',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              }}
            >
              {isAuthenticated ? 'Open Dashboard' : 'Launch Portal'} <ArrowRight size={15} />
            </Link>
            <Link
              to="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '12px 24px',
                borderRadius: 9999,
                background: 'rgba(255,255,255,0.15)',
                color: '#fff',
                fontSize: 14,
                fontWeight: 600,
                textDecoration: 'none',
                border: '1px solid rgba(255,255,255,0.3)',
              }}
            >
              <ArrowLeft size={15} /> Back to Home
            </Link>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer style={{ borderTop: '1px solid #E5E7EB', background: '#fff', padding: '28px 20px' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 16, fontSize: 13, color: '#6B7280' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 800, color: '#4F46E5', fontSize: 15 }}>CAREER-OS</span>
            <span>• Campus Placement Operating System</span>
          </div>
          <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
            <Link to="/" style={{ color: '#4B5563', textDecoration: 'none' }}>Home</Link>
            <Link to="/about" style={{ color: '#4F46E5', fontWeight: 600, textDecoration: 'none' }}>About Us</Link>
            <a href="/#about" style={{ color: '#4B5563', textDecoration: 'none' }}>Platform</a>
            <a href="/#capabilities" style={{ color: '#4B5563', textDecoration: 'none' }}>Capabilities</a>
            <Link to="/login" style={{ color: '#4B5563', textDecoration: 'none' }}>Sign In</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
