import { useState } from 'react'

function ClonageButton({ audioBlob, modelName }) {
  const [clone, setClone] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const sendClonage = async () => {
    if (!audioBlob) return

    setLoading(true)
    const formData = new FormData()
    formData.append("file", new File([audioBlob], "recording.wav", { type: 'audio/wav' }))
    formData.append("model_name", modelName)

    const response = await fetch("http://localhost:8000/clonage", {
      method: "POST",
      body: formData,
    })

    const blob = await response.blob();

    const url = URL.createObjectURL(blob);
    setClone(url);
    setLoading(false)


  }

  return (
    <div>
      <button className="send-clonage" onClick={sendClonage} disabled={!audioBlob || loading}>
        {loading ? "Clonage in progress..." : "Voice Clonage"}
      </button>

      {clone && (
        <div className="clone-result">
          <h3>Cloned voice :</h3>
          <audio controls src={clone} />
        </div>
      )}
    </div>
  )
}

export default ClonageButton

