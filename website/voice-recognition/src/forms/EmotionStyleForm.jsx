
/**
 * Props:
 *   emotion         {string}    Current emotion value (e.g. "HAPPY")
 *   speakingStyle   {string}    Current style value (e.g. "WHISPER")
 *   showStyle       {boolean}   Whether to show the speaking style selector
 *                               (false in multilingual mode)
 *   onChange        {function}  Called with { emotion, speakingStyle } on change
 */
 
export default function EmotionStyleForm({ emotion, speakingStyle, showStyle = true, onChange }) {
    const EMOTIONS = [
  { value: "NEUTRAL",    label: "Neutral",    description: "Natural, balanced tone" },
  { value: "HAPPY",      label: "Happy",      description: "Warm, upbeat, joyful" },
  { value: "SAD",        label: "Sad",        description: "Slow, heavy, melancholic" },
  { value: "ANGRY",      label: "Angry",      description: "Tense, forceful, sharp" },
  { value: "EXCITED",    label: "Excited",    description: "Energetic, enthusiastic" },
  { value: "FEARFUL",    label: "Fearful",    description: "Trembling, anxious" },
  { value: "SURPRISED",  label: "Surprised",  description: "Raised pitch, wide dynamics" },
  { value: "DISGUSTED",  label: "Disgusted",  description: "Low, drawn-out, disdainful" },
  { value: "CALM",       label: "Calm",       description: "Steady, soothing, relaxed" },
  { value: "CONFUSED",   label: "Confused",   description: "Hesitant, questioning" },
  { value: "EMPATHETIC", label: "Empathetic", description: "Gentle, warm, understanding" },
  { value: "DEPRESSED",  label: "Depressed",  description: "Flat, slow, monotone" },
]
    const SPEAKING_STYLES = [
  { value: "NORMAL",        label: "Normal",        description: "Default conversational tone" },
  { value: "WHISPER",       label: "Whisper",        description: "Soft, breathy, very quiet" },
  { value: "SHOUT",         label: "Shout",          description: "Loud, projected voice" },
  { value: "STORYTELLING",  label: "Storytelling",   description: "Narrative, expressive pacing" },
  { value: "NEWS",          label: "News anchor",    description: "Clear, authoritative delivery" },
  { value: "COMMERCIAL",    label: "Commercial",     description: "Bright, persuasive, punchy" },
  { value: "CHILD",         label: "Child-like",     description: "Higher pitch, playful" },
  { value: "ELDER",         label: "Elder",          description: "Slower, wise, deliberate" },
  { value: "MYSTERIOUS",    label: "Mysterious",     description: "Low, slow, suspenseful" },
  { value: "GENTLE",        label: "Gentle",         description: "Soft and kind" },
  { value: "AUTHORITATIVE", label: "Authoritative",  description: "Confident, commanding" },
  { value: "WARM",          label: "Warm",           description: "Friendly, inviting" },
  { value: "LIVELY",        label: "Lively",         description: "Fast-paced, energetic" },
]

  return (
    <div>
 
      {/* ── Emotion ── */}
      <label htmlFor="emotion">Emotion</label>

      <select
        id="emotion"
        value={emotion}
        onChange={(e) => onChange({ emotion: e.target.value, speakingStyle })}
      >
        {EMOTIONS.map(({ value, label, description }) => (
          <option key={value} value={value} title={description}>
            {label}
          </option>
        ))}
      </select>
 
      {/* ── Speaking style (zero_shot only) ── */}
      {showStyle && (
        <>
          <label htmlFor="speakingStyle">Speaking style</label>

          <select
            id="speakingStyle"
            value={speakingStyle}
            onChange={(e) => onChange({ emotion, speakingStyle: e.target.value })}
          >
            {SPEAKING_STYLES.map(({ value, label, description }) => (
              <option key={value} value={value} title={description}>
                {label}
              </option>
            ))}
          </select>

        </>
      )}
 
    </div>
  )
}