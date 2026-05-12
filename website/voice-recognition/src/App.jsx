
import { useState } from 'react'
import './App.css'
import Import from './Import.jsx'
import Header from './header.jsx'
import Recorder from './recorder.jsx'

function App() {

  return(
    <>
      <Header/>
      <Import/>
      <Recorder/>
    </>
  )
}

export default App