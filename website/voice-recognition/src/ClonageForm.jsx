import { useState } from 'react'

const LANGUAGES = [
  { value: "EN_NEWEST", label: "English (Newest)" },
  { value: "EN",        label: "English" },
  { value: "FR",        label: "French" },
  { value: "ES",        label: "Spanish" },
  { value: "ZH",        label: "Chinese" },
  { value: "JP",        label: "Japanese" },
  { value: "KR",        label: "Korean" },
]

const SPEAKERS = {
  EN_NEWEST: ["EN-Newest"],
  EN:        ["EN-US", "EN-BR", "EN-AU", "EN-Default"], //"EN-IN" doesn't work 
  FR:        ["FR"],
  ES:        ["ES"],
  ZH:        ["ZH"],
  JP:        ["JP"],
  KR:        ["KR"],
}

export default function ClonageForm({ onChange }) {
  const [speed, setSpeed]       = useState(1.0)
  const [language, setLanguage] = useState("EN_NEWEST")
  const [speaker, setSpeaker]   = useState("EN-Newest")
  const [text, setText]         = useState("Did you ever hear a folk tale about a giant turtle?")

  const update = (newValues) => {
    onChange({ speed, language, speaker, text, ...newValues })
  }

const handleLanguageChange = (e) => {
    const lang = e.target.value
    const newSpeaker = SPEAKERS[lang][0]

    setLanguage(lang)
    setSpeaker(newSpeaker)
    update({ language: lang, speaker: newSpeaker }) 
}


  return (
    <div>
      <label>
        Text to read:
        <input
          type="text"
          value={text}
          onChange={(e) => { setText(e.target.value); update({ text: e.target.value }) }}
        />
      </label>

      <label>
        Language:
        <select value={language} onChange={handleLanguageChange}>
          {LANGUAGES.map((l) => (
            <option key={l.value} value={l.value}>{l.label}</option>
          ))}
        </select>
      </label>

      <label>
        Accent / Speaker:
        <select value={speaker} onChange={(e) => { setSpeaker(e.target.value); update({ speaker: e.target.value }) }}>
          {SPEAKERS[language].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </label>

      <label>
        Speed: {speed}x
        <input
          type="range" min="0.25" max="2.5" step="0.01"
          value={speed}
          onChange={(e) => { setSpeed(parseFloat(e.target.value)); update({ speed: parseFloat(e.target.value) }) }}
        />
      </label>
    </div>
  )
}