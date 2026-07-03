import { useTranslation } from 'react-i18next'
import { useState, useEffect } from 'react'
import './styles/App.css'
import IdentifyVoice from './IdentifyVoice.jsx'
import Header from './header.jsx'
import RegisterDB from './Registerdb.jsx'
import Login from './Login.jsx'
import Account from './Account.jsx'
import Home from './Home.jsx'
import { Routes, Route, useNavigate } from 'react-router-dom'
import ClonageVoice from './ClonageVoice.jsx'
import Statistics from './Statistics.jsx'
import LiveIdentify from './LiveIdentify.jsx'

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
        <Route path="/Voice_Recognition" element={<IdentifyVoice />} />
        <Route path="/Live_Recognition" element={<LiveIdentify />} />
        <Route path="/" element={<Home isAuthenticated={isAuthenticated} user={user}/>} />

        <Route path="/Statistics" element={<Statistics />} />


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
        <Route path="/account" element={
          
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <Account user={user} setUser={setUser} setIsAuthenticated={setIsAuthenticated} setToken={setToken} />
          </ProtectedRoute>
        } />
        <Route path="/Clonage" element={
          
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <ClonageVoice isAuthenticated={isAuthenticated}/>
          </ProtectedRoute>
        } />

      </Routes>

      </>
  )
}

export default App