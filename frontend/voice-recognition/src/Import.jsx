
import { useState } from 'react'
import './App.css'

function Import() {
  const [audioFile, setAudioFile] = useState(null)

  const handleFileChange = (event) => {
    const file = event.target.files[0]
    if (file) {
      setAudioFile(file)
    }
  }

  return (
    <div id="Importation_div">
      
      {!audioFile ? (
        //If audioFile is empty
        <> 
          <label htmlFor="audio-upload" className="button-import">
            Importer un fichier audio
          </label>
          <input
            id="audio-upload"
            type="file"
            accept="audio/*"
            onChange={handleFileChange}
          />
        </>
      ) : (
        <div className="file-info">
          <p>Fichier sélectionné : <strong>{audioFile.name}</strong></p>
          <button 
            className="remove-import" 
            onClick={() => setAudioFile(null)}
          >
            Changer de fichier
          </button>
        </div>
      )}
    </div>
  )
}

export default Import