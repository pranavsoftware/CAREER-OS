import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap, FileText, Trophy, MapPin, Clock, Mail, Phone,
  ArrowRight, Menu, X, CheckCircle, BarChart2, Zap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Landing() {
  const { isAuthenticated, user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Lock body scroll when drawer open
  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  const dashboardRoute =
    user?.role === 'student' ? '/student/dashboard' :
    user?.role === 'university' ? '/university/dashboard' :
    user?.role === 'company' ? '/company/dashboard' : '/login';

  return (
    <div style={{ minHeight: '100vh', background: '#F8F9FD', color: '#111827', fontFamily: 'var(--font-sans)' }}>

      {/* ─── HEADER ─── */}
      <header style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)', borderBottom: '1px solid #EBEFFA' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto', padding: '0 20px', height: 68, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>

          {/* Logo */}
          <Link to="/" style={{ textDecoration: 'none', flexShrink: 0 }}>
            <span style={{ fontSize: 20, fontWeight: 800, color: '#4F46E5', letterSpacing: '-0.04em' }}>CAREER-OS</span>
          </Link>

          {/* Desktop Nav — hidden on mobile */}
          <nav className="desktop-flex" style={{ alignItems: 'center', gap: 28, flex: 1, justifyContent: 'center' }}>
            {[['#home','Home'],['#about','Platform'],['#capabilities','Capabilities'],['#experience','Experience'],['#contact','Placement Cell']].map(([href,label]) => (
              <a key={href} href={href} style={{ fontSize: 14, fontWeight: 500, color: '#4B5563', textDecoration: 'none', whiteSpace: 'nowrap' }}>{label}</a>
            ))}
          </nav>

          {/* Right side */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            {/* Desktop CTA button */}
            <Link
              to={isAuthenticated ? dashboardRoute : '/login'}
              className="desktop-inline-flex"
              style={{ padding: '9px 22px', borderRadius: 9999, background: '#4F46E5', color: '#fff', fontSize: 13, fontWeight: 600, textDecoration: 'none', boxShadow: '0 4px 12px rgba(79,70,229,0.25)', alignItems: 'center', whiteSpace: 'nowrap' }}
            >
              {isAuthenticated ? 'Dashboard' : 'Launch Portal'}
            </Link>

            {/* Mobile hamburger — hidden on desktop */}
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

      {/* ─── MOBILE RIGHT DRAWER ─── rendered at root level, outside header stacking context ─── */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setMobileMenuOpen(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(17,24,39,0.5)', backdropFilter: 'blur(4px)', zIndex: 9998 }}
          />
          {/* Drawer */}
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
            {/* Drawer header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 20px 16px', borderBottom: '1px solid #F3F4F6', flexShrink: 0 }}>
              <span style={{ fontSize: 18, fontWeight: 800, color: '#4F46E5', letterSpacing: '-0.04em' }}>CAREER-OS</span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                style={{ background: '#F3F4F6', border: 'none', borderRadius: 8, padding: '7px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                aria-label="Close menu"
              >
                <X size={20} color="#374151" />
              </button>
            </div>

            {/* Nav links */}
            <div style={{ padding: '20px', flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Navigation</div>
              {[['#home','Home'],['#about','Platform'],['#capabilities','Capabilities'],['#experience','Experience'],['#contact','Placement Cell']].map(([href,label]) => (
                <a
                  key={href}
                  href={href}
                  onClick={() => setMobileMenuOpen(false)}
                  style={{ display: 'block', padding: '11px 0', fontSize: 15, fontWeight: 500, color: '#1F2937', textDecoration: 'none', borderBottom: '1px solid #F3F4F6' }}
                >
                  {label}
                </a>
              ))}

              {/* Role links */}
              <div style={{ marginTop: 24 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Role Access</div>
                {[['Student Portal','/login'],['University Admin','/login'],['Company Recruiter','/login']].map(([label,to]) => (
                  <Link
                    key={label}
                    to={to}
                    onClick={() => setMobileMenuOpen(false)}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', marginBottom: 8, borderRadius: 10, background: '#F9FAFB', fontSize: 13, color: '#374151', textDecoration: 'none', border: '1px solid #F3F4F6' }}
                  >
                    <span>{label}</span>
                    <span style={{ color: '#4F46E5', fontWeight: 700 }}>Login →</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Bottom CTA */}
            <div style={{ padding: '16px 20px', borderTop: '1px solid #F3F4F6', flexShrink: 0 }}>
              <Link
                to={isAuthenticated ? dashboardRoute : '/login'}
                onClick={() => setMobileMenuOpen(false)}
                style={{ display: 'block', width: '100%', padding: '13px 20px', borderRadius: 9999, background: '#4F46E5', color: '#fff', fontSize: 14, fontWeight: 600, textAlign: 'center', textDecoration: 'none', boxShadow: '0 4px 14px rgba(79,70,229,0.3)' }}
              >
                {isAuthenticated ? 'Open Dashboard' : 'Launch Platform'}
              </Link>
            </div>
          </div>
        </>
      )}

      {/* ─── HERO ─── */}
      <section id="home" style={{ maxWidth: 1140, margin: '0 auto', padding: '40px 20px 56px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: 36, alignItems: 'center' }}>

          {/* Left text */}
          <div>
            <div style={{ display: 'inline-block', padding: '5px 14px', borderRadius: 9999, background: '#EEF2FF', border: '1px solid #E0E7FF', fontSize: 12, fontWeight: 600, color: '#4F46E5', marginBottom: 18 }}>
              Future-Focused Campus Placement
            </div>
            <h1 style={{ fontSize: 'clamp(30px, 7vw, 56px)', fontWeight: 800, lineHeight: 1.15, color: '#111827', letterSpacing: '-0.03em', margin: '0 0 16px' }}>
              Place <span style={{ color: '#4F46E5' }}>Smarter</span><br />Grow Faster.
            </h1>
            <p style={{ fontSize: 15, color: '#4B5563', lineHeight: 1.65, margin: '0 0 24px', maxWidth: 480 }}>
              A modern campus placement platform with verified student profiles, deterministic ATS scoring, smart recruiter mail filtering, and seamless multi-role synchronization.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link to="/login" style={{ padding: '11px 26px', borderRadius: 9999, background: '#4F46E5', color: '#fff', fontSize: 14, fontWeight: 600, textDecoration: 'none', boxShadow: '0 4px 14px rgba(79,70,229,0.3)', whiteSpace: 'nowrap' }}>
                Launch Portal
              </Link>
              <a href="#capabilities" style={{ padding: '11px 22px', borderRadius: 9999, background: '#fff', border: '1px solid #D1D5DB', color: '#374151', fontSize: 14, fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap' }}>
                Explore Features
              </a>
            </div>

            {/* Mobile stats (visible only on mobile) */}
            <div className="mobile-only" style={{ display: 'flex', gap: 28, marginTop: 24 }}>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#111827' }}>10K+</div>
                <div style={{ fontSize: 11, color: '#6B7280', fontWeight: 500 }}>Students Placed</div>
              </div>
              <div style={{ width: 1, background: '#E5E7EB' }} />
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#4F46E5' }}>96%</div>
                <div style={{ fontSize: 11, color: '#6B7280', fontWeight: 500 }}>Placement Rate</div>
              </div>
            </div>
          </div>

          {/* Right image */}
          <div style={{ position: 'relative' }}>
            <div style={{ borderRadius: 24, overflow: 'hidden', boxShadow: '0 12px 36px -8px rgba(0,0,0,0.12)', aspectRatio: '4/3', width: '100%' }}>
              <img src="/hero_photo.jpg" alt="Students on campus placement platform" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            </div>
            {/* Floating stat card — desktop only */}
            <div
              className="desktop-flex"
              style={{ position: 'absolute', bottom: 20, right: 20, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)', borderRadius: 16, padding: '14px 22px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', alignItems: 'center', gap: 22 }}
            >
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#111827' }}>10K+</div>
                <div style={{ fontSize: 11, fontWeight: 500, color: '#6B7280' }}>Students Placed</div>
              </div>
              <div style={{ width: 1, height: 26, background: '#E5E7EB' }} />
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#4F46E5' }}>96%</div>
                <div style={{ fontSize: 11, fontWeight: 500, color: '#6B7280' }}>Placement Rate</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── BUILT FOR THE NEXT GENERATION ─── */}
      <section id="about" style={{ background: '#fff', padding: '56px 20px 64px' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: 44, alignItems: 'center' }}>

          {/* Photo */}
          <div style={{ borderRadius: 24, overflow: 'hidden', boxShadow: '0 12px 32px -6px rgba(0,0,0,0.1)', aspectRatio: '4/3', width: '100%' }}>
            <img src="/team_photo.jpg" alt="University placement team" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          </div>

          {/* Copy */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#4F46E5', marginBottom: 10 }}>Modern Placement Infrastructure</div>
            <h2 style={{ fontSize: 'clamp(26px, 5vw, 42px)', fontWeight: 800, color: '#111827', lineHeight: 1.15, letterSpacing: '-0.03em', margin: '0 0 12px' }}>
              Built For The<br />Next Generation.
            </h2>
            <div style={{ width: 44, height: 3, borderRadius: 2, background: '#4F46E5', marginBottom: 16 }} />
            <p style={{ fontSize: 15, color: '#4B5563', lineHeight: 1.65, margin: '0 0 24px', maxWidth: 460 }}>
              Designed with smooth visual flow, verified credentials, and institutional controls superior to disjointed legacy spreadsheets.
            </p>

            {/* Checklist */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
              {['Role-based access for students, universities & companies','Verified credential system with university sign-off','Real-time Kanban pipeline for recruiters','AI-powered ATS scoring with instant PDF export'].map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14, color: '#374151' }}>
                  <CheckCircle size={16} color="#4F46E5" style={{ flexShrink: 0, marginTop: 2 }} />
                  {f}
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 36, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: 30, fontWeight: 800, color: '#111827', letterSpacing: '-0.03em' }}>120+</div>
                <div style={{ fontSize: 13, color: '#6B7280', fontWeight: 500 }}>Partner Recruiters</div>
              </div>
              <div>
                <div style={{ fontSize: 30, fontWeight: 800, color: '#4F46E5', letterSpacing: '-0.03em' }}>35+</div>
                <div style={{ fontSize: 13, color: '#6B7280', fontWeight: 500 }}>Active Campus Drives</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── PLATFORM CAPABILITIES ─── */}
      <section id="capabilities" style={{ maxWidth: 1140, margin: '0 auto', padding: '56px 20px 64px' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h2 style={{ fontSize: 'clamp(24px, 4.5vw, 38px)', fontWeight: 800, color: '#111827', letterSpacing: '-0.03em', margin: '0 0 10px' }}>Platform Capabilities.</h2>
          <p style={{ fontSize: 15, color: '#6B7280', margin: 0, maxWidth: 500, marginLeft: 'auto', marginRight: 'auto' }}>
            Structured modern workflows with verified student data, ATS scoring, and clean role-based layouts.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: 18 }}>
          {[
            { icon: GraduationCap, title: 'Verified Student Profiles', desc: 'Official university verification per section ensuring 100% credential validity before companies ever shortlist.', link: 'Explore Verification Flow' },
            { icon: FileText, title: 'Deterministic ATS Engine', desc: 'Built-in JD keyword scoring, action verb analysis, live A4 preview, and instant clean PDF generation.', link: 'Try Resume ATS Scoring' },
            { icon: Trophy, title: 'Recruiter Pipeline & Parser', desc: 'Hiring criteria parsed from recruiter emails with live synchronized Kanban tracking across all roles.', link: 'Test Recruiter Pipeline' },
            { icon: BarChart2, title: 'Skill Gap Analysis', desc: 'Compare your skills against job requirements with personalized roadmaps and visual bar chart insights.', link: 'Analyze Your Skills' },
            { icon: Zap, title: 'Interview Prep Engine', desc: 'Adaptive MCQ tests with 40+ questions across DSA, aptitude and domain topics with weak area tracking.', link: 'Start Mock Interview' },
            { icon: CheckCircle, title: 'Certificate OCR & Validation', desc: 'Upload certificates with OCR simulation, duplicate detection, expiry reminders and instant verification.', link: 'Upload Certificates' },
          ].map(card => {
            const Icon = card.icon;
            return (
              <div key={card.title} style={{ background: '#fff', borderRadius: 20, padding: '26px 22px', border: '1px solid #F1F4FA', boxShadow: '0 4px 20px -2px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                  <Icon size={21} color="#4F46E5" />
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: '0 0 8px' }}>{card.title}</h3>
                <p style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.6, margin: '0 0 14px', flex: 1 }}>{card.desc}</p>
                <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 600, color: '#4F46E5', textDecoration: 'none' }}>
                  {card.link} <ArrowRight size={13} />
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── INSPIRING SECTION ─── */}
      <section id="experience" style={{ padding: '16px 20px 64px' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto' }}>
          <div style={{ position: 'relative', borderRadius: 28, overflow: 'hidden', background: '#111827', minHeight: 340, display: 'flex', alignItems: 'center', boxShadow: '0 16px 40px -10px rgba(0,0,0,0.2)' }}>
            <img src="/focused_student.jpg" alt="Focused student" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', opacity: 0.55 }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(17,24,39,0.3) 0%, rgba(17,24,39,0.85) 60%, rgba(17,24,39,0.97) 100%)' }} />
            <div style={{ position: 'relative', zIndex: 10, padding: '36px 28px', maxWidth: 520, marginLeft: 'auto', color: '#fff' }}>
              <div style={{ display: 'inline-block', padding: '5px 14px', borderRadius: 9999, background: 'rgba(238,242,255,0.15)', border: '1px solid rgba(224,231,255,0.25)', fontSize: 12, fontWeight: 600, color: '#C7D2FE', marginBottom: 14 }}>
                Unified Institutional Experience
              </div>
              <h2 style={{ fontSize: 'clamp(24px, 5vw, 40px)', fontWeight: 800, lineHeight: 1.15, color: '#fff', letterSpacing: '-0.03em', margin: '0 0 12px' }}>
                Placement That <span style={{ color: '#818CF8' }}>Feels</span> Inspiring.
              </h2>
              <p style={{ fontSize: 14, color: '#E0E7FF', lineHeight: 1.65, margin: '0 0 22px', opacity: 0.9 }}>
                Clean white and soft indigo aesthetics combined with verified records, modern layouts, strong typography, and smooth platform composition.
              </p>
              <Link to="/login" style={{ display: 'inline-block', padding: '11px 26px', borderRadius: 9999, background: '#4F46E5', color: '#fff', fontSize: 13, fontWeight: 600, textDecoration: 'none', boxShadow: '0 4px 14px rgba(79,70,229,0.4)' }}>
                Join CAREER-OS
              </Link>
            </div>
          </div>

          {/* Contact cards */}
          <div id="contact" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: 18, marginTop: 20 }}>
            <div style={{ background: '#fff', borderRadius: 20, padding: '22px', border: '1px solid #EBEFFA', boxShadow: '0 4px 16px rgba(0,0,0,0.04)', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <MapPin size={18} color="#4F46E5" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: '0 0 10px' }}>Visit Placement Cell</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7, fontSize: 13, color: '#4B5563' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}><MapPin size={13} color="#9CA3AF" style={{ flexShrink: 0, marginTop: 2 }} /><span>Center for Career Planning, VIT Campus, TN 632014</span></div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Phone size={13} color="#9CA3AF" style={{ flexShrink: 0 }} /><span>+91 416 224 3091</span></div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Mail size={13} color="#9CA3AF" style={{ flexShrink: 0 }} /><span>placement@vit.ac.in</span></div>
                </div>
              </div>
            </div>

            <div style={{ background: '#fff', borderRadius: 20, padding: '22px', border: '1px solid #EBEFFA', boxShadow: '0 4px 16px rgba(0,0,0,0.04)', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Clock size={18} color="#4F46E5" />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: '0 0 10px' }}>Campus Drive Timings</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7, fontSize: 13, color: '#4B5563' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Clock size={13} color="#9CA3AF" style={{ flexShrink: 0 }} /><span>Mon–Fri | 8:30 AM – 6:30 PM</span></div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Clock size={13} color="#9CA3AF" style={{ flexShrink: 0 }} /><span>Saturday | 9:00 AM – 1:00 PM</span></div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Clock size={13} color="#9CA3AF" style={{ flexShrink: 0 }} /><span>Sunday | Online Assessments Only</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer style={{ borderTop: '1px solid #E5E7EB', background: '#fff', padding: '24px 20px' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 16, fontSize: 13, color: '#6B7280' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 800, color: '#4F46E5', fontSize: 15 }}>CAREER-OS</span>
            <span>• Campus Placement Platform</span>
          </div>
          <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
            <Link to="/login" style={{ color: '#4B5563', textDecoration: 'none' }}>Sign In</Link>
            <a href="#about" style={{ color: '#4B5563', textDecoration: 'none' }}>Platform</a>
            <a href="#capabilities" style={{ color: '#4B5563', textDecoration: 'none' }}>Capabilities</a>
            <a href="#contact" style={{ color: '#4B5563', textDecoration: 'none' }}>Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
