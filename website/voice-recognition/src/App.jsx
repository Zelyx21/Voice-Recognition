import { useState, useEffect } from 'react'
import './App.css'
import IdentifyVoice from './IdentifyVoice.jsx'
import Header from './header.jsx'
import RegisterDB from './Registerdb.jsx'
import Login from './Login.jsx'
import { Routes, Route, useNavigate } from 'react-router-dom'
import ClonageVoice from './ClonageVoice.jsx'


function ProtectedRoute({ isAuthenticated, children }) {
  const navigate = useNavigate()
  useEffect(() => {
    if (!isAuthenticated) navigate("/login")
  }, [isAuthenticated])
  return isAuthenticated ? children : null
}

function PublicRoute({ isAuthenticated, children }) {
  const navigate = useNavigate()
  useEffect(() => {
    if (isAuthenticated) navigate("/")
  }, [isAuthenticated])
  return !isAuthenticated ? children : null
}

function App() {
  const [token, setToken] = useState(sessionStorage.getItem("token") || null)
  const [isAuthenticated, setIsAuthenticated] = useState(!!sessionStorage.getItem("token"))
  const [user, setUser] = useState(JSON.parse(sessionStorage.getItem("user")) || null)

  return (
    <>
      <Header
        isAuthenticated={isAuthenticated} user={user} setIsAuthenticated={setIsAuthenticated} setUser={setUser} />
      <Routes>
        <Route path="/" element={<IdentifyVoice />} />
        <Route path="/register" element={
          <PublicRoute isAuthenticated={isAuthenticated}>
            <RegisterDB />
          </PublicRoute>
        } />
        <Route path="/login" element={
          <PublicRoute isAuthenticated={isAuthenticated}>
            <Login setIsAuthenticated={setIsAuthenticated} setUser={setUser} setToken={setToken} />
          </PublicRoute>
        } />
      </Routes>
       <ClonageVoice /> 
    </>
  )
}

export default App