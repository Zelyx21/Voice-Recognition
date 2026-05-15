
import { useState, useRef } from 'react'
import './App.css'

function Import() {
  const [audioFile, setAudioFile] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const fileInputRef = useRef(null)

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
    formData.append("file", audioFile)

    const response = await fetch("http://localhost:8000/identify", {
      method: "POST",
      body: formData,
    })

    const data = await response.json()
    setResult(data)
    setLoading(false)
  }

  return (
    <div className="box">

      <input
        ref={fileInputRef}
        id="audio-upload"
        type="file"
        accept="audio/*"
        onChange={handleFileChange}
      />

      {!audioFile ? (
        //If audioFile is empty
        <>
          <label htmlFor="audio-upload" className="button">
            Import an audio file
          </label>
        </>
      ) : (
        <div className="file-info">
          <p>Selected file : <strong>{audioFile.name}</strong></p>
          <audio controls src={URL.createObjectURL(audioFile)} />
          <button
            className="remove"
            onClick={() => fileInputRef.current.click()}
          >
            Change file
          </button>
          <button className="button" onClick={sendRecording} disabled={loading}>
            {loading ? "Analysis in progress..." : "Send recording"}
          </button>

          {result && !result.issue && (
            <div className="result">
              <p>Speaker : {result.name}</p>
              <p>Score : {result.score}</p>
            </div>
          )}
          {result && result.issue && (
            <div className="issue">
              <p>Issues : {result.issue}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default Import