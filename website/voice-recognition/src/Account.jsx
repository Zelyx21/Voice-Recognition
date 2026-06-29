import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import { useApi } from './hooks/useAPI'
import { useRecording } from './hooks/useRecording'
import { useNavigate } from "react-router-dom"
import './styles/AuthAccount.css'

import ButtonRecord from './forms/ButtonRecord'


const MAX_VOICES = 5

function Account({ user, setUser, setIsAuthenticated, setToken }) {
    const { t } = useTranslation()
    const { call, loading, error, setError } = useApi()
    const navigate = useNavigate()
    const {
        isRecording, audioURL, audioBlob, audioFile,
        recordingTime, fileInputRef, startRecording, stopRecording,
        resetRecording, handleFileChange,
        // Diarization from hook
        diarization, isDiarizationLoading, diarizationError
    } = useRecording()

    const [addMode, setAddMode] = useState(null)
    const [inputMode, setInputMode] = useState(null)
    const [newAudioName, setNewAudioName] = useState("")
    const [success, setSuccess] = useState(null)
    const [confirmDelete, setConfirmDelete] = useState(null)
    const [confirmDeleteAccount, setConfirmDeleteAccount] = useState(false)

    // Selected speaker from diarization: { name, blob, url }
    const [selectedSpeaker, setSelectedSpeaker] = useState(null)

    const voices = user?.audios_names ?? []
    const canAddVoice = voices.length < MAX_VOICES

    // Get the current audio to use (either from speaker selection or from recording/upload)
    const currentAudioURL = selectedSpeaker?.url || audioURL
    const currentAudioBlob = selectedSpeaker?.blob || audioBlob

    const canSubmit =
        currentAudioURL &&
        !loading &&
        !isDiarizationLoading &&
        (
            !diarization ||
            diarization.issue_info !== "several speakers" ||
            selectedSpeaker
        )

    const flash = (msg) => {
        setSuccess(msg)
        setTimeout(() => setSuccess(null), 3000)
    }

    // Convert base64 audio to Blob and load as selected speaker
    const handleSelectSpeaker = (speakerName, speakerData) => {
        try {
            // Decode base64 to binary
            const binaryString = atob(speakerData.audio)
            const bytes = new Uint8Array(binaryString.length)
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i)
            }

            // Create Blob from binary data
            const blob = new Blob([bytes], { type: 'audio/wav' })
            const url = URL.createObjectURL(blob)

            // Store the selected speaker
            setSelectedSpeaker({
                name: speakerName,
                blob: blob,
                url: url
            })
        } catch (err) {
            console.error("Error loading speaker audio:", err)
            setError(t('cloning.error_loading_speaker'))
        }
    }

    const handleAddVoice = async () => {
        setError(null)
        if (!newAudioName || newAudioName.trim().length < 3) {
            setError(t('account.error_name_length'))
            return
        }

        const targetAudio = currentAudioBlob || audioFile
        if (!targetAudio) {
            setError(t('account.error_no_audio'))
            return
        }

        if (isDiarizationLoading) {
            setError(t('cloning.analyzing_speakers'))
            return
        }

        if (diarization?.issue_info === "several speakers" && !selectedSpeaker) {
            setError(t('cloning.select_speaker_first'))
            return
        }

        const formData = new FormData()
        formData.append("email", user.email)
        formData.append("audio_name", newAudioName.trim())

        if (currentAudioBlob) {
            formData.append("file", new File([currentAudioBlob], "recording.wav", { type: "audio/wav" }))
        } else {
            formData.append("file", audioFile)
        }

        if (isDiarizationLoading) {
            setError(t('cloning.analyzing_speakers'))
            return
        }

        if (
            diarization?.issue_info === "several speakers" &&
            !selectedSpeaker
        ) {
            setError(t('cloning.select_speaker_first'))
            return
        }

        const data = await call("/add_voice_db", { method: "POST", body: formData })

        if (!data) {
            // useApi already set the error message
            return;
        }

        if (data.status) {
            const updatedUser = { ...user, audios_names: [...voices, newAudioName.trim()] }
            sessionStorage.setItem("user", JSON.stringify(updatedUser))
            setUser(updatedUser)
            setNewAudioName("")
            resetRecording()
            setAddMode(null)
            setInputMode(null)
            setSelectedSpeaker(null)
            flash(t('account.voice_added'))
        }
    }

    const handleResetAudio = () => {
        resetRecording()
        setInputMode(null)
        setSelectedSpeaker(null)
        setError(null)
    }

    const handleDeleteVoice = async (audio_name) => {
        setError(null)

        if (voices[0] === audio_name) {
            setError(t('account.cannot_delete_default_voice'))
            return
        }
        const formData = new FormData()
        formData.append("email", user.email)
        formData.append("audio_name", audio_name)

        const data = await call("/delete_voice_db", { method: "POST", body: formData })

        if (data) {
            if (voices.length === 1) {
                sessionStorage.clear()
                setIsAuthenticated(false)
                setUser(null)
                setToken(null)
                navigate("/")
            } else {
                const updatedUser = { ...user, audios_names: voices.filter(v => v !== audio_name) }
                sessionStorage.setItem("user", JSON.stringify(updatedUser))
                setUser(updatedUser)
                setConfirmDelete(null)
                flash(t('account.voice_deleted', { name: audio_name }))
            }
        }
    }

    const handleDeleteAccount = async () => {
        setError(null)
        const formData = new FormData()
        formData.append("email", user.email)

        const data = await call("/delete_compte", { method: "POST", body: formData })
        if (data) {
            sessionStorage.clear()
            setIsAuthenticated(false)
            setUser(null)
            setToken(null)
            navigate("/")
        }
    }

    const handleLogout = () => {
        sessionStorage.clear()
        setIsAuthenticated(false)
        setUser(null)
        setToken(null)
        navigate("/")
    }

    return (
        <div className="box auth-box">
            <div className="auth-header">
                <h2>{t('account.title')}</h2>
                <p>{t('account.subtitle')}</p>
            </div>

            <section className="user-section">
                <InfoRow label={t('account.display_name')} value={user?.name} />
                <InfoRow label={t('account.email_address')} value={user?.email} />
            </section>

            <hr className="divider" />

            <section className="voices-section">
                <div className="voices-header">
                    <h3>{t('account.registered_voices')} <span className="voices-counter">({voices.length} / {MAX_VOICES})</span></h3>
                    {canAddVoice && !addMode && (
                        <button className="button small-btn" onClick={() => setAddMode("choose")}>
                            {t('account.add_voice')}
                        </button>
                    )}
                </div>

                <ul className="voice-list">
                    {voices.map((v, index) => (
                        <li key={v} className="voice-item">
                            <span className="voice-name">🎙️ {v}</span>

                            {index === 0 ? (
                                <span className="default-voice-badge">{t('account.default_voice')}</span>
                            ) : confirmDelete === v ? (
                                <div className="confirm-delete-actions">
                                    <span className="warning-text">{t('account.confirm_delete')}</span>
                                    <button className="remove-btn-action" onClick={() => handleDeleteVoice(v)}>{t('common.button_yes')}</button>
                                    <button className="cancel-btn-action" onClick={() => setConfirmDelete(null)}>{t('common.button_no')}</button>
                                </div>
                            ) : (
                                <button className="remove-btn-action" onClick={() => setConfirmDelete(v)}>
                                    {t('common.button_delete')}
                                </button>
                            )}
                        </li>
                    ))}
                </ul>
            </section>

            {addMode && (
                <div className="add-voice-panel">
                    <h4>{t('account.add_voice_title')}</h4>

                    <div className="form-group">
                        <label>{t('account.profile_name_label')}</label>
                        <input
                            type="text"
                            placeholder={t('account.profile_name_placeholder')}
                            value={newAudioName}
                            onChange={(e) => setNewAudioName(e.target.value)}
                        />
                    </div>

                    {!currentAudioURL && !selectedSpeaker && (
                        <div className="mode-selector">
                            <button className="btn-mode" onClick={() => { setInputMode("record"); resetRecording() }}>
                                🎙️ {t('account.record_live')}
                            </button>
                            <button className="btn-mode" onClick={() => { setInputMode("import"); resetRecording() }}>
                                📁 {t('account.import_file')}
                            </button>
                        </div>
                    )}

                    {inputMode === "record" && !currentAudioURL && !selectedSpeaker && (
                        <ButtonRecord isRecording={isRecording} audioURL={audioURL} setError={setError} startRecording={startRecording} stopRecording={stopRecording} recordingTime={recordingTime} />
                    )}

                    {inputMode === "import" && !currentAudioURL && !selectedSpeaker && (
                        <div className="import-area">
                            <input
                                ref={fileInputRef}
                                id="audio-upload-account"
                                type="file"
                                accept="audio/*"
                                onChange={(e) => handleFileChange(e, setError)}
                                style={{ display: 'none' }}
                            />
                            {!audioFile ? (
                                <label htmlFor="audio-upload-account" className="button upload-btn">
                                    {t('account.browse_audio')}
                                </label>
                            ) : (
                                <div className="audio-preview-box">
                                    <div className="audio-preview-top">
                                        <span className="audio-ready-badge">{t('common.success_prefix')} {audioFile.name}</span>
                                        <button className="remove-btn-action" onClick={() => fileInputRef.current.click()}>{t('common.button_remove')}</button>
                                    </div>
                                    <audio controls src={URL.createObjectURL(audioFile)} className="custom-audio-player" />
                                </div>
                            )}
                        </div>
                    )}

                    {/* Diarization loading state */}
                    {audioURL && isDiarizationLoading && (
                        <div className="diarization-loading">
                            <p>🔄 {t('cloning.analyzing_speakers')}</p>
                        </div>
                    )}

                    {/* Preview Audio */}
                    {currentAudioURL && (
                        <div className="audio-preview-box">
                            <div className="audio-preview-top">
                                <span className="audio-ready-badge">{t('common.success_prefix')} {t('cloning.sample_loaded')} {selectedSpeaker && `(${selectedSpeaker.name})`}</span>
                                <button className="remove-btn" onClick={handleResetAudio}>{t('cloning.change_sample')}</button>
                            </div>
                            <audio controls src={currentAudioURL} className="custom-audio-player" />
                        </div>
                    )}

                    {/* Diarization error */}
                    {diarizationError && (
                        <div className="diarization-error">
                            <p>{t('common.error_prefix')} {diarizationError}</p>
                        </div>
                    )}

                    {/* Diarization Result - Multiple speakers */}
                    {diarization && diarization.issue_info === "several speakers" && !selectedSpeaker && (
                        <div className="diarization-result-card">
                            <div className="result-header">
                                <span className="warning-icon">⚠️</span>
                                <h3>{t('cloning.multiple_speakers_title')}</h3>
                            </div>
                            <p>
                                {t('cloning.multiple_speakers_description', {
                                    count: Object.keys(diarization.result).length
                                })}
                            </p>
                            <div className="speakers-list">
                                {Object.entries(diarization.result).map(([speakerName, speakerData]) => (
                                    <div key={speakerName} className="speaker-item">
                                        <div className="speaker-meta">
                                            <span className="speaker-label">{speakerName}</span>
                                            <span className="speaker-duration">
                                                {speakerData.duration.toFixed(1)}s
                                            </span>
                                        </div>
                                        <audio
                                            controls
                                            src={`data:audio/wav;base64,${speakerData.audio}`}
                                            className="custom-audio-player"
                                        />
                                        <button
                                            className="button use-speaker-btn"
                                            onClick={() => handleSelectSpeaker(speakerName, speakerData)}
                                        >
                                            {t('common.success_prefix')} {t('cloning.use_speaker')}
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <div className="diarization-actions">
                                <button className="button secondary-btn" onClick={handleResetAudio}>
                                    {t('cloning.try_other_file')}
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="panel-actions">
                        <button
                            className="button generate-btn"
                            onClick={handleAddVoice}
                            disabled={!canSubmit}
                        >
                            {loading ? t('account.button_registering') : t('account.confirm_save')}
                        </button>
                        <button className="cancel-btn-action" onClick={() => { setAddMode(null); setInputMode(null); resetRecording(); setNewAudioName(""); setSelectedSpeaker(null); setError(null) }}>
                            {t('common.button_cancel')}
                        </button>
                    </div>
                </div>
            )}

            <div className="auth-feedback">
                {error && <p className="error-text">{t('common.error_prefix')} {error}</p>}
                {success && <p className="success-text">{t('common.success_prefix')} {success}</p>}
            </div>

            <hr className="divider" />

            <div className="account-actions">
                <button className="button auth-submit-btn" onClick={handleLogout}>{t('account.logout_button')}</button>

                {!confirmDeleteAccount ? (
                    <button className="remove delete-account-btn" onClick={() => setConfirmDeleteAccount(true)}>
                        {t('account.delete_account_button')}
                    </button>
                ) : (
                    <div className="danger-zone">
                        <p className="warning-text">{t('account.delete_account_confirm')}</p>
                        <div className="panel-actions">
                            <button className="button record-btn" onClick={handleDeleteAccount} disabled={loading}>
                                {loading ? t('common.loading') : t('account.delete_account_permanent')}
                            </button>
                            <button className="cancel-btn-action" onClick={() => setConfirmDeleteAccount(false)}>{t('common.button_cancel')}</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

function InfoRow({ label, value }) {
    return (
        <div className="info-row">
            <span className="info-label">{label}</span>
            <span className="info-value">{value ?? "—"}</span>
        </div>
    )
}

export default Account