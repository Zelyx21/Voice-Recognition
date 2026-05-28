import { useState, useEffect } from 'react'
import './ClonageVoice.css'

const LANGUAGES = [
  { value: 'EN_NEWEST', label: 'English (Newest)' },
  { value: 'EN',        label: 'English' },
  { value: 'FR',        label: 'French' },
  { value: 'ES',        label: 'Spanish' },
  { value: 'ZH',        label: 'Chinese' },
  { value: 'JP',        label: 'Japanese' },
  { value: 'KR',        label: 'Korean' },
]

const SPEAKERS = {
  EN_NEWEST: ['EN-Newest'],
  EN:        ['EN-US', 'EN-BR', 'EN-AU', 'EN-Default'],
  FR:        ['FR'],
  ES:        ['ES'],
  ZH:        ['ZH'],
  JP:        ['JP'],
  KR:        ['KR'],
}

const DEFAULT_PARAMS = {
  text: 'Did you ever hear a folk tale about a giant turtle?',
  language: 'EN_NEWEST',
  speaker: 'EN-Newest',
  speed: 1.0,
}

export default function ClonageUtility({ audioBlob, cloningMode }) {
  const [params, setParams] = useState(DEFAULT_PARAMS)
  const [clone, setClone]   = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState(null)

  useEffect(() => {
    setClone(null)
    setError(null)
  }, [params, audioBlob])

  const set = (key, value) => setParams(prev => ({ ...prev, [key]: value }))

  const handleLanguageChange = (lang) => {
    const speaker = SPEAKERS[lang][0]
    setParams(prev => ({ ...prev, language: lang, speaker }))
  }

  const sendClonage = async () => {
    if (!audioBlob) return
    setLoading(true)
    setError(null)

    const formData = new FormData()
    formData.append('file', new File([audioBlob], 'recording.wav', { type: 'audio/wav' }))
    formData.append('textSpeed', params.speed)
    formData.append('textLanguage', params.language)
    formData.append('cloneNationality', params.speaker)
    formData.append('cloneText', params.text)
    formData.append('model_name', cloningMode)

    try {
      const response = await fetch('http://localhost:8000/clonage', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.issue || data.detail || 'Cloning error')
      } else {
        const blob = await response.blob()
        setClone(URL.createObjectURL(blob))
      }
    } catch {
      setError('No access to server')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="clonage-panel">
      {/* Text */}
      <div className="param-group">
        <label className="param-label">Text to read</label>
        <input
          type="text"
          value={params.text}
          onChange={(e) => set('text', e.target.value)}
          placeholder="Enter the text to be spoken..."
        />
      </div>

      {/* Language + Speaker */}
      <div className="param-row">
        <div className="param-group">
          <label className="param-label">Language</label>
          <select
            value={params.language}
            onChange={(e) => handleLanguageChange(e.target.value)}
          >
            {LANGUAGES.map((l) => (
              <option key={l.value} value={l.value}>{l.label}</option>
            ))}
          </select>
        </div>

        <div className="param-group">
          <label className="param-label">Accent / Speaker</label>
          <select
            value={params.speaker}
            onChange={(e) => set('speaker', e.target.value)}
          >
            {SPEAKERS[params.language].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Speed */}
      <div className="param-group">
        <label className="param-label">
          Speed
          <span className="speed-value">{params.speed.toFixed(2)}×</span>
        </label>
        <input
          type="range"
          min="0.25" max="2.5" step="0.05"
          value={params.speed}
          onChange={(e) => set('speed', parseFloat(e.target.value))}
          className="speed-slider"
        />
        <div className="speed-range-labels">
          <span>0.25×</span>
          <span>1×</span>
          <span>2.5×</span>
        </div>
      </div>

      {/* Clone button */}
      <button
        className="button clone-btn"
        onClick={sendClonage}
        disabled={!audioBlob || loading}
      >
        {loading ? (
          <><span className="spinner" /> Cloning in progress…</>
        ) : (
          'Generate clone'
        )}
      </button>

      {error && <p className="error-text">{error}</p>}

      {/* Result */}
      {clone && (
        <div className="clone-result">
          <span className="audio-ready-badge">Clone generated</span>
          <audio controls src={clone} />
          <a href={clone} download="cloned_voice.wav" className="button download-btn">
            Download
          </a>
        </div>
      )}
    </div>
  )
}