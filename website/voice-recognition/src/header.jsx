import { useNavigate, Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import './styles/header.css'
import dellLogo from './styles/dell_logo.png'

function Header({ isAuthenticated, user, setIsAuthenticated, setUser }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { t, i18n } = useTranslation()

  const logout = () => {
    sessionStorage.removeItem("token")
    sessionStorage.removeItem("user")
    setIsAuthenticated(false)
    setUser(null)
    navigate("/")
  }

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'fr' : 'en'
    i18n.changeLanguage(newLang)
    localStorage.setItem('language', newLang)
  }

  const isActive = (path) => location.pathname === path ? "nav-link active" : "nav-link"

  return (
    <header className="site-header">
      <div className="header-brand" onClick={() => navigate("/")}>
        <img src={dellLogo} alt="Logo DELL" className="header-logo" />
        <span className="brand-title">
          <span className="gradient-text">Voice</span>ID
        </span>
      </div>

      {/* Navbar */}
      <nav className="header-nav">
        <Link to="/" className={isActive("/")}>{t('header.home')}</Link>
        <Link to="/Voice_Recognition" className={isActive("/Voice_Recognition")}>{t('header.voice_recognition')}</Link>
        <Link to="/Clonage" className={isActive("/Clonage")}>{t('header.voice_cloning')}</Link>
        <Link to="/Statistics" className={isActive("/Statistics")}>{t('header.statistics')}</Link>
      </nav>

      {/* Account management */}
      <div className="header-actions">
        {isAuthenticated ? (
          <>
            <Link to="/account" className="account-link">
              <span>{t('header.account')}</span>
              {user?.name && (
                <span className="user-badge">
                  {user.name}
                </span>
              )}
            </Link>
            <button className="btn-logout" onClick={logout}>{t('header.logout')}</button>
          </>
        ) : (
          <>
            <button className="btn-login" onClick={() => navigate("/login")}>{t('header.login')}</button>
            <Link to="/register" className="btn-register">{t('header.register')}</Link>
          </>
        )}
        
        {/* Bouton de changement de langue */}
        <button 
          className="btn-language"
          onClick={toggleLanguage}
          title={t('header.language')}
          aria-label={t('header.language')}
        >
          {i18n.language === 'en' ? 'FR' : 'EN'}
        </button>
      </div>
    </header>
  )
}

export default Header
