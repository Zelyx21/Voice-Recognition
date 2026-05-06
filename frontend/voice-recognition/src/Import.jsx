
import { useState } from 'react'
import './App.css'

function Import() {
  const [audioFile, setAudioFile] = useState(null)

  const handleFileChange = (event) => {
    const file = event.target.files[0]
    if (file) {
      setAudioFile(file)
      console.log("Fichier prêt :", file.name)
    }
  }

  return (
    <main id="center">
      <h1>Voice Recognition</h1>
      
      {!audioFile ? (
        <>
          {/* Label stylisé qui sert de bouton */}
          <label htmlFor="audio-upload" className="custom-button">
            Importer un fichier audio
          </label>
          <input
            id="audio-upload"
            type="file"
            accept="audio/*"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
        </>
      ) : (
        <div className="file-info">
          <p>Fichier sélectionné : <strong>{audioFile.name}</strong></p>
          <button 
            className="custom-button secondary" 
            onClick={() => setAudioFile(null)}
          >
            Changer de fichier
          </button>
        </div>
      )}
    </main>
  )
}

export default Import