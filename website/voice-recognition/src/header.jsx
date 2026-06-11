import { useNavigate, Link, useLocation } from 'react-router-dom'
import './styles/header.css'
import dellLogo from './styles/dell_logo.png'

function Header({ isAuthenticated, user, setIsAuthenticated, setUser }) {
  const navigate = useNavigate()
  const location = useLocation()

  const logout = () => {
    sessionStorage.removeItem("token")
    sessionStorage.removeItem("user")
    setIsAuthenticated(false)
    setUser(null)
    navigate("/")
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

      {/* CENTRE : Liens de navigation principale */}
      <nav className="header-nav">
        <Link to="/" className={isActive("/")}>Home</Link>
        <Link to="/Voice_Recognition" className={isActive("/Voice_Recognition")}>Voice Recognition</Link>
        <Link to="/Clonage" className={isActive("/Clonage")}>Voice Cloning</Link>
        <Link to="/Statistics" className={isActive("/Statistics")}>Statistics</Link>
      </nav>

      {/* DROITE : Actions d'authentification conditionnelles */}
      <div className="header-actions">
        {isAuthenticated ? (
          <>
            <Link to="/account" className="account-link">
              <span>Account</span>
              {user?.name && (
                <span className="user-badge">
                  {user.name}
                </span>
              )}
            </Link>
            <button className="btn-logout" onClick={logout}>Log out</button>
          </>
        ) : (
          <>
            <button className="btn-login" onClick={() => navigate("/login")}>Log in</button>
            <Link to="/register" className="btn-register">Create an account</Link>
          </>
        )}
      </div>
    </header>
  )
}

export default Header