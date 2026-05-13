
import { useState } from 'react'
import './App.css'
import Import from './Import.jsx'
import Header from './header.jsx'
import Recorder from './recorder.jsx'
import RegisterDB from './Registerdb.jsx'

function App() {

  return(
    <>
      <Header/>
      <Import/>
      <Recorder/>
      <RegisterDB/>
    </>
  )
}

export default App