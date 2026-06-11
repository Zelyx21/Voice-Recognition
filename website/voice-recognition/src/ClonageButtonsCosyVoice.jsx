/**
 * Props:
 *   audioBlob  {Blob}  The reference audio recorded or imported by the user
 */


import { useState, useEffect } from 'react'
import AudioReferenceForm from './forms/AudioReferenceForm'
import TextForm      from './forms/TextForm'
import EmotionStyleForm   from './forms/EmotionStyleForm'
import LanguageForm       from './forms/LanguageForm'
import InstructForm       from './forms/InstructForm'
import SpeedForm       from './forms/SpeedForm'
import DocToken from './forms/DocToken'

const API_URL = "http://localhost:8000/clonage"
 
export default function ClonageButtonsCosyVoice({ audioBlob }) {
  const [clone,      setClone]      = useState(null)
  const [loading,    setLoading]    = useState(false)
  const [errorclone, setErrorclone] = useState(null)
  const [loadingASR,    setLoadingASR]    = useState(false)

  const [method, setMethod] = useState("zero_shot")
 
  const [text,  setText]  = useState("You are testing a student project on voice recognition and voice cloning.")
  const placeholder = "You are testing a student project on voice recognition and voice cloning."
  const [textMultilingual,  setTextMultilingual]  = useState("Vous pouvez entrez le texte [breath], directement dans la langue de votre choix.[laughter] Avec notamment des instructions quand à sa lecture !")
  const placeholderMultilingual = "Vous pouvez entrez le texte [breath], directement dans la langue de votre choix.[laughter] Avec notamment des instructions quand à sa lecture !"

  const [speed, setSpeed] = useState(1.0)
  const [emotion, setEmotion] = useState("NEUTRAL")
 
  // zero_shot-only parameters
  const [promptText,    setPromptText]    = useState("")
  const [speakingStyle, setSpeakingStyle] = useState("NORMAL")
 
  // multilingual-only parameters
  const [language,    setLanguage]    = useState("None")
  const [dialect,     setDialect]     = useState("")
  const [instruction, setInstruction] = useState("")

  const [showDoc, setShowDoc] = useState(false)

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
 
    if (method === "zero_shot") {
      formData.append("cloneText",   text)
      formData.append("textSpeed",   speed)
      formData.append("transcriptAudio",    promptText)

    } else if(method === "multilingual") {
      formData.append("cloneText",  textMultilingual)

    } else {
        formData.append("cloneText",   text)
        formData.append("textSpeed",   speed)
        formData.append("language",   language) 
        formData.append("dialect",   dialect)  

        if (method === "synthesize_instruct") {
          formData.append("instruction",   instruction)

        } else if (method === "preset_instruct"){
        formData.append("emotion",     emotion)
        formData.append("speakingStyle", speakingStyle)

        } 
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
 // This is a voice recognition project [breath] that also allows voice cloning. [laughter] For this project, [sigh] we used several preexisting models [lipsmack]. Thanks you ! 

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
          Uses inference_zero_shot by default. It clones the voice with the same language
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
          Supports precise text and language/dialect selection.
        </p>

        <label>
          <input
            type="radio" name="cosyMethod" value="synthesize_instruct"
            checked={method === "synthesize_instruct" || method === "preset_instruct"}
            onChange={() => setMethod("synthesize_instruct")}
          />
          Instruction-based — custom style guidance
        </label>
        <p>
          Supports instruction.
        </p>
      </fieldset>
 
      {/* ── zero_shot only: emotion + style + reference transcript ── */}
      {method === "zero_shot" && (
        <>
          <TextForm
            text={text}
            placeholder={placeholder}
            onChange={({ text: t }) => { setText(t) }}
          />
 
          <AudioReferenceForm
            promptText={promptText}
            onChange={setPromptText}
            audioBlob={audioBlob}
          />
          <SpeedForm
            speed={speed}
            onChange={({ speed: s }) => { setSpeed(s) }}
          />

        </>
      )}

      {method === "multilingual" && (
        <>
          <button
            type="button"
            className="ButtonDoc"
            onClick={() => setShowDoc(!showDoc)}
          >
            {showDoc ? "▲ Hide Special Tokens Guide" : "▼ Show Special Tokens Guide"}
          </button>

          {showDoc && <DocToken/>}
          <TextForm
            text={textMultilingual}
            placeholder={placeholderMultilingual}
            onChange={({ text: tM }) => { setTextMultilingual(tM) }}
          />
        </>
      )}
 
      {/* ── multilingual only: language + dialect + emotion or instruction ── */}
      {(method === "preset_instruct" || method === "synthesize_instruct") && (
          <>
          <TextForm
            text={text}
            placeholder={placeholder}
            onChange={({ text: t }) => { setText(t) }}
          />

          <SpeedForm
            speed={speed}
            onChange={({ speed: s }) => { setSpeed(s) }}
          />
        
          <LanguageForm
            language={language}
            dialect={dialect}
            onChange={({ language: l, dialect: d }) => { setLanguage(l); setDialect(d) }}
          />

          {/* Toggle: emotion preset vs free-text instruction */}
          <fieldset>
            <legend>Method instruction</legend>
            <label>
              <input
                type="radio" name="method_instruction" value="instruction"
                checked={method === "synthesize_instruct"}
                onChange={() => { setMethod("synthesize_instruct")}}
              />
              Use custom instruction
            </label>

            <label>
              <input
                type="radio" name="method_instruction" value="preset_instruct"
                checked={method === "preset_instruct"}
                onChange={() => {setMethod("preset_instruct")}}
              />
              Use preset instruction
            </label>

          </fieldset>

          {method === "preset_instruct" && (
            <EmotionStyleForm
              emotion={emotion}
              speakingStyle={speakingStyle}
              showStyle={true}
              onChange={({ emotion: e, speakingStyle: s}) => { setEmotion(e); setSpeakingStyle(s)}}
            />
          )}

          {method === "synthesize_instruct" && (
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