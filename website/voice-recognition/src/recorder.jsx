
import { useState } from 'react'
import { useRef } from 'react'

import './App.css'

function Recorder() {
  const [isRecording, setIsRecording] = useState(false)
  const [audioURL, setAudioURL] = useState(null)
  const [audioBlob, setAudioBlob] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
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
    startRecording()
  }

  const sendRecording = async () => {
    if (!audioBlob) return

    setLoading(true)
    const formData = new FormData()
    formData.append("file",new File([audioBlob], "recording.wav", { type: 'audio/wav' }))

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

      {/* Recorder not started */}
      {!audioURL && !isRecording && (
        <button className="button" onClick={startRecording}>
          Start recording
        </button>
      )}

      {/* Recording in progress */}
      {isRecording && (
        <button className="remove" onClick={stopRecording}>
          Stop recording
        </button>
      )}

      {/* Recording completed */}
      {audioURL && (
        <div className="file-info">
          <p>Finished recording</p>
          <audio controls src={audioURL} />
          <button className="remove" onClick={resetRecording}>
            Record again
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

export default Recorder
