import { useTranslation } from 'react-i18next'
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

import ButtonRecord from './forms/ButtonRecord'



const API_URL = "http://localhost:8000/clonage"

function ClonageVoice({ isAuthenticated }) {
  const { t } = useTranslation()

  const [inputMode, setInputMode] = useState(null)
  const {
    isRecording, audioURL, audioBlob, audioFile,
    recordingTime, fileInputRef,
    startRecording, stopRecording, resetRecording, handleFileChange,
    error, setError,
    // Diarization from hook
    diarization, isDiarizationLoading, diarizationError
  } = useRecording()

  const [clone, setClone] = useState(null)
  const [cloneScore, setCloneScore] = useState(null)    // Score Clone     (by voice recognition)
  const [cloneName, setCloneName] = useState(null)      // Clone name      (by voice recognition)
  const [cloneAudioName, setCloneAudioName] = useState(null) // audio_name (by voice recognition)
  const [loading, setLoading] = useState(false)
  const [errorclone, setErrorclone] = useState(null)
  
  // Selected speaker from diarization: { name, blob, url }
  const [selectedSpeaker, setSelectedSpeaker] = useState(null)

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

  // Get the current audio to use (either from speaker selection or from recording/upload)
  const currentAudioURL = selectedSpeaker?.url || audioURL
  const currentAudioBlob = selectedSpeaker?.blob || audioBlob

  const handleReset = () => {
    resetRecording()
    setInputMode(null)
    setClone(null)
    setCloneScore(null)
    setCloneName(null)
    setCloneAudioName(null)
    setSelectedSpeaker(null)
    setErrorclone(null)
  }

  // Convert base64 audio to Blob and load as selected speaker
  const handleSelectSpeaker = (speakerName, speakerData) => {
    try {
      // Decode base64 to binary
      const binaryString = atob(speakerData.audio)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }
      
      // Create Blob from binary data
      const blob = new Blob([bytes], { type: 'audio/wav' })
      const url = URL.createObjectURL(blob)
      
      // Store the selected speaker
      setSelectedSpeaker({
        name: speakerName,
        blob: blob,
        url: url
      })
    } catch (err) {
      console.error("Error loading speaker audio:", err)
      setErrorclone(t('cloning.error_loading_speaker'))
    }
  }

  const sendClonage = async () => {
    setLoading(true)
    setErrorclone(null)
    setClone(null)
    setCloneScore(null)
    setCloneName(null)
    setCloneAudioName(null)

    try {
      const targetAudio = currentAudioBlob || audioFile
      if (!targetAudio) {
        throw new Error(t('cloning.error_missing_audio'))
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

      if (data.status === "success") {
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
        throw new Error(t('cloning.error_unexpected_response'))
      }

    } catch (err) {
      setErrorclone(err.message || t('cloning.error_clone'))
    } finally {
      setLoading(false)
    }
  }


  return (
    <div className="box clonage-box">
      <div className="clonage-header">
        <h2>{t('cloning.title')}</h2>
        <p className="clonage-subtitle">{t('cloning.subtitle')}</p>
      </div>

      {/* Locked State  */}
      {!isAuthenticated ? (
        <div className="clonage-locked">
          <span className="lock-icon">🔒</span>
          <h3>{t('cloning.locked_title')}</h3>
          <p>{t('cloning.locked_description')}</p>
        </div>
      ) : (
        <>
          {/* Fun CosyVoice3 info */}
          <div className="engine-banner">
            <div className="engine-info">
              <span className="engine-badge">{t('cloning.engine_badge')}</span>
              <h3>{t('cloning.engine_title')}</h3>
              <p>{t('cloning.engine_description')}</p>
            </div>
          </div>

          <div className="clonage-step">
            <span className="step-label">{t('cloning.step1')}</span>

            {!audioURL && !selectedSpeaker && (
              <div className="clonage-mode-selector">
                <button
                  className={`btn-mode ${inputMode === 'record' ? 'active' : ''}`}
                  onClick={() => { setInputMode('record'); resetRecording() }}
                >
                  🎙️ {t('cloning.record_live')}
                </button>
                <button
                  className={`btn-mode ${inputMode === 'import' ? 'active' : ''}`}
                  onClick={() => { setInputMode('import'); resetRecording() }}
                >
                  📁 {t('cloning.import_file')}
                </button>
              </div>
            )}

            {inputMode === 'record' && !audioURL && !selectedSpeaker && (
              <ButtonRecord isRecording={isRecording} audioURL={audioURL} setError={setError} startRecording={startRecording} stopRecording={stopRecording} recordingTime={recordingTime} clonage={true}/>
            )}

            {inputMode === 'import' && !audioURL && !selectedSpeaker && (
              <div className="import-area">
                <input
                  ref={fileInputRef}
                  id="audio-upload-clonage"
                  type="file"
                  accept="audio/*"
                  onChange={(e) => handleFileChange(e, setError)}
                />
                <label htmlFor="audio-upload-clonage" className="button upload-btn">
                  {t('cloning.browse_audio')}
                </label>
              </div>
            )}

            {error && <p className="error-text">{t('common.error_prefix')} {error}</p>}

            {/* Diarization loading state */}
            {audioURL && isDiarizationLoading && (
              <div className="diarization-loading">
                <p>🔄 {t('cloning.analyzing_speakers')}</p>
              </div>
            )}


            {/* Preview Audio */}
            {currentAudioURL && (
              <div className="audio-preview-box">
                <div className="audio-preview-top">
                  <span className="audio-ready-badge">{t('common.success_prefix')} {t('cloning.sample_loaded')} {selectedSpeaker && `(${selectedSpeaker.name})`}</span>
                  <button className="remove-btn" onClick={handleReset}>{t('cloning.change_sample')}</button>
                </div>
                <audio controls src={currentAudioURL} className="custom-audio-player" />
              </div>
            )}

            {/* Diarization error */}
            {diarizationError && (
              <div className="diarization-error">
                <p>{t('common.error_prefix')} {diarizationError}</p>
              </div>
            )}

            {/* Diarization Result - Multiple speakers */}
            {diarization && diarization.issue_info === "several speakers" && !selectedSpeaker && (
              <div className="diarization-result-card">
                <div className="result-header">
                  <span className="warning-icon">⚠️</span>
                  <h3>{t('cloning.multiple_speakers_title')}</h3>
                </div>
                <p>
                  {t('cloning.multiple_speakers_description', { 
                    count: Object.keys(diarization.result).length 
                  })}
                </p>
                <div className="speakers-list">
                  {Object.entries(diarization.result).map(([speakerName, speakerData]) => (
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
                      <button
                        className="button use-speaker-btn"
                        onClick={() => handleSelectSpeaker(speakerName, speakerData)}
                      >
                        {t('common.success_prefix')} {t('cloning.use_speaker')}
                      </button>
                    </div>
                  ))}
                </div>
                <div className="diarization-actions">
                  <button className="button secondary-btn" onClick={handleReset}>
                    {t('cloning.try_other_file')}
                  </button>
                </div>
              </div>
            )}
          </div>

  

          {/* 2. synthesis parameters  */}
          {currentAudioURL && (
            <div className="clonage-step">
              <span className="step-label">{t('cloning.step2')}</span>

              {/* Select Distinct Cloning Method*/}
              <fieldset className="clonage-fieldset">
                <legend>{t('cloning.cloning_method')}</legend>
                <div className="radio-group">
                  <label className="radio-label">
                    <input
                      type="radio" name="method" value="zero_shot"
                      checked={method === "zero_shot"}
                      onChange={() => setMethod("zero_shot")}
                    />
                    <span className="radio-custom">{t('cloning.mode_zeroshot')}</span>
                  </label>

                  <label className="radio-label">
                    <input
                      type="radio" name="method" value="cross_lingual"
                      checked={method === "cross_lingual"}
                      onChange={() => setMethod("cross_lingual")}
                    />
                    <span className="radio-custom">{t('cloning.mode_crosslingual')}</span>
                  </label>

                  <label className="radio-label">
                    <input
                      type="radio" name="method" value="preset_instruct"
                      checked={method === "preset_instruct"}
                      onChange={() => setMethod("preset_instruct")}
                    />
                    <span className="radio-custom">{t('cloning.mode_preset')}</span>
                  </label>

                  <label className="radio-label">
                    <input
                      type="radio" name="method" value="synthesize_instruct"
                      checked={method === "synthesize_instruct"}
                      onChange={() => setMethod("synthesize_instruct")}
                    />
                    <span className="radio-custom">{t('cloning.mode_custom')}</span>
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
                      audioBlob={currentAudioBlob || audioFile}
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
                      {showDocToken ? t('cloning.hide_tokens') : `📖 ${t('cloning.show_tokens')}`}
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
                  {loading ? t('cloning.processing') : t('cloning.clone_button')}
                </button>
              </div>

              {errorclone && (
                <div className="clonage-error-alert">
                  <p><strong>{t('cloning.clone_error_title')}</strong> {errorclone}</p>
                </div>
              )}

              {clone && (
                <div className="clone-result-card">
                  <div className="result-header">
                    <span className="success-pulse"></span>
                    <h3>{t('cloning.result_title')}</h3>
                  </div>
                  <p>{t('cloning.result_description')}</p>
                  <audio controls src={clone} className="custom-audio-player output-player" />

                  {/* Similarity score against database */}
                  {cloneScore !== null && (
                    <div className="clone-score-info">
                      <p>
                        <strong>{t('cloning.database_similarity')}:</strong> {parseFloat(cloneScore).toFixed(3)}
                        {cloneName && (
                          <> — {t('cloning.closest_match')}: <em>{cloneName}</em>
                            {cloneAudioName && <> ({cloneAudioName})</>}
                          </>
                        )}
                      </p>
                    </div>
                  )}

                  <a href={clone} download="cloned_voice_output.wav" className="button download-output-btn">
                    {t('cloning.download_audio')}
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