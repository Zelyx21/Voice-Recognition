
import { useState } from 'react'
import { useRef } from 'react'

import './App.css'

function Recorder() {
  const [isRecording, setIsRecording] = useState(false)
  const [audioURL, setAudioURL] = useState(null)
  const [audioBlob, setAudioBlob] = useState(null)
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
  }

  const sendRecording = () => {
    if (audioBlob) {
        const a = document.createElement('a')
        a.href = audioURL
        a.download = 'audio/enregistrement.wav'  // name file
        a.click()
    }
  }

  return (
    <div id="center">

      {/* Recorder not started */}
      {!audioURL && !isRecording && (
        <button className="button-import" onClick={startRecording}>
          Démarrer l'enregistrement
        </button>
      )}

      {/* Recording in progress */}
      {isRecording && (
        <button className="remove-import" onClick={stopRecording}>
          Arrêter l'enregistrement
        </button>
      )}

      {/* Recording completed */}
      {audioURL && (
        <div className="file-info">
          <p>Enregistrement terminé</p>
          <audio controls src={audioURL} />
          <button className="remove-import" onClick={resetRecording}>
            Recommencer l'enregistrement
          </button>
          <button className="send-import" onClick={sendRecording}>
            Envoyer l'enregistrement
          </button>
        </div>
      )}

    </div>
  )
}

export default Recorder
