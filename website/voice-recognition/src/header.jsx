
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './header.css'
import dellLogo from './dell_logo.png'
import Account from './Account'

function Header({ isAuthenticated, user, setIsAuthenticated, setUser }) {
  const navigate = useNavigate()
  const logout = () => {
    sessionStorage.removeItem("token")
    sessionStorage.removeItem("user")
    setIsAuthenticated(false)
    setUser(null)
    navigate("/")
  }


  return (
    <main id="center" style={{ justifyContent: "space-between" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <img src={dellLogo} alt="Logo DELL" className="logo" onClick={() => navigate("/")} style={{ cursor: "pointer" }} />
        <h1 onClick={() => navigate("/")} style={{ cursor: "pointer" }}>Voice Recognition</h1>
      </div>

      <div style={{ display: "flex", gap: "12px" }}>
        {isAuthenticated ? (
          <>
            <p style={{ color: "var(--text-primary)" }}>Welcome, {user.name}</p>
            <button onClick={() => {navigate("/account")}}>Account</button>
            <button onClick={logout}>Logout</button>
          </>
        ) : (
          <>
            <button onClick={() => navigate("/login")}>Login</button>
            <button onClick={() => navigate("/register")}>Register</button>
          </>
        )
        }
      </div>
    </main>
  )
}

export default Header