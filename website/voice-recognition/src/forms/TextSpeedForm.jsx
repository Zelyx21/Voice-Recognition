 /** 
 * Props:
 *   text      {string}    Text to synthesize
 *   speed     {number}    Speed multiplier (0.5 – 2.0)
 *   onChange  {function}  Called with { text, speed } on any change
 */

export default function TextSpeedForm({ text, speed, onChange }) {
  return (
    <div>
 
      {/* ── Text to synthesize ── */}
      <label htmlFor="cloneText">
        Text to synthesize
      </label>
      <input
        id="cloneText"
        type="text"
        value={text}
        placeholder="e.g. You are testing a student project on voice cloning."
        onChange={(e) => onChange({ text: e.target.value, speed })}
      />
 
      {/* ── Speed ── */}
      <label htmlFor="speed">
        Speed — {speed}x
      </label>
      <p>
        We recommend a speed between 0.8 and 1.5
      </p>
      <input
        id="speed"
        type="range"
        min="0.5" max="2.0" step="0.05"
        value={speed}
        onChange={(e) => onChange({ text, speed: parseFloat(e.target.value) })}
      />
 
    </div>
  )
}

