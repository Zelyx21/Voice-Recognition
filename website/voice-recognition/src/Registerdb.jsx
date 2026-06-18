import { useState, useRef } from 'react'
import { useApi } from './hooks/useAPI'
import { useRecording } from './hooks/useRecording'
import { useNavigate } from 'react-router-dom'

import ButtonRecord from './forms/ButtonRecord'

function RegisterDB() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [audio_name, setAudio_name] = useState("")
  const [result, setResult] = useState(null)
  const [mode, setMode] = useState(null)
  const [success, setSuccess] = useState(null)

  const { call, loading, error, setError } = useApi()
  const { isRecording, audioURL, audioBlob, audioFile, recordingTime, fileInputRef, startRecording, stopRecording, resetRecording, handleFileChange } = useRecording()
  const navigate = useNavigate()

  const validate = () => {
    if (!name) return "Please enter a name"
    if (!email) return "Please enter an email"
    if (!password) return "Please enter a password"
    if (!audio_name) return "Please enter an audio name"
    if (!audioBlob && !audioFile) return "Please record or import an audio file of your voice"
    return null
  }


  const register = async () => {
    const err = validate()
    if (err) {
      setError(err)
      return
    }
    const formData = new FormData()
    if (audioBlob) {
      formData.append("file", new File([audioBlob], "recording.wav", { type: 'audio/wav' }))
    } else if (audioFile) {
      formData.append("file", audioFile)
    }
    formData.append("name", name)
    formData.append("email", email)
    formData.append("password", password)
    formData.append("audio_name", audio_name)

    const data = await call("/registerdb", { method: "POST", body: formData })
    if (data) {
      setResult(data)
      setSuccess("Registration successful !")
      setTimeout(() => setSuccess(null), 2000)
      setTimeout(()=>navigate("/"),2000)
    }
  }

  return (
    <div className="box clonage-box">
      <h2>Create an account</h2>
      <label htmlFor="name">Name</label>
      <input
        type="text"
        id="name"
        onChange={(e) => setName(e.target.value)}
      />

      <label htmlFor="email">Email</label>
      <input
        type="text"
        id="email"
        onChange={(e) => setEmail(e.target.value)}
      />

      <label>Password</label>
      <input
        type="password"
        id="password"
        onChange={(e) => setPassword(e.target.value)}
      />

      <label>Audio name</label>
      <input
        type="text"
        id="audio_name"
        onChange={(e) => setAudio_name(e.target.value)}
      />

      <label>Voice</label>
      <div className="button-group">
        <button onClick={() => {
          setMode("record")
          resetRecording()
        }}>Record your voice</button>
        <button onClick={() => {
          setMode("import")
          resetRecording()
        }}>Import your voice</button>
      </div>

      {mode == "record" && (
        <ButtonRecord isRecording={isRecording} audioURL={audioURL} setError={setError} startRecording={startRecording} stopRecording={stopRecording} recordingTime={recordingTime}/>
      )}

      {audioURL && (
        <div className="file-info">
          <p>Finished recording</p>
          <audio controls src={audioURL} />
          <button className="remove" onClick={resetRecording}>
            Record again
          </button>
        </div>
      )}

      {mode == "import" && (
        <div>
          <input
            ref={fileInputRef}
            id="audio-upload-register"
            type="file"
            accept="audio/*"
            onChange={(e) => handleFileChange(e, setError)}
          />

          {!audioFile ? (
            <label htmlFor="audio-upload-register" className="button">
              Import an audio file
            </label>
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
            </div>
          )}
        </div>
      )}

      <button
        onClick={register}
      >
        Register
      </button>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {success && (
        <p style={{ color: "green" }}>{success}</p>
      )}

    </div>
  )

}

export default RegisterDB