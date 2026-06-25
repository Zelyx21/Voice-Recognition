import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import { useApi } from './hooks/useAPI'
import { useRecording } from './hooks/useRecording'
import { useNavigate } from 'react-router-dom'

import './styles/Registerdb.css'

import ButtonRecord from './forms/ButtonRecord'

function RegisterDB() {
  const { t } = useTranslation()

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

  const {
    isRecording,
    audioURL,
    audioBlob,
    audioFile,
    recordingTime,
    fileInputRef,
    startRecording,
    stopRecording,
    resetRecording,
    handleFileChange
  } = useRecording()

  const navigate = useNavigate()

  const validate = () => {
    if (!name) return t("register.error_name")
    if (!email) return t("register.error_email")
    if (!password) return t("register.error_password")
    if (!audio_name) return t("register.error_audio_name")
    if (!audioBlob && !audioFile) return t("register.error_audio_file")
    if (!consentChecked) return t("register.error_consent")
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
      formData.append(
        "file",
        new File([audioBlob], "recording.wav", {
          type: "audio/wav"
        })
      )
    } else if (audioFile) {
      formData.append("file", audioFile)
    }

    formData.append("name", name)
    formData.append("email", email)
    formData.append("password", password)
    formData.append("audio_name", audio_name)

    const data = await call("/registerdb", {
      method: "POST",
      body: formData
    })

    if (data) {
      setResult(data)
      setSuccess(t("register.success_message"))
      setTimeout(() => setSuccess(null), 2000)
      setTimeout(() => navigate("/"), 2000)
    }
  }

  return (
    <div className="box clonage-box">
      <h2>{t("register.title")}</h2>

      <label htmlFor="name">
        {t("register.name_label")}
      </label>
      <input
        type="text"
        id="name"
        onChange={(e) => setName(e.target.value)}
      />

      <label htmlFor="email">
        {t("register.email_label")}
      </label>
      <input
        type="text"
        id="email"
        onChange={(e) => setEmail(e.target.value)}
      />

      <label>
        {t("register.password_label")}
      </label>
      <input
        type="password"
        id="password"
        onChange={(e) => setPassword(e.target.value)}
      />

      <label>
        {t("register.audio_name_label")}
      </label>
      <input
        type="text"
        id="audio_name"
        onChange={(e) => setAudio_name(e.target.value)}
      />

      <label>
        {t("register.voice_label")}
      </label>

      <div className="button-group">
        <button
          onClick={() => {
            setMode("record")
            resetRecording()
          }}
        >
          {t("register.button_record")}
        </button>

        <button
          onClick={() => {
            setMode("import")
            resetRecording()
          }}
        >
          {t("register.button_import")}
        </button>
      </div>

      {mode === "record" && (
        <ButtonRecord
          isRecording={isRecording}
          audioURL={audioURL}
          setError={setError}
          startRecording={startRecording}
          stopRecording={stopRecording}
          recordingTime={recordingTime}
        />
      )}

      {mode === "import" && (
        <div>
          <input
            ref={fileInputRef}
            id="audio-upload-register"
            type="file"
            accept="audio/*"
            onChange={(e) => handleFileChange(e, setError)}
          />

          {!audioFile && (
            <label
              htmlFor="audio-upload-register"
              className="button"
            >
              {t("common.button_import")}
            </label>
          )}
        </div>
      )}

      {audioURL && (
        <div className="file-info">
          <p>{t("common.finished_recording")}</p>

          <audio controls src={audioURL} />

          <button
            className="remove"
            onClick={resetRecording}
          >
            {t("common.button_remove")}
          </button>
        </div>
      )}

      <div className="consent-section">
        <div className="consent-header">
          <input
            type="checkbox"
            id="consent-checkbox"
            checked={consentChecked}
            onChange={(e) =>
              setConsentChecked(e.target.checked)
            }
          />

          <label
            htmlFor="consent-checkbox"
            className="consent-label"
          >
            {t("register.consent_text")}{" "}
            <button
              type="button"
              className="learn-more-button"
              onClick={() =>
                setShowConsentModal(true)
              }
            >
              {t("common.button_learn_more")}
            </button>
          </label>
        </div>
      </div>

      {showConsentModal && (
        <div
          className="modal-overlay"
          onClick={() =>
            setShowConsentModal(false)
          }
        >
          <div
            className="modal-content"
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            <button
              className="modal-close"
              onClick={() =>
                setShowConsentModal(false)
              }
            >
              ✕
            </button>

            <h3>
              {t("register.consent_modal_title")}
            </h3>

            <section>
              <p>
                {t("register.consent_intro")}
              </p>
            </section>

            <section>
              <h4>
                1. {t("register.consent_section1")}
              </h4>
              <p>
                {t(
                  "register.consent_section1_text"
                )}
              </p>
            </section>

            <section>
              <h4>
                2. {t("register.consent_section2")}
              </h4>

              <p>
                {t(
                  "register.consent_section2_text"
                )}
              </p>

              <ul>
                <li>
                  {t(
                    "register.consent_section2_item1"
                  )}
                </li>
                <li>
                  {t(
                    "register.consent_section2_item2"
                  )}
                </li>
              </ul>

              <p>
                <strong>
                  {t(
                    "register.consent_section2_important"
                  )}
                </strong>
              </p>
            </section>

            <section>
              <h4>
                3. {t("register.consent_section3")}
              </h4>

              <p>
                {t(
                  "register.consent_section3_text"
                )}
              </p>

              <ul>
                <li>
                  {t(
                    "register.consent_section3_item1"
                  )}
                </li>
                <li>
                  {t(
                    "register.consent_section3_item2"
                  )}
                </li>
              </ul>

              <p>
                <strong>
                  {t(
                    "register.consent_section3_legal"
                  )}
                </strong>
              </p>
            </section>

            <section>
              <h4>
                4. {t("register.consent_section4")}
              </h4>

              <p>
                {t(
                  "register.consent_section4_text"
                )}
              </p>

              <ul>
                <li>
                  {t(
                    "register.consent_section4_item1"
                  )}
                </li>
                <li>
                  {t(
                    "register.consent_section4_item2"
                  )}
                </li>
              </ul>
            </section>

            <section>
              <h4>
                5. {t("register.consent_section5")}
              </h4>

              <p>
                {t(
                  "register.consent_section5_text"
                )}
              </p>
            </section>

            <section>
              <h4>
                6. {t("register.consent_section6")}
              </h4>

              <p>
                {t(
                  "register.consent_section6_text"
                )}
              </p>

              <ul>
                <li>
                  {t(
                    "register.consent_section6_item"
                  )}
                </li>
              </ul>

              <p>
                {t(
                  "register.consent_section6_important"
                )}
              </p>
            </section>

            <section>
              <h4>
                7. {t("register.consent_section7")}
              </h4>

              <p>
                {t(
                  "register.consent_section7_text"
                )}
              </p>
            </section>

            <section>
              <h4>
                8. {t("register.consent_section8")}
              </h4>

              <p>
                {t(
                  "register.consent_section8_text"
                )}
              </p>
            </section>

            <div className="modal-actions">
              <button
                className="modal-close-button"
                onClick={() =>
                  setShowConsentModal(false)
                }
              >
                {t("common.button_close")}
              </button>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={register}
        disabled={loading}
      >
        {t("register.button_register")}
      </button>

      {error && (
        <p style={{ color: "red" }}>
          {error}
        </p>
      )}

      {success && (
        <p style={{ color: "green" }}>
          {success}
        </p>
      )}
    </div>
  )
}

export default RegisterDB