
import { useState } from 'react'
import './App.css'
import IdentifyVoice from './IdentifyVoice.jsx'
import Header from './header.jsx'
import RegisterDB from './Registerdb.jsx'
import Login from './Login.jsx'
import { Routes, Route } from 'react-router-dom'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)

  return (
    <>
      <Header
        isAuthenticated={isAuthenticated} user={user} setIsAuthenticated={setIsAuthenticated} setUser={setUser} />
      <Routes>
        <Route path="/" element={<IdentifyVoice token={token}/>} />
        <Route path="/register" element={<RegisterDB />} />
        <Route path="/login" element={<Login setIsAuthenticated={setIsAuthenticated} setUser={setUser} setToken={setToken} />} />
      </Routes>
    </>
  )
}

export default App