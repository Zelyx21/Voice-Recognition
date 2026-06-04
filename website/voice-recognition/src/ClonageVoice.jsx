import { useState } from 'react'
import './App.css'
import './ClonageVoice.css'
import { useApi } from './hooks/useAPI'
import { useRecording } from './hooks/useRecording'
import ClonageUtility from './ClonageUtility.jsx'

const MODELS = [
  {
    id: 'OpenVoice',
    label: 'OpenVoice',
    badge: 'Quick',
    desc: 'Faster, less accurate',
  },
  {
    id: 'CosyVoice',
    label: 'CosyVoice',
    badge: 'Precise',
    desc: 'Takes longer but better',
  },
]

function ClonageVoice({ isAuthenticated }) {
  const [cloningMode, setCloningMode] = useState(null)
  const [inputMode, setInputMode] = useState(null)

  const { call, loading, error, setError } = useApi()
  const {
    isRecording, audioURL, audioBlob, audioFile,
    recordingTime, fileInputRef,
    startRecording, stopRecording, resetRecording, handleFileChange,
  } = useRecording()

  const handleReset = () => {
    resetRecording()
    setInputMode(null)
  }

  return (
    <div className="box clonage-box">
      <div className="clonage-header">
        <h2>Clone a voice</h2>
      </div>

      {!isAuthenticated ? (
        <div className="clonage-locked">
          <span className="lock-icon">🔒</span>
          <p>Please log in to use voice cloning</p>
        </div>
      ) : (
        <>
          {/*MODEL*/}
          <div className="clonage-step">
            <span className="step-label">Choose a model</span>
            <div className="model-cards">
              {MODELS.map((m) => (
                <button
                  key={m.id}
                  className={`model-card ${cloningMode === m.id ? 'model-card--active' : ''}`}
                  onClick={() => { setCloningMode(m.id); handleReset() }}
                >
                  <span className="model-icon">{m.icon}</span>
                  <span className="model-label">{m.label}</span>
                  <span className="model-badge">{m.badge}</span>
                  <span className="model-desc">{m.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {cloningMode && (
            <>
              {/*AUDIO INPUT*/}
              <div className="clonage-step">
                <span className="step-label">Provide a voice sample</span>

                {!audioURL && (
                  <div className="button-group">
                    <button onClick={() => { setInputMode('record'); resetRecording() }}>
                      Record
                    </button>
                    <button onClick={() => { setInputMode('import'); resetRecording() }}>
                      Import file
                    </button>
                  </div>
                )}

                {/* RECORD */}
                {inputMode === 'record' && !audioURL && (
                  <div className="record-area">
                    {!isRecording ? (
                      <button className="button record-btn" onClick={() => { setError(null); startRecording() }}>
                        Start recording
                      </button>
                    ) : (
                      <div className="recording-live">
                        <span className="rec-dot" />
                        <span className="rec-time">
                          {Math.floor(recordingTime / 60)}m {recordingTime % 60}s
                        </span>
                        <button className="remove" onClick={() => stopRecording(setError)}>
                          Stop
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* IMPORT */}
                {inputMode === 'import' && !audioURL && (
                  <div>
                    <input
                      ref={fileInputRef}
                      id="audio-upload-clonage"
                      type="file"
                      accept="audio/*"
                      onChange={(e) => handleFileChange(e, setError)}
                    />
                    <label htmlFor="audio-upload-clonage" className="button">
                      Choose an audio file
                    </label>
                  </div>
                )}

                {error && <p className="error-text">{error}</p>}

                {/* PREVIEW */}
                {audioURL && (
                  <div className="audio-preview">
                    <div className="audio-preview-top">
                      <span className="audio-ready-badge">Audio ready</span>
                      <button className="remove" onClick={handleReset}>Remove</button>
                    </div>
                    <audio controls src={audioURL} />
                  </div>
                )}
              </div>

              {/*CLONE*/}
              {audioURL && (
                <div className="clonage-step">
                  <span className="step-label">Configure &amp; clone</span>
                  <ClonageUtility
                    audioBlob={audioBlob || audioFile}
                    cloningMode={cloningMode}
                  />
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}

export default ClonageVoice