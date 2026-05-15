import { useState, useRef } from 'react'

function RegisterDB() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isRecording, setIsRecording] = useState(false)
  const [audioURL, setAudioURL] = useState(null)
  const [audioBlob, setAudioBlob] = useState(null)
  const [audioFile, setAudioFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [mode, setMode] = useState(null)
  const [error, setError] = useState(null)

  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const fileInputRef = useRef(null)

  const startRecording = async () => {
    try {
      //Ask access to the microphone
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/wav' })
        const url = URL.createObjectURL(blob)
        setAudioBlob(blob)
        setAudioURL(url)

        // Stop all microphone tracks
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)

    } catch (err) {
      alert("Microphone inaccessible : " + err.message)
    }
  }

  const stopRecording = () => {
    mediaRecorderRef.current?.stop()
    setIsRecording(false)
  }

  const resetRecording = () => {
    setAudioURL(null)
    setAudioBlob(null)
    setResult(null)
    startRecording()
  }

  const validate = () => {
    if (!name) return "Please enter a name"
    if (!email) return "Please enter an email"
    if (!password) return "Please enter a password"
    if (!audioBlob && !audioFile) return "Please record or import an audio file of your voice"
    return null
  }

  const register = async () => {
    const err = validate()
    if (err) {
      setError(err)
      return
    }
    setError(null)

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append("file", new File([audioBlob], "recording.wav", { type: 'audio/wav' }))
      formData.append("name", name)
      formData.append("email", email)

      const response = await fetch("http://localhost:8000/registerdb", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()
      setResult(data)
    } catch (err) {
      alert("Error : " + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (event) => {
    const file = event.target.files[0]
    if (file) {
      setAudioFile(file)
    }
  }


  return (
    <div className="box">
      <p>Register here</p>
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

      <label>Voice</label>
      <div>
        <button onClick={() => {
          setMode("record")
          stopRecording()
          setAudioURL(null)
          setAudioFile(null)
        }}>Record your voice</button>
        <button onClick={() => {
          setMode("import")
          stopRecording()
          setAudioURL(null)
        }}>Import your voice</button>
      </div>

      {mode == "record" && (
        <div>
          {!isRecording && !audioURL && (
            <div>
              <button onClick={startRecording}>Start recording</button>
            </div>
          )}

          {isRecording && (
            <div>
              <button onClick={stopRecording}>Stop recording</button>
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



        </div>

      )}

      {mode == "import" && (
        <div>
          <input
            ref={fileInputRef}
            id="audio-upload-register"
            type="file"
            accept="audio/*"
            onChange={handleFileChange}
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

    </div>
  )

}

export default RegisterDB