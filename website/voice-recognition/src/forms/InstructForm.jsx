


/**
 * Props:
 *   instruction  {string}    Current instruction text
 *   onChange     {function}  Called with the new string on every keystroke
 */
export default function InstructForm({ instruction, onChange }) {

  return (
    <div>
      <label htmlFor="instruction">
        Custom instruction
      </label>
 
      <p>
        Provide a free-text instruction to guide the synthesis style.
      </p>
 
      <textarea
        id="instruction"
        value={instruction}
        rows={3}
        placeholder="e.g. Speak as if reading a bedtime story to a child."
        onChange={(e) => onChange(e.target.value)}
      />
 
      {instruction && (
        <button type="button" onClick={() => onChange("")}>
          Clear instruction
        </button>
      )}
    </div>
  )
}