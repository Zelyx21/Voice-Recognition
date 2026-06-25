import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import './styles/Home.css'
import './styles/header.css'


/* Animated audio-visualizer bars */
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

/* Inline SVG icon (Four tools) */
const Icon = ({ d }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
)

/* Lock badge (Account required) */
const LockBadge = ({ t }) => (
  <span className="lock-badge">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      width="11" height="11">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
    {t('common.account_required')}
  </span>
)

export default function Home({ isAuthenticated, user }) {
  const firstName = user?.name?.split(' ')[0] || null
  const { t } = useTranslation()

  /* Feature cards config (Four tools) */
  const FEATURES = [
    {
      id: 'recognition',
      color: 'blue',
      d: 'M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3zm0 16v4m-4 0h8M19 10v2a7 7 0 0 1-14 0v-2',
      title: t('home.feature_recognition.title'),
      desc: t('home.feature_recognition.desc'),
      link: '/Voice_Recognition',
      cta: t('home.feature_recognition.cta'),
      locked: false,
    },
    {
      id: 'cloning',
      color: 'violet',
      d: 'M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3m4-8v8m-4-4h8',
      title: t('home.feature_cloning.title'),
      desc: t('home.feature_cloning.desc'),
      link: '#cloning',
      cta: t('home.feature_cloning.cta'),
      locked: true,
    },
    {
      id: 'register',
      color: 'cyan',
      d: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 8 0 4 4 0 0 0-8 0M19 8v6m3-3h-6',
      title: t('home.feature_registration.title'),
      desc: t('home.feature_registration.desc'),
      link: '/register',
      cta: t('home.feature_registration.cta'),
      locked: false,
    },
    {
      id: 'stats',
      color: 'green',
      d: 'M3 3v18h18M8 17V9m5 8V5m5 12V11',
      title: t('home.feature_stats.title'),
      desc: t('home.feature_stats.desc'),
      link: '/Statistics',
      cta: t('home.feature_stats.cta'),
      locked: false,
    },
  ]

  return (
    <main className="hm">

      {/* first vue */}
      <section className="hm-hero">
        <AudioBars count={56} className="hm-hero__bars" />
        <div className="hm-hero__content">
          <span className="hm-badge">{t('home.badge_internship')}</span>
          <h1 className="hm-hero__title">
            <span className="hm-gradient">Voice</span>ID
          </h1>
          <p className="hm-hero__sub">{t('home.subtitle')}</p>
          <p className="hm-hero__desc">
            {t('home.description')}
          </p>
          <div className="hm-hero__actions">
            <Link to="/Voice_Recognition" className="hm-btn hm-btn--primary">
              {t('home.btn_recognition')}
            </Link>
            {isAuthenticated
              ? <Link to="/account" className="hm-btn hm-btn--ghost">
                  {t('home.btn_account')}{firstName ? ` (${firstName})` : ''}
                </Link>
              : <Link to="/register" className="hm-btn hm-btn--ghost">
                  {t('home.btn_register')}
                </Link>
            }
          </div>
        </div>
      </section>

      {/* Features (Four tools) */}
      <section className="hm-section">
        <div className="hm-inner">
          <p className="hm-eyebrow">{t('home.features_eyebrow')}</p>
          <h2 className="hm-section__title">{t('home.features_title')}</h2>
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
                  {needsLogin && <LockBadge t={t} />}
                  <h3 className="hm-card__title">{f.title}</h3>
                  <p className="hm-card__desc">{f.desc}</p>
                  {needsLogin
                    ? <Link to="/register" className="hm-link hm-link--locked">{t('home.unlock_register')}</Link>
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

      {/* How it works */}
      <section className="hm-section hm-section--alt">
        <div className="hm-inner">
          <p className="hm-eyebrow">{t('home.process_eyebrow')}</p>
          <h2 className="hm-section__title">{t('home.process_title')}</h2>
          <div className="hm-steps">

            <div className="hm-step">
              <span className="hm-step__num">01</span>
              <h3 className="hm-step__title">{t('home.step1_title')}</h3>
              <p className="hm-step__body">
                {t('home.step1_desc')}
              </p>
            </div>

            <div className="hm-step__arrow" aria-hidden="true">→</div>

            <div className="hm-step">
              <span className="hm-step__num">02</span>
              <h3 className="hm-step__title">{t('home.step2_title')}</h3>
              <p className="hm-step__body">
                {t('home.step2_desc')}
              </p>
            </div>

            <div className="hm-step__arrow" aria-hidden="true">→</div>

            <div className="hm-step">
              <span className="hm-step__num">03</span>
              <h3 className="hm-step__title">{t('home.step3_title')}</h3>
              <p className="hm-step__body">
                {t('home.step3_desc')}
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Cloning detail */}
      <section className="hm-section" id="cloning">
        <div className="hm-inner hm-cloning">

          <div className="hm-cloning__text">
            <p className="hm-eyebrow">{t('home.cloning_eyebrow')}</p>
            <h2 className="hm-cloning__title">{t('home.cloning_title')}</h2>
            <p className="hm-cloning__intro">
              {t('home.cloning_intro')}
            </p>
            <ul className="hm-modes">
              <li>{t('home.cloning_mode1')}</li>
              <li>{t('home.cloning_mode2')}</li>
              <li>{t('home.cloning_mode3')}</li>
              <li>{t('home.cloning_mode4')}</li>
            </ul>
            {isAuthenticated
              ? <Link to="/Clonage" className="hm-btn hm-btn--primary">{t('home.cloning_btn')}</Link>
              : <Link to="/register" className="hm-btn hm-btn--violet">{t('home.unlock_register')}</Link>
            }
          </div>

          <div className="hm-cloning__visual">
            <AudioBars count={30} className="hm-cloning__bars" />
            <p className="hm-cloning__caption">{t('home.cloning_bars')}</p>
          </div>

        </div>
      </section>

      {/* Context & Team */}
      <section className="hm-section hm-section--alt">
        <div className="hm-inner">
          <p className="hm-eyebrow">{t('home.context_eyebrow')}</p>
          <h2 className="hm-section__title">{t('home.context_title')}</h2>
          <div className="hm-about">

            <div className="hm-about__card hm-about__card--dell">
              <p className="hm-about__label">{t('home.context_host')}</p>
              <div className="hm-dell-logo" aria-label="Dell">Dell</div>
              <h3>{t('home.context_dell')}</h3>
              <p>
                {t('home.context_dell_desc')}
              </p>
            </div>

            <div className="hm-about__card hm-about__card--uni">
              <p className="hm-about__label">{t('home.context_academic')}</p>
              <h3>{t('home.context_uni')}</h3>
              <p>
                {t('home.context_uni_desc')}
              </p>
            </div>

            <div className="hm-about__card hm-about__card--team">
              <p className="hm-about__label">{t('home.context_team_label')}</p>
              <h3>{t('home.context_team_title')}</h3>
              <div className="hm-team">
                <div className="hm-member">
                  <div className="hm-avatar hm-avatar--blue">CB</div>
                  <div>
                    <p className="hm-member__name">{t('home.context_member1')}</p>
                    <p className="hm-member__role">{t('home.context_member1_role')}</p>
                  </div>
                </div>
                <div className="hm-member">
                  <div className="hm-avatar hm-avatar--violet">SD</div>
                  <div>
                    <p className="hm-member__name">{t('home.context_member2')}</p>
                    <p className="hm-member__role">{t('home.context_member2_role')}</p>
                  </div>
                </div>
              </div>
              <p className="Github_lien">{t('home.context_github')}<a href="https://github.com/Zelyx21/Voice-Recognition">https://github.com/Zelyx21/Voice-Recognition</a></p>
            </div>

          </div>
        </div>
      </section>

      {/* Footer  */}
      <footer className="hm-footer">
        <p>
          {t('home.footer')}
        </p>
      </footer>

    </main>
  )
}