// DocToken.jsx
import './../styles/styleDoc.css';

export default function DocToken() {
  const vocalBursts = [
    { token: '[breath]', description: 'Normal Breathing', usage: 'Takes a natural breathing pause mid-sentence.' },
    { token: '[quick_breath]', description: 'Quick Inhalation', usage: 'Indicates surprise, urgency, or excitement.' },
    { token: '[laughter]', description: 'Laughter / Chuckle', usage: 'Adds a warm laugh or a subtle chuckle.' },
    { token: '[sigh]', description: 'Sigh', usage: 'Expresses fatigue, relief, or exasperation.' },
    { token: '[cough]', description: 'Cough / Throat Clearing', usage: 'Simulates a brief cough or throat clearing.' },
    { token: '[lipsmack]', description: 'Lip Smack', usage: 'Labial audio cue (light chewing or preparation before speaking).' },
    { token: '[mn]', description: 'Hesitation ("Hum")', usage: 'Ideal for simulating thinking periods or quiet agreements.' },
  ];

  return (
    <div className="doc-token-wrapper">
      <h2 className="doc-token-main-title">📖 Special Tokens Guide (CosyVoice)</h2>
      <p className="doc-token-intro">
        Enrich your scripts by directly inserting these tags. The voice cloning model interprets these tokens to inject ultra-realistic human sounds or alter word emphasis naturally.
      </p>

      {/* ── SECTION 1: VOCAL BURSTS ── */}
      <h3 className="doc-token-section-title">1. Human Expressions & Noises (Vocal Bursts)</h3>
      <p className="doc-token-text">
        Insert these tokens between words. <i>Tip: Always leave a space before and after the token for optimal AI detection.</i>
      </p>
      <div className="doc-token-table-responsive">
        <table className="doc-token-table">
          <thead>
            <tr className="doc-token-th-row">
              <th className="doc-token-th">Token</th>
              <th className="doc-token-th">Acoustic Effect</th>
              <th className="doc-token-th">Text Example</th>
            </tr>
          </thead>
          <tbody>
            {vocalBursts.map((b) => (
              <tr key={b.token}>
                <td className="doc-token-td-token"><code>{b.token}</code></td>
                <td className="doc-token-td">
                  <strong>{b.description}</strong>
                  <div className="doc-token-sub-text">{b.usage}</div>
                </td>
                <td className="doc-token-td-example">
                  "Hello everyone, <span className="doc-token-highlight">{b.token}</span> glad to be here."
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── SECTION 2: EMPHASIS ── */}
      <h3 className="doc-token-section-title">2. Style and Intonation Tags</h3>
      <div className="doc-token-card-container">
        <div className="doc-token-card">
          <div className="doc-token-card-header">
            <code>&lt;strong&gt;text&lt;/strong&gt;</code>
          </div>
          <p className="doc-token-card-body">
            <strong>Emphasis:</strong> Forces the model to stress the wrapped word or phrase heavily. Perfect for highlighting key technical terms or strong commands.
            <br />
            <span className="doc-token-sub-text">Example: "This action is <code>&lt;strong&gt;</code>forbidden<code>&lt;/strong&gt;</code>!"</span>
          </p>
        </div>

        <div className="doc-token-card">
          <div className="doc-token-card-header">
            <code>[accent]</code>
          </div>
          <p className="doc-token-card-body">
            <strong>Pitch Accent:</strong> Subtly alters the pitch curve at the token's exact location to mark an intentional bounce in attention.
            <br />
            <span className="doc-token-sub-text">Example: "Look <code>[accent]</code> up there!"</span>
          </p>
        </div>
      </div>

      {/* ── SECTION 3: PHONEMES ── */}
      <h3 className="doc-token-section-title">3. Advanced Pronunciation Hotfixes (Phonemes)</h3>
      <p className="doc-token-text">
        If the clone mispronounces a rare word or a specific brand name, you can override standard spelling and write sounds directly using internal phonetic tokens.
      </p>
      <div className="doc-token-alert-box">
        <strong>💡 English Format (ARPAbet):</strong> UPPERCASE tokens (e.g., <code>[JH]</code>, <code>[OY2]</code>) handle English. The trailing digit indicates lexical stress: <code>1</code> for primary stress, <code>2</code> for secondary stress, and <code>0</code> for unstressed sounds.
        <br /><br />
        <strong>💡 Mandarin Format (Pinyin):</strong> Lowercase tokens with accents (e.g., <code>[ǐn]</code>, <code>[uà]</code>) dictate the exact official tones of Mandarin Chinese for complex lip-sync or dubbing use cases.
      </div>
    </div>
  );
}


