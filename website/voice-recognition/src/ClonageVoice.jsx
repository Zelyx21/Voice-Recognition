import { useState } from 'react'
import './styles/ClonageVoice.css'
import { useRecording } from './hooks/useRecording'

// Import sub-forms used by the CosyVoice configuration layout
import AudioReferenceForm from './forms/AudioReferenceForm'
import TextForm from './forms/TextForm'
import EmotionStyleForm from './forms/EmotionStyleForm'
import LanguageForm from './forms/LanguageForm'
import InstructForm from './forms/InstructForm'
import SpeedForm from './forms/SpeedForm'
import DocToken from './forms/DocToken'

const API_URL = "http://localhost:8000/clonage"

function ClonageVoice({ isAuthenticated }) {
  // ─── Input & Recording States ───
  const [inputMode, setInputMode] = useState(null)
  const {
    isRecording, audioURL, audioBlob, audioFile,
    recordingTime, fileInputRef,
    startRecording, stopRecording, resetRecording, handleFileChange,
    error, setError,
  } = useRecording()

  // ─── CosyVoice Generation States ───
  const [clone, setClone] = useState(null)
  const [loading, setLoading] = useState(false)
  const [errorclone, setErrorclone] = useState(null)
  
  // ─── CosyVoice Parameter States ───
  const [method, setMethod] = useState("zero_shot")
  const [text, setText] = useState("You are testing a student project on voice recognition and voice cloning.")
  const [textMultilingual, setTextMultilingual] = useState("You can enter text directly in the language of your choice, with specific performance instructions.")
  const [emotion, setEmotion] = useState("Neutral")
  const [speakingStyle, setSpeakingStyle] = useState("Normal")
  const [instruction, setInstruction] = useState("")
  const [language, setLanguage] = useState("en")
  const [speed, setSpeed] = useState(1.0)

  // Full reset of audio inputs and generation results
  const handleReset = () => {
    resetRecording()
    setInputMode(null)
    setClone(null)
    setErrorclone(null)
  }

  // API Call to trigger voice cloning process
  const sendClonage = async () => {
    setLoading(true)
    setErrorclone(null)
    setClone(null)

    try {
      const targetAudio = audioBlob || audioFile
      if (!targetAudio) {
        throw new Error("Please provide a voice sample before generating.")
      }

      const formData = new FormData()
      formData.append("audio", targetAudio)
      formData.append("method", method)
      formData.append("text", method === "zero_shot" ? text : textMultilingual)
      formData.append("emotion", emotion)
      formData.append("speakingStyle", speakingStyle)
      formData.append("instruction", instruction)
      formData.append("language", language)
      formData.append("speed", speed)

      const response = await fetch(API_URL, {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`Server returned an error status: ${response.status}`)
      }

      const data = await response.json()
      if (data.audio_url) {
        setClone(data.audio_url)
      } else {
        throw new Error("Invalid response scheme from generation server.")
      }
    } catch (err) {
      setErrorclone(err.message || "An unexpected error occurred during cloning.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="box clonage-box">
      <div className="clonage-header">
        <h2>AI Voice Cloning</h2>
        <p className="clonage-subtitle">Create a digital replica of any target voice sample.</p>
      </div>

      {/* ─── Locked State (Unauthenticated Users) ─── */}
      {!isAuthenticated ? (
        <div className="clonage-locked">
          <span className="lock-icon">🔒</span>
          <h3>Feature Restricted</h3>
          <p>Please log in to your account to unlock voice cloning tools.</p>
        </div>
      ) : (
        <>
          {/* Active Pipeline Status Card */}
          <div className="engine-banner">
            <div className="engine-info">
              <span className="engine-badge">Active Engine</span>
              <h3>CosyVoice v3</h3>
              <p>Zero-shot cross-lingual voice synthesis with accuracy controls.</p>
            </div>
          </div>

          {/* ─── Step 1: Target Voice Sample Input ─── */}
          <div className="clonage-step">
            <span className="step-label">1. Reference Voice Sample</span>

            {/* Input Selection Trigger Buttons */}
            {!audioURL && (
              <div className="clonage-mode-selector">
                <button 
                  className={`btn-mode ${inputMode === 'record' ? 'active' : ''}`}
                  onClick={() => { setInputMode('record'); resetRecording() }}
                >
                  🎙️ Record Sample Live
                </button>
                <button 
                  className={`btn-mode ${inputMode === 'import' ? 'active' : ''}`}
                  onClick={() => { setInputMode('import'); resetRecording() }}
                >
                  📁 Import Audio File
                </button>
              </div>
            )}

            {/* Microphone Recording Layout */}
            {inputMode === 'record' && !audioURL && (
              <div className="record-area">
                {!isRecording ? (
                  <button
                    className="button record-btn"
                    onClick={() => { setError(null); startRecording() }}
                  >
                    Start Recording
                  </button>
                ) : (
                  <div className="recording-live">
                    <span className="rec-dot" />
                    <span className="rec-time">
                      {Math.floor(recordingTime / 60)}m {recordingTime % 60}s
                    </span>
                    <button className="remove-btn-action" onClick={() => stopRecording(setError)}>
                      Stop
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Local System File Upload Layout */}
            {inputMode === 'import' && !audioURL && (
              <div className="import-area">
                <input
                  ref={fileInputRef}
                  id="audio-upload-clonage"
                  type="file"
                  accept="audio/*"
                  onChange={(e) => handleFileChange(e, setError)}
                />
                <label htmlFor="audio-upload-clonage" className="button upload-btn">
                  Browse Audio Files
                </label>
              </div>
            )}

            {error && <p className="error-text">⚠️ {error}</p>}

            {/* Live Audio Source Preview Component */}
            {audioURL && (
              <div className="audio-preview-box">
                <div className="audio-preview-top">
                  <span className="audio-ready-badge">✓ Sample Loaded</span>
                  <button className="remove-btn" onClick={handleReset}>Change Sample</button>
                </div>
                <audio controls src={audioURL} className="custom-audio-player" />
              </div>
            )}
          </div>

          {/* ─── Step 2: Advanced Parameters Configuration (Triggered when sample is ready) ─── */}
          {audioURL && (
            <div className="clonage-step">
              <span className="step-label">2. Synthesis Parameters</span>

              {/* Inference Generation Engine Method Selectors */}
              <fieldset className="clonage-fieldset">
                <legend>Inference Pipeline Method</legend>
                <div className="radio-group">
                  <label className="radio-label">
                    <input
                      type="radio" name="method" value="zero_shot"
                      checked={method === "zero_shot"}
                      onChange={() => setMethod("zero_shot")}
                    />
                    <span className="radio-custom">Zero-Shot (Default)</span>
                  </label>

                  <label className="radio-label">
                    <input
                      type="radio" name="method" value="cross_lingual"
                      checked={method === "cross_lingual"}
                      onChange={() => setMethod("cross_lingual")}
                    />
                    <span className="radio-custom">Cross-Lingual</span>
                  </label>

                  <label className="radio-label">
                    <input
                      type="radio" name="method" value="preset_instruct"
                      checked={method === "preset_instruct"}
                      onChange={() => setMethod("preset_instruct")}
                    />
                    <span className="radio-custom">Preset Instruct</span>
                  </label>

                  <label className="radio-label">
                    <input
                      type="radio" name="method" value="synthesize_instruct"
                      checked={method === "synthesize_instruct"}
                      onChange={() => setMethod("synthesize_instruct")}
                    />
                    <span className="radio-custom">Custom Instruction</span>
                  </label>
                </div>
              </fieldset>

              {/* Dynamic Contextual Inputs Based on Selected Method */}
              <div className="form-parameters-grid">
                {method === "zero_shot" && (
                  <>
                    <TextForm text={text} onChange={setText} />
                    <AudioReferenceForm />
                  </>
                )}

                {method === "cross_lingual" && (
                  <>
                    <TextForm text={textMultilingual} onChange={setTextMultilingual} />
                    <LanguageForm language={language} onChange={setLanguage} />
                  </>
                )}

                {method === "preset_instruct" && (
                  <>
                    <TextForm text={text} onChange={setText} />
                    <EmotionStyleForm
                      emotion={emotion}
                      speakingStyle={speakingStyle}
                      showStyle={true}
                      onChange={({ emotion: e, speakingStyle: s }) => { setEmotion(e); setSpeakingStyle(s); }}
                    />
                  </>
                )}

                {method === "synthesize_instruct" && (
                  <>
                    <TextForm text={text} onChange={setText} />
                    <InstructForm instruction={instruction} onChange={setInstruction} />
                  </>
                )}

                {/* Shared Output Controls */}
                <SpeedForm speed={speed} onChange={setSpeed} />
              </div>

              {/* ─── Step 3: Execution Controls ─── */}
              <div className="clonage-actions">
                <button 
                  className="button generate-btn" 
                  onClick={sendClonage} 
                  disabled={loading}
                >
                  {loading ? "Processing Neural Matrix..." : "Execute CosyVoice Synthesis"}
                </button>
              </div>

              {/* Operational Errors Display */}
              {errorclone && (
                <div className="clonage-error-alert">
                  <p><strong>Cloning Process Interrupted:</strong> {errorclone}</p>
                </div>
              )}

              {/* Generated Audio Payload Target Display Area */}
              {clone && (
                <div className="clone-result-card">
                  <div className="result-header">
                    <span className="success-pulse"></span>
                    <h3>Successfully Cloned Audio Stream</h3>
                  </div>
                  <p>Your target text voice clone has been successfully synthesized.</p>
                  <audio controls src={clone} className="custom-audio-player output-player" />
                  <a href={clone} download="cloned_voice_output.wav" className="button download-output-btn">
                    Download Audio Waveform (.wav)
                  </a>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default ClonageVoice