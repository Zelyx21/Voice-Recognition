import { useState } from 'react'

function ClonageButton({ audioBlob }) {
  const [clones, setClones] = useState({})
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const sendClonage = async () => {
    if (!audioBlob) return

    setLoading(true)
    const formData = new FormData()
    formData.append("file", new File([audioBlob], "recording.wav", { type: 'audio/wav' }))

    const response = await fetch("http://localhost:8000/clonage", {
      method: "POST",
      body: formData,
    })

    const data = await response.json()
    setResult(data)

    const audioURLs = {}
    for (const [speaker, info] of Object.entries(data.clones)) {
      const binary = atob(info.audio_b64)
      const bytes = new Uint8Array(binary.length)
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i)
      }
      const blob = new Blob([bytes], { type: 'audio/wav' })
      audioURLs[speaker] = URL.createObjectURL(blob)
    }

    setClones(audioURLs)
    setLoading(false)
  }

  return (
    <div>
      <button className="send-clonage" onClick={sendClonage} disabled={!audioBlob || loading}>
        {loading ? "Clonage in progress..." : "Voice Clonage"}
      </button>

      {Object.keys(clones).length > 0 && (
        <div className="clones-result">
          <h3>Cloned voices :</h3>
          {Object.entries(clones).map(([speaker, url]) => (
            <div key={speaker}>
              <p>{speaker}</p>
              <audio controls src={url} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default ClonageButton

