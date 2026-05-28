
/**
 * Props:
 *   emotion         {string}    Current emotion value (e.g. "HAPPY")
 *   speakingStyle   {string}    Current style value (e.g. "WHISPER")
 *   showStyle       {boolean}   Whether to show the speaking style selector
 *                               (false in multilingual mode)
 *   onChange        {function}  Called with { emotion, speakingStyle } on change
 */
import { EMOTIONS, SPEAKING_STYLES } from '../constants/emotions'
 
export default function EmotionStyleForm({ emotion, speakingStyle, showStyle = true, onChange }) {
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