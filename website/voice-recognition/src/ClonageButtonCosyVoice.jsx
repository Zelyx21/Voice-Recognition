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

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "zh", label: "Chinese (Mandarin)" },
  { value: "ja", label: "Japanese" },
  { value: "ko", label: "Korean" },
  { value: "yue", label: "Cantonese" },
]

const DIALECTS = {
  zh: ["", "Cantonese", "Sichuanese", "Shanghainese", "Hokkien"],
  en: ["", "American", "British", "Australian"],
  ja: [],
  ko: [],
  yue: [],
}

export default function ClonageButtonCosyVoice({ audioBlob }) {
  const [clone, setClone]           = useState(null)
  const [loading, setLoading]       = useState(false)
  const [errorclone, setErrorclone] = useState(null)

  // méthode : "zero_shot" ou "multilingual"
  const [method, setMethod] = useState("zero_shot")

  const [params, setParams] = useState({
    // commun
    text:          "You are testing a student project on voice recognition and voice cloning.",
    emotion:       "NEUTRAL",
    speed:         1.0,
    // zero_shot uniquement
    promptText:    "",
    speakingStyle: "NORMAL",
    // multilingual uniquement
    language:      "en",
    dialect:       "",
  })

  useEffect(() => {
    setLoading(false)
    setErrorclone(null)
    setClone(null)
  }, [params, method])

  const handleChange = (field, value) => {
    setParams(prev => ({ ...prev, [field]: value }))
  }

  const handleMethodChange = (newMethod) => {
    setMethod(newMethod)
    setClone(null)
    setErrorclone(null)
  }

  const sendClonage = async () => {
    if (!audioBlob) return

    setLoading(true)
    setErrorclone(null)

    const formData = new FormData()
    formData.append("file",        new File([audioBlob], "recording.wav", { type: 'audio/wav' }))
    formData.append("model_name",  "CosyVoice")
    formData.append("cloneText",   params.text)
    formData.append("emotion",     params.emotion)
    formData.append("textSpeed",   params.speed)
    formData.append("cloneMethod", method)

    if (method === "zero_shot") {
      formData.append("promptText",    params.promptText)
      formData.append("speakingStyle", params.speakingStyle)
    } else {
      formData.append("textLanguage",  params.language)
      formData.append("dialect",       params.dialect)
    }

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

  const dialectOptions = DIALECTS[params.language] || []

  return (
    <div>

      {/* Choix de méthode */}
      <div>
        <label>
          <input
            type="radio"
            name="cosyMethod"
            value="zero_shot"
            checked={method === "zero_shot"}
            onChange={() => handleMethodChange("zero_shot")}
          />
          Same language (Zero-Shot)
        </label>
        <label>
          <input
            type="radio"
            name="cosyMethod"
            value="multilingual"
            checked={method === "multilingual"}
            onChange={() => handleMethodChange("multilingual")}
          />
          Multilingual
        </label>
      </div>

      {/* Texte à synthétiser — commun */}
      <label>
        Text to synthesize:
        <input
          type="text"
          value={params.text}
          onChange={(e) => handleChange("text", e.target.value)}
        />
      </label>

      {/* Émotion — commun */}
      <label>
        Emotion:
        <select value={params.emotion} onChange={(e) => handleChange("emotion", e.target.value)}>
          {EMOTIONS.map(e => (
            <option key={e} value={e}>{e.charAt(0) + e.slice(1).toLowerCase()}</option>
          ))}
        </select>
      </label>

      {/* Vitesse — commun */}
      <label>
        Speed: {params.speed}x
        <input
          type="range" min="0.5" max="2.0" step="0.05"
          value={params.speed}
          onChange={(e) => handleChange("speed", parseFloat(e.target.value))}
        />
      </label>

      {/* Paramètres Zero-Shot */}
      {method === "zero_shot" && (
        <>
          <label>
            Reference audio transcript:
            <input
              type="text"
              value={params.promptText}
              placeholder="Exact transcript of your reference audio (required for best quality)"
              onChange={(e) => handleChange("promptText", e.target.value)}
            />
          </label>

          <label>
            Speaking style:
            <select value={params.speakingStyle} onChange={(e) => handleChange("speakingStyle", e.target.value)}>
              {SPEAKING_STYLES.map(s => (
                <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>
              ))}
            </select>
          </label>
        </>
      )}

      {/* Paramètres Multilingual */}
      {method === "multilingual" && (
        <>
          <label>
            Target language:
            <select value={params.language} onChange={(e) => {
              handleChange("language", e.target.value)
              handleChange("dialect", "")
            }}>
              {LANGUAGES.map(l => (
                <option key={l.value} value={l.value}>{l.label}</option>
              ))}
            </select>
          </label>

          {dialectOptions.length > 1 && (
            <label>
              Dialect / Accent:
              <select value={params.dialect} onChange={(e) => handleChange("dialect", e.target.value)}>
                {dialectOptions.map(d => (
                  <option key={d} value={d}>{d || "Standard"}</option>
                ))}
              </select>
            </label>
          )}
        </>
      )}

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