
import { useState } from 'react'
import './App.css'
import dellLogo from './dell_logo.png'

function Header() {
  return (
    <main id="center">
      <img src={dellLogo} alt="Logo DELL" className="logo" />
      <h1>Voice Recognition</h1>
    </main>
  )
}

export default Header