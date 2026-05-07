
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
  const sendRecording = () => {
    if (audioFile) {
        const a = document.createElement('a')
        a.href = URL.createObjectURL(audioFile)
        a.download = 'audio/enregistrement.wav'  // name file
        a.click()
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
          <button className="send-import" onClick={sendRecording}>
            Envoyer l'enregistrement
          </button>
        </div>
      )}
    </div>
  )
}

export default Import