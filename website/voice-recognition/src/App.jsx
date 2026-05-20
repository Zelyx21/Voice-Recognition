
import { useState } from 'react'
import './App.css'
import IdentifyVoice from './IdentifyVoice.jsx'
import Header from './header.jsx'
import RegisterDB from './Registerdb.jsx'
import Login from './Login.jsx'
import ClonageVoice from './ClonageVoice.jsx'


function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)

  return (
    <>
      <Header />
      <IdentifyVoice />
      <RegisterDB />
      <ClonageVoice />
      <Login
        setIsAuthenticated={setIsAuthenticated}
        setUser={setUser}
      />
    </>
  )
}

export default App