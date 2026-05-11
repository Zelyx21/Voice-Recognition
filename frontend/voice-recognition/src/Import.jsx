
import { useState } from 'react'
import './App.css'

function Import() {
  const [audioFile, setAudioFile] = useState(null)
  const[result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleFileChange = (event) => {
    const file = event.target.files[0]
    if (file) {
      setAudioFile(file)
      setResult(null)
    }
  }

  const sendRecording = async () => {
    if (!audioFile) return

    setLoading(true)
    const formData = new FormData()
    formData.append("file",audioFile)

    const response = await fetch("http://localhost:8000/identify", {
      method: "POST",
      body: formData,
    })

    const data = await response.json()
    setResult(data)
    setLoading(false)
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
          <button className="send-import" onClick={sendRecording} disabled={loading}>
            {loading ? "Analyse en cours...":"Envoyer l'enregistrement"}
          </button>

          {result && (
            <div className = "result">
              <p>Locuteur : {result.name}</p>
              <p>Score : {result.score}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default Import