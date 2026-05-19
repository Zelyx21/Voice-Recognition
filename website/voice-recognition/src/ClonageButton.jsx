import { useState, useEffect } from 'react'
import ClonageForm from './ClonageForm'

export default function ClonageButton({ audioBlob }) {
  const [clone, setClone]     = useState(null)
  const [loading, setLoading] = useState(false)
  const [errorclone, setErrorclone] = useState(null)

  const [params, setParams]   = useState({
    speed: 1.0,
    language: "EN_NEWEST",
    speaker: "EN-Newest",
    text: "Did you ever hear a folk tale about a giant turtle?"
  })

  useEffect(() => {
    setLoading(false)
    setErrorclone(null)
    setClone(null)
  }, [params])

  const sendClonage = async () => {
    if (!audioBlob) return

    setLoading(true)
    setErrorclone(null)

    const formData = new FormData()
    formData.append("file", new File([audioBlob], "recording.wav", { type: 'audio/wav' }))
    formData.append("model_name", "OpenVoice")
    formData.append("textSpeed", params.speed)
    formData.append("textLanguage", params.language)
    formData.append("cloneNationality", params.speaker)
    formData.append("cloneText", params.text)

    const response = await fetch("http://localhost:8000/clonage", {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      const data = await response.json()

      console.log(data)

      setErrorclone(
        data.issue ||
        data.detail ||
        "Unknown cloning error"
      )

      setLoading(false)
      
    }else{
      const blob = await response.blob()
      setClone(URL.createObjectURL(blob))
      setLoading(false)
    }

  
  }
  return (
    <div>
      <ClonageForm onChange={setParams} />

      <button onClick={sendClonage} disabled={!audioBlob || loading}>
        {loading ? "Clonage in progress..." : "Voice Clonage"}
      </button>

      {errorclone && (
        <div className="issue">
          <p>Clonage error: {errorclone}</p>
        </div>
      )}

      {clone && (
        <div className="clone-result">
          <h3>Cloned voice:</h3>
          <audio controls src={clone} />
        </div>
      )}
    </div>
  )
}