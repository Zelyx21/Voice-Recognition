

export default function TextForm({ text, placeholder, onChange }) {
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
        placeholder={placeholder}
        onChange={(e) => onChange({ text: e.target.value })}
      />
    </div>
  )
}

