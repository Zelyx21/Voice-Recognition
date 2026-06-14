import { Link } from 'react-router-dom'
import './styles/Home.css'
import './styles/header.css'


/* ── Animated audio-visualizer bars ─────────────────────────────── */
const AudioBars = ({ count = 48, className = '' }) => (
  <div className={`audio-bars ${className}`} aria-hidden="true">
    {Array.from({ length: count }, (_, i) => {
      const base = 18 + Math.abs(Math.sin(i * 0.47)) * 22 + Math.abs(Math.sin(i * 0.31 + 1.2)) * 14
      return (
        <div
          key={i}
          className="audio-bar"
          style={{
            animationDelay: `${((i * 0.085) % 1.5).toFixed(3)}s`,
            '--min-h': `${(base * 0.35).toFixed(1)}px`,
            '--max-h': `${(base * 2.1).toFixed(1)}px`,
          }}
        />
      )
    })}
  </div>
)

/* ── Inline SVG icon ─────────────────────────────────────────────── */
const Icon = ({ d }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
)

/* ── Feature cards config ────────────────────────────────────────── */
const FEATURES = [
  {
    id: 'recognition',
    color: 'blue',
    d: 'M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3zm0 16v4m-4 0h8M19 10v2a7 7 0 0 1-14 0v-2',
    title: 'Voice Recognition',
    desc: 'Submit any audio clip and match it against every registered profile in the database using speaker embeddings.',
    link: '/identify',
    cta: 'Try recognition',
    locked: false,
  },
  {
    id: 'cloning',
    color: 'violet',
    d: 'M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3m4-8v8m-4-4h8',
    title: 'Voice Cloning',
    desc: 'Clone your registered voice across languages, emotional tones, and styles using Fun-CosyVoice 3.0.',
    link: '#cloning',
    cta: 'Explore cloning',
    locked: true,
  },
  {
    id: 'register',
    color: 'cyan',
    d: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 8 0 4 4 0 0 0-8 0M19 8v6m3-3h-6',
    title: 'Registration',
    desc: 'Create an account and record your voice. Your vocal profile is encoded and stored — the first step to recognition and cloning.',
    link: '/register',
    cta: 'Create account',
    locked: false,
  },
  {
    id: 'stats',
    color: 'green',
    d: 'M3 3v18h18M8 17V9m5 8V5m5 12V11',
    title: 'Statistics',
    desc: 'Explore recognition accuracy, false-positive rates, speaker clustering visualizations, and model performance benchmarks.',
    link: '/stats',
    cta: 'View analytics',
    locked: false,
  },
]

/* ── Lock badge ──────────────────────────────────────────────────── */
const LockBadge = () => (
  <span className="lock-badge">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      width="11" height="11">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
    Account required
  </span>
)

/* ── Home page ───────────────────────────────────────────────────── */
export default function Home({ isAuthenticated, user }) {
  const firstName = user?.name?.split(' ')[0] || null

  return (
    <main className="hm">

      {/* ─── HERO ────────────────────────────────────────── */}
      <section className="hm-hero">
        <AudioBars count={56} className="hm-hero__bars" />
        <div className="hm-hero__content">
          <span className="hm-badge">Dell Technologies Internship · 2026</span>
          <h1 className="hm-hero__title">
            <span className="hm-gradient">Voice</span>ID
          </h1>
          <p className="hm-hero__sub">Identify &middot; Clone &middot; Analyze</p>
          <p className="hm-hero__desc">
            A voice intelligence platform built on speaker embeddings
            — developed as part of our L3&nbsp;MIASHS internship
            at&nbsp;Dell&nbsp;Technologies.
          </p>
          <div className="hm-hero__actions">
            <Link to="/identify" className="hm-btn hm-btn--primary">
              Try Voice Recognition
            </Link>
            {isAuthenticated
              ? <Link to="/account" className="hm-btn hm-btn--ghost">
                  My Account{firstName ? ` (${firstName})` : ''}
                </Link>
              : <Link to="/register" className="hm-btn hm-btn--ghost">
                  Create an Account
                </Link>
            }
          </div>
        </div>
      </section>

      {/* ─── FEATURES ────────────────────────────────────── */}
      <section className="hm-section">
        <div className="hm-inner">
          <p className="hm-eyebrow">What you can do</p>
          <h2 className="hm-section__title">Four tools, one pipeline</h2>
          <div className="hm-grid">
            {FEATURES.map(f => {
              const needsLogin = f.locked && !isAuthenticated
              return (
                <div
                  key={f.id}
                  className={`hm-card hm-card--${f.color}${needsLogin ? ' hm-card--locked' : ''}`}
                >
                  <div className={`hm-card__icon hm-card__icon--${f.color}`}>
                    <Icon d={f.d} />
                  </div>
                  {needsLogin && <LockBadge />}
                  <h3 className="hm-card__title">{f.title}</h3>
                  <p className="hm-card__desc">{f.desc}</p>
                  {needsLogin
                    ? <Link to="/register" className="hm-link hm-link--locked">Register to unlock →</Link>
                    : f.link.startsWith('#')
                      ? <a href={f.link} className={`hm-link hm-link--${f.color}`}>{f.cta} →</a>
                      : <Link to={f.link} className={`hm-link hm-link--${f.color}`}>{f.cta} →</Link>
                  }
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ────────────────────────────────── */}
      <section className="hm-section hm-section--alt">
        <div className="hm-inner">
          <p className="hm-eyebrow">The process</p>
          <h2 className="hm-section__title">How it works</h2>
          <div className="hm-steps">

            <div className="hm-step">
              <span className="hm-step__num">01</span>
              <h3 className="hm-step__title">Register your voice</h3>
              <p className="hm-step__body">
                Create an account and submit a voice sample. Your voice is encoded
                as a 192-dimension speaker embedding and stored in the Qdrant vector database.
              </p>
            </div>

            <div className="hm-step__arrow" aria-hidden="true">→</div>

            <div className="hm-step">
              <span className="hm-step__num">02</span>
              <h3 className="hm-step__title">Identify or clone</h3>
              <p className="hm-step__body">
                Feed any clip to the recognition engine for a cosine similarity search
                across all profiles — or synthesize new speech from your registered voice.
              </p>
            </div>

            <div className="hm-step__arrow" aria-hidden="true">→</div>

            <div className="hm-step">
              <span className="hm-step__num">03</span>
              <h3 className="hm-step__title">Analyze performance</h3>
              <p className="hm-step__body">
                Review recognition accuracy, false-positive rates, and speaker clustering
                metrics in the Statistics panel.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ─── CLONING DETAIL ──────────────────────────────── */}
      <section className="hm-section" id="cloning">
        <div className="hm-inner hm-cloning">

          <div className="hm-cloning__text">
            <p className="hm-eyebrow">Voice Cloning</p>
            <h2 className="hm-cloning__title">One voice. Many expressions.</h2>
            <p className="hm-cloning__intro">
              Once registered, your voice becomes a synthesis template.
              The engine — built on CosyVoice (Fun&#8209;CosyVoice3&#8209;0.5B) — supports
              four distinct modes:
            </p>
            <ul className="hm-modes">
              <li><strong>Zero-shot</strong> — synthesize from a short reference clip only</li>
              <li><strong>Cross-lingual</strong> — keep your timbre, speak in another language</li>
              <li><strong>Guided instruction</strong> — Select emotion and speaking style</li>
              <li><strong>Custom instruction</strong> — guide emotion, pace, and tone via a text prompt</li>
            </ul>
            {isAuthenticated
              ? <Link to="/account" className="hm-btn hm-btn--primary">Open Voice Cloning</Link>
              : <Link to="/register" className="hm-btn hm-btn--violet">Register to unlock →</Link>
            }
          </div>

          <div className="hm-cloning__visual">
            <AudioBars count={30} className="hm-cloning__bars" />
            <p className="hm-cloning__caption">CosyVoice · Fun-CosyVoice3-0.5B</p>
          </div>

        </div>
      </section>

      {/* ─── ABOUT ───────────────────────────────────────── */}
      <section className="hm-section hm-section--alt">
        <div className="hm-inner">
          <p className="hm-eyebrow">The project</p>
          <h2 className="hm-section__title">Context &amp; team</h2>
          <div className="hm-about">

            <div className="hm-about__card hm-about__card--dell">
              <p className="hm-about__label">Internship host</p>
              <div className="hm-dell-logo" aria-label="Dell">Dell</div>
              <h3>Dell Technologies</h3>
              <p>
                This project was developed in order to showcase the possible results 
                of a two-month voice recognition project using only open-source tools.
              </p>
            </div>

            <div className="hm-about__card hm-about__card--uni">
              <p className="hm-about__label">Academic context</p>
              <h3>L3 MIASHS · Paul Valéry Montpellier</h3>
              <p>
                We did this internship in the conclusion of our third year of the MIASHS programme —
                Mathematics and Computer Science Applied to Humanities and Social
                Sciences — at Université Paul Valéry Montpellier.
              </p>
            </div>

            <div className="hm-about__card hm-about__card--team">
              <p className="hm-about__label">Team</p>
              <h3>Built by</h3>
              <div className="hm-team">
                <div className="hm-member">
                  <div className="hm-avatar hm-avatar--blue">CB</div>
                  <div>
                    <p className="hm-member__name">Clementine Beaulieu</p>
                    <p className="hm-member__role">L3 MIASHS · Montpellier</p>
                  </div>
                </div>
                <div className="hm-member">
                  <div className="hm-avatar hm-avatar--violet">SD</div>
                  <div>
                    <p className="hm-member__name">Sidney Dachez</p>
                    <p className="hm-member__role">L3 MIASHS · Montpellier</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ─── FOOTER ──────────────────────────────────────── */}
      <footer className="hm-footer">
        <p>
          VoiceID &nbsp;·&nbsp; L3 MIASHS &nbsp;·&nbsp;
          Université Paul Valéry Montpellier &nbsp;·&nbsp;
          Dell Technologies Internship 2026
        </p>
      </footer>

    </main>
  )
}