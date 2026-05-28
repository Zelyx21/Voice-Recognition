/**
 * Props:
 *   audioBlob  {Blob}  The reference audio recorded or imported by the user
 */


import { useState, useEffect } from 'react'
import AudioReferenceForm from './forms/AudioReferenceForm'
import TextSpeedForm      from './forms/TextSpeedForm'
import EmotionStyleForm   from './forms/EmotionStyleForm'
import LanguageForm       from './forms/LanguageForm'
import InstructForm       from './forms/InstructForm'
import { DEFAULT_EMOTION, DEFAULT_SPEAKING_STYLE } from './constants/emotions'
import { DEFAULT_LANGUAGE, DEFAULT_DIALECT }        from './constants/Languages'
 
const API_URL = "http://localhost:8000/clonage"
 
export default function ClonageButtonsCosyVoice({ audioBlob }) {
  const [clone,      setClone]      = useState(null)
  const [loading,    setLoading]    = useState(false)
  const [errorclone, setErrorclone] = useState(null)
  const [loadingASR,    setLoadingASR]    = useState(false)

  const [method, setMethod] = useState("zero_shot")
 
  const [text,  setText]  = useState("You are testing a student project on voice recognition and voice cloning.")
  const [speed, setSpeed] = useState(1.0)
  const [emotion, setEmotion] = useState(DEFAULT_EMOTION)
 
  // zero_shot-only parameters
  const [promptText,    setPromptText]    = useState("")
  const [speakingStyle, setSpeakingStyle] = useState(DEFAULT_SPEAKING_STYLE)
 
  // multilingual-only parameters
  const [language,    setLanguage]    = useState(DEFAULT_LANGUAGE)
  const [dialect,     setDialect]     = useState(DEFAULT_DIALECT)
  const [instruction, setInstruction] = useState("")

  const [emotionOrInstruction, setEmotionOrInstruction] = useState("emotion")

  // Reset result when any parameter changes
  useEffect(() => {
    setClone(null)
    setErrorclone(null)
  }, [method, text, speed, emotion, promptText, speakingStyle, language, dialect, instruction])
 

  
  const sendClonage = async () => {
    if (!audioBlob) return
 
    setLoading(true)
    setErrorclone(null)
 
    const formData = new FormData()
    formData.append("file",        new File([audioBlob], "recording.wav", { type: "audio/wav" }))
    formData.append("model_name",  "CosyVoice")
    formData.append("cloneMethod", method)
    formData.append("cloneText",   text)
    formData.append("textSpeed",   speed)
    formData.append("emotion",     emotion)
 
    if (method === "zero_shot") {
      formData.append("promptText",    promptText)
      formData.append("speakingStyle", speakingStyle)
    } else {
      // multilingual
      formData.append("textLanguage", language)
      formData.append("dialect",      dialect)
      formData.append("instruction",  instruction)
    }
 
    const response = await fetch(API_URL, { method: "POST", body: formData })
 
    if (!response.ok) {
      const data = await response.json()
      setErrorclone(data.issue || data.detail || "Cloning error")
      setLoading(false)
      return
    } else {
      const blob = await response.blob()
      setClone(URL.createObjectURL(blob))
    }
 
    setLoading(false)
  }

 
  // ── Render ────────────────────────────────────────────────────────────────
 
  return (
    <div>
 
      {/* ── Method selector ── */}
      <fieldset>
        <legend>Cloning method</legend>
 
        <label>
          <input
            type="radio" name="cosyMethod" value="zero_shot"
            checked={method === "zero_shot"}
            onChange={() => setMethod("zero_shot")}
          />
          Zero-Shot — same language as reference audio
        </label>
        <p>
          Uses inference_zero_shot by default.
        </p>
 
        <label>
          <input
            type="radio" name="cosyMethod" value="multilingual"
            checked={method === "multilingual"}
            onChange={() => setMethod("multilingual")}
          />
          Multilingual — output in a different language
        </label>
        <p>
          Supports free-text instructions and language/dialect selection.
        </p>
      </fieldset>
 
      {/* ── Shared: text + speed ── */}
      <TextSpeedForm
        text={text}
        speed={speed}
        onChange={({ text: t, speed: s }) => { setText(t); setSpeed(s) }}
      />
 
      {/* ── zero_shot only: emotion + style + reference transcript ── */}
      {method === "zero_shot" && (
        <>
          <EmotionStyleForm
            emotion={emotion}
            speakingStyle={speakingStyle}
            showStyle={true}
            onChange={({ emotion: e, speakingStyle: s }) => { setEmotion(e); setSpeakingStyle(s) }}
          />
          <AudioReferenceForm
            promptText={promptText}
            onChange={setPromptText}
            audioBlob={audioBlob}
          />
        </>
      )}
 
      {/* ── multilingual only: language + dialect + emotion or instruction ── */}
      {method === "multilingual" || method === "synthesize_instruct" && (
        <>
          <LanguageForm
            language={language}
            dialect={dialect}
            onChange={({ language: l, dialect: d }) => { setLanguage(l); setDialect(d) }}
          />

          {/* Toggle: emotion preset vs free-text instruction */}
          <fieldset>
            <legend>Style guidance</legend>
            <label>
              <input
                type="radio" name="emotionOrInstruction" value="emotion"
                checked={emotionOrInstruction === "emotion"}
                onChange={() => {setEmotionOrInstruction("emotion"); setMethod("multi-language")}}
              />
              Use emotion preset
            </label>
            <label>
              <input
                type="radio" name="emotionOrInstruction" value="instruction"
                checked={emotionOrInstruction === "instruction"}
                onChange={() => {setEmotionOrInstruction("instruction"); setMethod("synthesize_instruct")}}
              />
              Use custom instruction
            </label>
          </fieldset>

          {emotionOrInstruction === "emotion" && (
            <EmotionStyleForm
              emotion={emotion}
              speakingStyle={speakingStyle}
              showStyle={false}
              onChange={({ emotion: e, speakingStyle: s}) => { setEmotion(e); setSpeakingStyle(s)}}
            />
          )}

          {emotionOrInstruction === "instruction" && (
            <InstructForm
              instruction={instruction}
              onChange={setInstruction}
            />
          )}
        </>
      )}
 
      {/* ── Submit ── */}
      <button onClick={sendClonage} disabled={!audioBlob || loading}>
        {loading ? "Cloning in progress..." : "Clone voice (CosyVoice)"}
      </button>
 
      {/* ── Error ── */}
      {errorclone && (
        <div className="issue">
          <p>Cloning error: {errorclone}</p>
        </div>
      )}
 
      {/* ── Result ── */}
      {clone && (
        <div className="clone-result">
          <h3>Cloned voice</h3>
          <audio controls src={clone} />
        </div>
      )}
 
    </div>
  )
}