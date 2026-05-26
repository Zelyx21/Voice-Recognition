import { useState, useEffect } from 'react'

const EMOTIONS = [
  "NEUTRAL", "HAPPY", "SAD", "ANGRY", "EXCITED",
  "FEARFUL", "SURPRISED", "DISGUSTED", "CALM", "CONFUSED",
  "EMPATHETIC", "DEPRESSED"
]

const SPEAKING_STYLES = [
  "NORMAL", "WHISPER", "SHOUT", "STORYTELLING", "NEWS",
  "COMMERCIAL", "CHILD", "ELDER", "MYSTERIOUS", "GENTLE",
  "AUTHORITATIVE", "WARM", "LIVELY"
]

export default function ClonageButtonCosyVoice({ audioBlob }) {
  const [clone, setClone]         = useState(null)
  const [loading, setLoading]     = useState(false)
  const [errorclone, setErrorclone] = useState(null)

  const [params, setParams] = useState({
    text:          "You are testing a student project on voice recognition and voice cloning.",
    promptText:    "",   // transcription exacte de l'audio de référence
    emotion:       "NEUTRAL",
    speakingStyle: "NORMAL",
    speed:         1.0,
  })

  useEffect(() => {
    setLoading(false)
    setErrorclone(null)
    setClone(null)
  }, [params])

  const handleChange = (field, value) => {
    setParams(prev => ({ ...prev, [field]: value }))
  }

  const sendClonage = async () => {
    if (!audioBlob) return

    setLoading(true)
    setErrorclone(null)

    const formData = new FormData()
    formData.append("file", new File([audioBlob], "recording.wav", { type: 'audio/wav' }))
    formData.append("model_name",      "CosyVoice")
    formData.append("cloneText",       params.text)
    formData.append("promptText",      params.promptText)
    formData.append("emotion",         params.emotion)
    formData.append("speakingStyle",   params.speakingStyle)
    formData.append("textSpeed",       params.speed)

    const response = await fetch("http://localhost:8000/clonage", {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      const data = await response.json()
      setErrorclone(data.issue || data.detail || "Cloning error")
      setLoading(false)
    } else {
      const blob = await response.blob()
      setClone(URL.createObjectURL(blob))
      setLoading(false)
    }
  }

  return (
    <div>

      {/* Texte à synthétiser */}
      <label>
        Text to synthesize:
        <input
          type="text"
          value={params.text}
          onChange={(e) => handleChange("text", e.target.value)}
        />
      </label>

      <label>
        Reference audio transcript:
        <input
          type="text"
          value={params.promptText}
          placeholder="Exact transcript of your reference audio (required for best quality)"
          onChange={(e) => handleChange("promptText", e.target.value)}
        />
      </label>

      {/* Émotion */}
      <label>
        Emotion:
        <select value={params.emotion} onChange={(e) => handleChange("emotion", e.target.value)}>
          {EMOTIONS.map(e => (
            <option key={e} value={e}>{e.charAt(0) + e.slice(1).toLowerCase()}</option>
          ))}
        </select>
      </label>

      {/* Style */}
      <label>
        Speaking style:
        <select value={params.speakingStyle} onChange={(e) => handleChange("speakingStyle", e.target.value)}>
          {SPEAKING_STYLES.map(s => (
            <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>
          ))}
        </select>
      </label>

      {/* Vitesse */}
      <label>
        Speed: {params.speed}x
        <input
          type="range" min="0.5" max="2.0" step="0.05"
          value={params.speed}
          onChange={(e) => handleChange("speed", parseFloat(e.target.value))}
        />
      </label>

      <button onClick={sendClonage} disabled={!audioBlob || loading}>
        {loading ? "Clonage in progress..." : "Voice Clonage (CosyVoice)"}
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