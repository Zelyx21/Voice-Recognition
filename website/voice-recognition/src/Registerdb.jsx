import { useState, useRef } from 'react'
import { useApi } from './hooks/useAPI'
import { useRecording } from './hooks/useRecording'
import { useNavigate } from 'react-router-dom'

import './styles/Registerdb.css'

import ButtonRecord from './forms/ButtonRecord'

function RegisterDB() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [audio_name, setAudio_name] = useState("")
  const [result, setResult] = useState(null)
  const [mode, setMode] = useState(null)
  const [success, setSuccess] = useState(null)
  const [consentChecked, setConsentChecked] = useState(false)
  const [showConsentModal, setShowConsentModal] = useState(false)

  const { call, loading, error, setError } = useApi()
  const { isRecording, audioURL, audioBlob, audioFile, recordingTime, fileInputRef, startRecording, stopRecording, resetRecording, handleFileChange } = useRecording()
  const navigate = useNavigate()

  const validate = () => {
    if (!name) return "Please enter a name"
    if (!email) return "Please enter an email"
    if (!password) return "Please enter a password"
    if (!audio_name) return "Please enter an audio name"
    if (!audioBlob && !audioFile) return "Please record or import an audio file of your voice"
    if (!consentChecked) return "Please accept the consent charter to create an account"
    return null
  }


  const register = async () => {
    const err = validate()
    if (err) {
      setError(err)
      return
    }
    const formData = new FormData()
    if (audioBlob) {
      formData.append("file", new File([audioBlob], "recording.wav", { type: 'audio/wav' }))
    } else if (audioFile) {
      formData.append("file", audioFile)
    }
    formData.append("name", name)
    formData.append("email", email)
    formData.append("password", password)
    formData.append("audio_name", audio_name)

    const data = await call("/registerdb", { method: "POST", body: formData })
    if (data) {
      setResult(data)
      setSuccess("Registration successful !")
      setTimeout(() => setSuccess(null), 2000)
      setTimeout(()=>navigate("/"),2000)
    }
  }

  return (
    <div className="box clonage-box">
      <h2>Create an account</h2>
      <label htmlFor="name">Name</label>
      <input
        type="text"
        id="name"
        onChange={(e) => setName(e.target.value)}
      />

      <label htmlFor="email">Email</label>
      <input
        type="text"
        id="email"
        onChange={(e) => setEmail(e.target.value)}
      />

      <label>Password</label>
      <input
        type="password"
        id="password"
        onChange={(e) => setPassword(e.target.value)}
      />

      <label>Audio name</label>
      <input
        type="text"
        id="audio_name"
        onChange={(e) => setAudio_name(e.target.value)}
      />

      <label>Voice</label>
      <div className="button-group">
        <button onClick={() => {
          setMode("record")
          resetRecording()
        }}>Record your voice</button>
        <button onClick={() => {
          setMode("import")
          resetRecording()
        }}>Import your voice</button>
      </div>

      {mode == "record" && (
        <ButtonRecord isRecording={isRecording} audioURL={audioURL} setError={setError} startRecording={startRecording} stopRecording={stopRecording} recordingTime={recordingTime}/>
      )}

      {mode == "import" && (
        <div>
          <input
            ref={fileInputRef}
            id="audio-upload-register"
            type="file"
            accept="audio/*"
            onChange={(e) => handleFileChange(e, setError)}
          />

          {!audioFile && (
            <label htmlFor="audio-upload-register" className="button">
              Import an audio file
            </label>
          )}

        </div>
      )}

      {audioURL && (
        <div className="file-info">
          <p>Finished recording</p>
          <audio controls src={audioURL} />
          <button className="remove" onClick={resetRecording}>
            Remove audio
          </button>
        </div>
      )}

      {/* Consent Charter Section */}
      <div className="consent-section">
        <div className="consent-header">
          <input
            type="checkbox"
            id="consent-checkbox"
            checked={consentChecked}
            onChange={(e) => setConsentChecked(e.target.checked)}
          />
          <label htmlFor="consent-checkbox" className="consent-label">
            I accept the vectorization and use of my voice for voice recognition.{" "}
            <button 
              type="button"
              className="learn-more-button"
              onClick={() => setShowConsentModal(true)}
            >
              Learn more
            </button>
          </label>
        </div>
      </div>

      {/* Consent Modal */}
      {showConsentModal && (
        <div className="modal-overlay" onClick={() => setShowConsentModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button 
              className="modal-close" 
              onClick={() => setShowConsentModal(false)}
            >
              ✕
            </button>
            <h3>Consent Charter - Voice Data Usage</h3>
            
            <section>
              <p>By creating an account on this site, I consent to my voice being vectorized upon account registration and stored by VoiceID to be used exclusively for voice recognition purposes.</p>
            </section>

            <section>
              <h4>1. Data Controller</h4>
              <p>The data controller is: VoiceID</p>
            </section>

            <section>
              <h4>2. Data Collected</h4>
              <p>In the context of voice recognition, we collect and process:</p>
              <ul>
                <li>A recording of your voice at the time of account creation</li>
                <li>A vectorial representation of your voice generated by the SpeechBrain tool (digital voice fingerprint)</li>
              </ul>
              <p><strong>Your voice is not stored as an audio file, but as a vector.</strong> It is therefore impossible for us to replay your recording; only a digital representation (characteristics/tone of your voice) is retained to enable voice authentication.</p>
            </section>

            <section>
              <h4>3. Purposes and Legal Basis for Processing (GDPR)</h4>
              <p>Your voice data is processed for the following purposes:</p>
              <ul>
                <li>Authentication and securing access to your account via voice recognition</li>
                <li>Improving and maintaining the quality of the voice recognition system</li>
              </ul>
              <p><strong>Legal basis:</strong> Your explicit consent (Article 6.1.a of the GDPR), collected when creating your account via the dedicated checkbox.</p>
            </section>

            <section>
              <h4>4. Data Retention Period</h4>
              <p>Your voice data (voice vector) is retained:</p>
              <ul>
                <li>For the entire duration of your account</li>
                <li>Then deleted or anonymized within seconds of your account deletion</li>
              </ul>
            </section>

            <section>
              <h4>5. Withdrawal of Consent and Account Deletion</h4>
              <p>You can withdraw your consent at any time by deleting your account via the account management page. Deleting your account results in the deletion of data associated with your voice, within the timeframes indicated above.</p>
            </section>

            <section>
              <h4>6. Data Recipients</h4>
              <p>Your voice data is accessible only:</p>
              <ul>
                <li>On the local machine on which VoiceID has been installed</li>
              </ul>
              <p>Your data will not be sold or transferred to third parties for commercial purposes.</p>
            </section>

            <section>
              <h4>7. Transfers Outside the European Union</h4>
              <p>No transfer: Your data is not transferred outside the European Union.</p>
            </section>

            <section>
              <h4>8. Commercial Use and Prospection</h4>
              <p>Your voice data will not be used for commercial purposes. No promotional messages will be sent to you based on this data.</p>
            </section>

            <div className="modal-actions">
              <button 
                className="modal-close-button"
                onClick={() => setShowConsentModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={register}
      >
        Register
      </button>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {success && (
        <p style={{ color: "green" }}>{success}</p>
      )}

    </div>
  )

}

export default RegisterDB