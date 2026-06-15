

export default function EmotionStyleForm({ emotion, speakingStyle, showStyle = true, onChange }) {
    const EMOTIONS = [
  { value: "NEUTRAL",    label: "Neutral"},
  { value: "HAPPY",      label: "Happy"},
  { value: "SAD",        label: "Sad"},
  { value: "ANGRY",      label: "Angry"},
  { value: "EXCITED",    label: "Excited"},
  { value: "FEARFUL",    label: "Fearful"},
  { value: "SURPRISED",  label: "Surprised"},
  { value: "DISGUSTED",  label: "Disgusted"},
  { value: "CALM",       label: "Calm"},
  { value: "CONFUSED",   label: "Confused"},
  { value: "EMPATHETIC", label: "Empathetic"},
  { value: "DEPRESSED",  label: "Depressed"},
]
    const SPEAKING_STYLES = [
  { value: "NORMAL",        label: "Normal"},
  { value: "WHISPER",       label: "Whisper"},
  { value: "SHOUT",         label: "Shout"},
  { value: "STORYTELLING",  label: "Storytelling"},
  { value: "NEWS",          label: "News anchor"},
  { value: "COMMERCIAL",    label: "Commercial"},
  { value: "CHILD",         label: "Child-like"},
  { value: "ELDER",         label: "Elder"},
  { value: "MYSTERIOUS",    label: "Mysterious"},
  { value: "GENTLE",        label: "Gentle"},
  { value: "AUTHORITATIVE", label: "Authoritative"},
  { value: "WARM",          label: "Warm"},
  { value: "LIVELY",        label: "Lively"},
]

  return (
    <div>
 
      {/* Emotion */}
      <label htmlFor="emotion">Emotion</label>

      <select
        id="emotion"
        value={emotion}
        onChange={(e) => onChange({ emotion: e.target.value, speakingStyle })}
      >
        {EMOTIONS.map(({ value, label}) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
 
      {/*  Speaking style  */}
      {showStyle && (
        <>
          <label htmlFor="speakingStyle">Speaking style</label>

          <select
            id="speakingStyle"
            value={speakingStyle}
            onChange={(e) => onChange({ emotion, speakingStyle: e.target.value })}
          >
            {SPEAKING_STYLES.map(({ value, label}) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>

        </>
      )}
 
    </div>
  )
}