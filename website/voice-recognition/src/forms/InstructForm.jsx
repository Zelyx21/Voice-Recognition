


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
        placeholder="e.g. Please say a sentence as loudly as possible.
        e.g. Can you try answering in a robotic way?"
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