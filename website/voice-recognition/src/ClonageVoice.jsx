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

  const [inputMode, setInputMode] = useState(null)
  const {
    isRecording, audioURL, audioBlob, audioFile,
    recordingTime, fileInputRef,
    startRecording, stopRecording, resetRecording, handleFileChange,
    error, setError,
  } = useRecording()

  const [clone, setClone] = useState(null)
  const [cloneScore, setCloneScore] = useState(null)    // Score Clone     (by voice recognition)
  const [cloneName, setCloneName] = useState(null)      // Clone name      (by voice recognition)
  const [cloneAudioName, setCloneAudioName] = useState(null) // audio_name (by voice recognition)
  const [loading, setLoading] = useState(false)
  const [errorclone, setErrorclone] = useState(null)

  // Diarization : { SPEAKER_00: { audio: "<base64>", duration: float }, ... }
  const [diarization, setDiarization] = useState(null)

  // CosyVoice Parameter States 
  const [method, setMethod] = useState("zero_shot")
  const [text, setText] = useState("You are testing a student project on voice recognition and voice cloning.")
  const [textMultilingual, setTextMultilingual] = useState("You can enter text directly in the language of your choice, with specific performance instructions.")
  const [emotion, setEmotion] = useState("Neutral")
  const [speakingStyle, setSpeakingStyle] = useState("Normal")
  const [instruction, setInstruction] = useState("")
  const [language, setLanguage] = useState("None")
  const [dialect, setDialect] = useState("")
  const [speed, setSpeed] = useState(1.0)
  const [transcriptAudio, setTranscriptAudio] = useState("")

  const [showDocToken, setShowDocToken] = useState(false)

  const handleReset = () => {
    resetRecording()
    setInputMode(null)
    setClone(null)
    setCloneScore(null)
    setCloneName(null)
    setCloneAudioName(null)
    setDiarization(null)
    setErrorclone(null)
  }

  const sendClonage = async () => {
    setLoading(true)
    setErrorclone(null)
    setClone(null)
    setCloneScore(null)
    setCloneName(null)
    setCloneAudioName(null)
    setDiarization(null)

    try {
      const targetAudio = audioBlob || audioFile
      if (!targetAudio) {
        throw new Error("Please provide a voice sample before generating.")
      }

      const formData = new FormData()
      formData.append("file", targetAudio)
      formData.append("cloneMethod", method)
      formData.append("cloneText", method === "textMultilingual" ? textMultilingual : text)
      formData.append("emotion", emotion)
      formData.append("speakingStyle", speakingStyle)
      formData.append("instruction", instruction)
      formData.append("language", language)
      formData.append("dialect", dialect)
      formData.append("textSpeed", speed)
      formData.append("transcriptAudio", transcriptAudio)

      const response = await fetch(API_URL, {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        let detail = `Server error: ${response.status}`
        try {
          const errData = await response.json()
          detail = errData.detail || detail
        } catch {
        }
        throw new Error(detail)
      }

      const data = await response.json()

      if (data.status === "multiple_speakers") {
        setDiarization(data.diarization)
      } 
      else if (data.status === "success") {
        const cloneData = data.data.clone
        const metadata = data.data.metadata

        const base64Response = await fetch(`data:audio/wav;base64,${cloneData.audio}`)
        const blob = await base64Response.blob()
        setClone(URL.createObjectURL(blob))

        setCloneScore(metadata.score_clone !== "N/A" ? metadata.score_clone : null)
        setCloneName(metadata.score_name !== "N/A" ? metadata.score_name : null)
        setCloneAudioName(metadata.score_audio_name !== "N/A" ? metadata.score_audio_name : null)
      } 
      else {
        throw new Error("Unexpected response format from server.")
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

      {/* Locked State  */}
      {!isAuthenticated ? (
        <div className="clonage-locked">
          <span className="lock-icon">🔒</span>
          <h3>Feature Restricted</h3>
          <p>Please log in to your account to unlock voice cloning tools.</p>
        </div>
      ) : (
        <>
          {/* Fun CosyVoice3 info */}
          <div className="engine-banner">
            <div className="engine-info">
              <span className="engine-badge">Active Engine</span>
              <h3>CosyVoice v3</h3>
              <p>Fun-CosyVoice 3.0 is an advanced text-to-speech (TTS) system based on large language models (LLM), surpassing its predecessor (CosyVoice 2.0) in content consistency, speaker similarity, and prosody naturalness. It is designed for zero-shot multilingual speech synthesis in the wild.</p>
            </div>
          </div>

          <div className="clonage-step">
            <span className="step-label">1. Reference Voice Sample</span>

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

            {/* Preview Audio */}
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

          {/* 2. sunthesis parameters  */}
          {audioURL && (
            <div className="clonage-step">
              <span className="step-label">2. Synthesis Parameters</span>

              {/* Select Distinct Cloning Method*/}
              <fieldset className="clonage-fieldset">
                <legend>All Distinct Cloning Method</legend>
                <div className="radio-group">
                  <label className="radio-label">
                    <input
                      type="radio" name="method" value="zero_shot"
                      checked={method === "zero_shot"}
                      onChange={() => setMethod("zero_shot")}
                    />
                    <span className="radio-custom">Zero-Shot</span>
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

              {/* Inputs based on selected method */}
              <div className="form-parameters-grid">
                {method === "zero_shot" && (
                  <>
                    <TextForm text={text} onChange={({ text: t }) => { setText(t) }} />
                    <AudioReferenceForm
                      transcriptAudio={transcriptAudio}
                      onChange={setTranscriptAudio}
                      audioBlob={audioBlob || audioFile}
                    />
                  </>
                )}

                {method === "cross_lingual" && (
                  <>
                    <TextForm text={textMultilingual} onChange={({ textMultilingual: tM }) => { setTextMultilingual(tM) }} />
                    <button
                      type="button"
                      className="doc-toggle-btn"
                      onClick={() => setShowDocToken(!showDocToken)}
                    >
                      {showDocToken ? "Mask tokens guide" : "📖 Show special tokens guide"}
                    </button>

                    {showDocToken && <DocToken />}

                  </>
                )}

                {method === "preset_instruct" && (
                  <>
                    <TextForm text={text} onChange={({ text: t }) => { setText(t) }} />
                    <LanguageForm language={language} onChange={({ language: l, dialect: d }) => { setLanguage(l); setDialect(d) }} />
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
                    <TextForm text={text} onChange={({ text: t }) => { setText(t) }} />
                    <LanguageForm language={language} onChange={({ language: l, dialect: d }) => { setLanguage(l); setDialect(d) }} />
                    <InstructForm instruction={instruction} onChange={({ instruction: i }) => { setInstruction(i) }} />

                  </>
                )}

                {/* Shared Output Controls */}
                <SpeedForm speed={speed} onChange={({ speed: s }) => { setSpeed(s) }} />
              </div>

              {/* Send to API */}
              <div className="clonage-actions">
                <button
                  className="button generate-btn"
                  onClick={sendClonage}
                  disabled={loading}
                >
                  {loading ? "Processing..." : "Execute CosyVoice Synthesis"}
                </button>
              </div>

              {errorclone && (
                <div className="clonage-error-alert">
                  <p><strong>Cloning Process Interrupted:</strong> {errorclone}</p>
                </div>
              )}

              {diarization && (
                <div className="diarization-result-card">
                  <div className="result-header">
                    <span className="warning-icon">⚠️</span>
                    <h3>Multiple Speakers Detected</h3>
                  </div>
                  <p>
                    The audio sample contains <strong>{Object.keys(diarization).length} speakers</strong>.
                    Voice cloning requires a single-speaker recording. Preview each speaker below
                    and re-upload an isolated segment.
                  </p>
                  <div className="speakers-list">
                    {Object.entries(diarization).map(([speakerName, speakerData]) => (
                      <div key={speakerName} className="speaker-item">
                        <div className="speaker-meta">
                          <span className="speaker-label">{speakerName}</span>
                          <span className="speaker-duration">
                            {speakerData.duration.toFixed(1)}s
                          </span>
                        </div>
                        <audio
                          controls
                          src={`data:audio/wav;base64,${speakerData.audio}`}
                          className="custom-audio-player"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {clone && (
                <div className="clone-result-card">
                  <div className="result-header">
                    <span className="success-pulse"></span>
                    <h3>Successfully Cloned Audio Stream</h3>
                  </div>
                  <p>Your target text voice clone has been successfully synthesized.</p>
                  <audio controls src={clone} className="custom-audio-player output-player" />

                  {/* Similarity score against database */}
                  {cloneScore !== null && (
                    <div className="clone-score-info">
                      <p>
                        <strong>Database similarity:</strong> {parseFloat(cloneScore).toFixed(3)}
                        {cloneName && (
                          <> — closest match: <em>{cloneName}</em>
                            {cloneAudioName && <> ({cloneAudioName})</>}
                          </>
                        )}
                      </p>
                    </div>
                  )}

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