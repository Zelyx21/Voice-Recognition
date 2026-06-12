import { useState, useRef } from 'react'
import { useApi } from './hooks/useAPI'
import { useRecording } from './hooks/useRecording'
import { useNavigate } from 'react-router-dom'

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

  const EXAMPLE_SENTENCES = {
    None: "None",
    English:
        "Of course I'm angry ! You dropped an old hammer on my lap ! Do you know what time the meeting starts ? " +
        "Can you bring these books back to the library ? Trees also provide shade, and they can temper the climate. " +
        "The city lies at the mouth of the river.",
    French:
        "Bonjour, comment allez-vous aujourd'hui ? Chaque chercheur poursuit ses propres hypothèses. " +
        "Les journalistes interrogent plusieurs témoins. Le spectateur applaudit chaleureusement les musiciens. " +
        "Le système détecte correctement la voix humaine.",

  }

  const [exempleLanguage, setExempleLanguage] = useState(null)


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
        <div class="record_state">
          {!isRecording && !audioURL && (
            <div>
              <button onClick={()=>{setError(null); startRecording()}}>Start recording</button>
            </div>
          )}

          {isRecording && (
            <div>
              <p>{Math.floor(recordingTime / 60)}m {recordingTime % 60}s / 10m</p>
              <button onClick={()=>stopRecording(setError)}>Stop recording</button>
            </div>
          )
          }

          {audioURL && (
            <div className="file-info">
              <p>Finished recording</p>
              <audio controls src={audioURL} />
              <button className="remove" onClick={resetRecording}>
                Record again
              </button>
            </div>
          )}

          <div>
              <p>Say anything !</p>
              <p>You don't know what to say ? Choose a language and get example sentences</p>

              <select
              id="exemple"
              value={exempleLanguage}
              onChange={(e) => setExempleLanguage(e.target.value)}
              >
              {Object.entries(EXAMPLE_SENTENCES).map( ([key, value]) => (
              <option key={key} value={key}>{key}</option>
              ))}

              </select>
              
              <div class="text_Exemple">

                  {exempleLanguage !== "None" && (
                      EXAMPLE_SENTENCES[exempleLanguage]
                  )}
              </div>

          </div>

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