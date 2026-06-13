import { useState } from 'react'

const TRANSCRIBE_URL = "http://localhost:8000/ASR"

export default function AudioReferenceForm({ transcriptAudio, onChange, audioBlob }) {
  const [suggestion,   setSuggestion]   = useState(null)
  const [transcribing, setTranscribing] = useState(false)
  const [error,        setError]        = useState(null)

  const transcribe = async () => {
    if (!audioBlob) return
    setTranscribing(true)
    setError(null)
    setSuggestion(null)
    onChange("tete<f sef")
    try{
    const formData = new FormData()
    formData.append("file", new File([audioBlob], "recording.wav", { type: "audio/wav" }))

    const response = await fetch(TRANSCRIBE_URL, { method: "POST", body: formData })

    if (!response.ok) {
      const data = await response.json()
      setError(data.detail || "Transcription failed")
    } else {
      const data = await response.json()
      setSuggestion(data.transcript)
    }
  }catch (err) {
    console.error("Fetch error:", err)
    setError("Network error: Unable to reach the backend server or CORS issue.")
  } finally {
    setTranscribing(false)
  }
  }

  return (
    <div>
      <label htmlFor="promptText">Reference audio transcript</label>
      <p>Type the exact words spoken in your reference audio recording.</p>

      <input
        id="promptText"
        type="text"
        value={transcriptAudio}
        placeholder="e.g. Hello, my name is Alice and I am recording this sample."
        onChange={(e) => onChange(e.target.value)}
      />

      {/* ── Bouton transcription auto ── */}
      <button
        onClick={transcribe}
        disabled={!audioBlob || transcribing}
        type="button"
      >
        {transcribing ? "Transcribing..." : "Auto-transcribe reference audio"}
      </button>

      {/* ── Suggestion Whisper ── */}
      {suggestion && (
        <div>
          <p><em>{suggestion}</em></p>
          <button
            type="button"
            onClick={() => { onChange(suggestion); setSuggestion(null) }}
          >
            Use this transcript
          </button>
          <button
            type="button"
            onClick={() => setSuggestion(null)}
          >
            ✗ Dismiss
          </button>
        </div>
      )}

      {error && <p style={{ color: "red" }}>{error}</p>}

      {!transcriptAudio && !suggestion && (
        <p>
          Leaving this empty will reduce clone quality.
        </p>
      )}
    </div>
  )
}