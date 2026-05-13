import {useState, useRef} from 'react'

function RegisterDB(){
    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [isRecording, setIsRecording] = useState(false)
    const [audioURL, setAudioURL] = useState(null)
    const [audioBlob, setAudioBlob] = useState(null)
    const [loading,setLoading] = useState(false)
    const [result, setResult] = useState(null)

    const mediaRecorderRef = useRef(null)
    const chunksRef = useRef([])

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
  }

  const sendRecording = async () => {
    if (!audioBlob) return

    setLoading(true)
    try{
      const formData = new FormData()
      formData.append("file",new File([audioBlob], "recording.wav", { type: 'audio/wav' }))
      formData.append("name", name)
      formData.append("email",email)

      const response = await fetch("http://localhost:8000/registerdb", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()
      setResult(data)
    }catch(err){
      alert("Error : "+err.message)
    }finally{
      setLoading(false)
    }
  }

  return (
    <div id="center">

      {/* Recorder not started */}
      {!audioURL && !isRecording && (
        <div>
          <p>Register in our database</p>

          <label htmlFor="name">Your name</label>
          <input
          type="text"
          id="name"
          name="name"
          minLength="2"
          onChange={(e) => setName(e.target.value)}
          />

          <label htmlFor="email">Your email</label>
          <input
            type="email"
            id="email"
            onChange={(e) => setEmail(e.target.value)}
          />

          <button onClick={startRecording}>
            Begin recording
          </button>

        </div>
      )}

      {/* Recording in progress */}
      {isRecording && (
        <button className="remove-import" onClick={stopRecording}>
          Stop recording
        </button>
      )}

      {/* Recording completed */}
      {audioURL && (
        <div className="file-info">
          <p>Finished recording</p>
          <audio controls src={audioURL} />
          <button className="remove-import" onClick={resetRecording}>
            Record again
          </button>
          <button className="send-import" onClick={sendRecording} disabled={loading}>
            {loading ? "Registering in database..." : "Send recording"}
          </button>

          {result && (
            <p>{result.status === "success" ? "Registration done !" : "Something happened"}</p>
          )}
 
        </div>
      )}

    </div>
  )

}

export default RegisterDB