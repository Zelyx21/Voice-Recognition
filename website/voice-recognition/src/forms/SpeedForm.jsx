 /** 
 * Props:
 *   text      {string}    Text to synthesize
 *   speed     {number}    Speed multiplier (0.5 – 2.0)
 *   onChange  {function}  Called with { text, speed } on any change
 */

export default function SpeedForm({ speed, onChange }) {
  return (
    <div>
 
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
        onChange={(e) => onChange({ speed: parseFloat(e.target.value) })}
      />
 
    </div>
  )
}

