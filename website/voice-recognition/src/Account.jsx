import { useState } from 'react'
import { useApi } from './hooks/useAPI'
import { useRecording } from './hooks/useRecording'
import { useNavigate } from "react-router-dom"
import './styles/AuthAccount.css'

import ButtonRecord from './forms/ButtonRecord'


const MAX_VOICES = 5 

function Account({ user, setUser, setIsAuthenticated, setToken }) {
    const { call, loading, error, setError } = useApi()
    const navigate = useNavigate()
    const {
        isRecording, audioURL, audioBlob, audioFile,
        recordingTime, fileInputRef, startRecording, stopRecording,
        resetRecording, handleFileChange
    } = useRecording()

    const [addMode, setAddMode] = useState(null)
    const [inputMode, setInputMode] = useState(null)
    const [newAudioName, setNewAudioName] = useState("")
    const [success, setSuccess] = useState(null)
    const [confirmDelete, setConfirmDelete] = useState(null)
    const [confirmDeleteAccount, setConfirmDeleteAccount] = useState(false)

    const voices = user?.audios_names ?? []
    const canAddVoice = voices.length < MAX_VOICES


    const flash = (msg) => {
        setSuccess(msg)
        setTimeout(() => setSuccess(null), 3000)
    }

    const handleAddVoice = async () => {
        setError(null)
        if (!newAudioName || newAudioName.trim().length < 3) {
            setError("Audio name must be at least 3 characters.")
            return
        }
        if (!audioBlob && !audioFile) {
            setError("Please record or import an audio file.")
            return
        }

        const formData = new FormData()
        formData.append("email", user.email)
        formData.append("audio_name", newAudioName.trim())

        if (audioBlob) {
            formData.append("file", new File([audioBlob], "recording.wav", { type: "audio/wav" }))
        } else {
            formData.append("file", audioFile)
        }

        const data = await call("/add_voice_db", { method: "POST", body: formData })

        if (data.status) {
            const updatedUser = { ...user, audios_names: [...voices, newAudioName.trim()] }
            sessionStorage.setItem("user", JSON.stringify(updatedUser))
            setUser(updatedUser)
            setNewAudioName("")
            resetRecording()
            setAddMode(null)
            setInputMode(null)
            flash("Voice profile added successfully.")
        }
    }

    const handleDeleteVoice = async (audio_name) => {
        setError(null)
        const formData = new FormData()
        formData.append("email", user.email)
        formData.append("audio_name", audio_name)

        const data = await call("/delete_voice_db", { method: "POST", body: formData })
        
        if (data) {
            if (voices.length === 1){
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
                flash(`Voice profile "${audio_name}" deleted.`)
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
                <h2>User Dashboard</h2>
                <p>Manage your account settings and registered voice profiles.</p>
            </div>

            <section className="user-section">
                <InfoRow label="Display Name" value={user?.name} />
                <InfoRow label="Email Address" value={user?.email} />
            </section>

            <hr className="divider" />

            <section className="voices-section">
                <div className="voices-header">
                    <h3>Registered Voices <span className="voices-counter">({voices.length} / {MAX_VOICES})</span></h3>
                    {canAddVoice && !addMode && (
                        <button className="button small-btn" onClick={() => setAddMode("choose")}>
                            + Add Voice
                        </button>
                    )}
                </div>

                <ul className="voice-list">
                    {voices.map((v) => (
                        <li key={v} className="voice-item">
                            <span className="voice-name">🎙️ {v}</span>

                            {confirmDelete === v ? (
                                <div className="confirm-delete-actions">
                                    <span className="warning-text">Delete?</span>
                                    <button className="remove-btn-action" onClick={() => handleDeleteVoice(v)}>Yes</button>
                                    <button className="cancel-btn-action" onClick={() => setConfirmDelete(null)}>No</button>
                                </div>
                            ) : (
                                <button className="remove-btn-action" onClick={() => setConfirmDelete(v)}>
                                    Delete
                                </button>
                            )}
                        </li>
                    ))}
                </ul>
            </section>

            {addMode && (
                <div className="add-voice-panel">
                    <h4>Register a new voice profile</h4>
                    
                    <div className="form-group">
                        <label>Profile Name</label>
                        <input
                            type="text"
                            placeholder="e.g. Studio Microphone"
                            value={newAudioName}
                            onChange={(e) => setNewAudioName(e.target.value)}
                        />
                    </div>

                    {!inputMode && (
                        <div className="mode-selector">
                            <button className="btn-mode" onClick={() => { setInputMode("record"); resetRecording() }}>
                                🎙️ Record Live
                            </button>
                            <button className="btn-mode" onClick={() => { setInputMode("import"); resetRecording() }}>
                                📁 Import File
                            </button>
                        </div>
                    )}

                    {inputMode === "record" && (
                        <ButtonRecord isRecording={isRecording} audioURL={audioURL} setError={setError} startRecording={startRecording} stopRecording={stopRecording} recordingTime={recordingTime}/>
                        
                    )}

                    {audioURL && (
                        <div className="audio-preview-box">
                            <div className="audio-preview-top">
                                <span className="audio-ready-badge">✓ Recording ready</span>
                                <button className="remove-btn-action" onClick={resetRecording}>Retry</button>
                            </div>
                            <audio controls src={audioURL} className="custom-audio-player" />
                        </div>
                    )}

                    {inputMode === "import" && (
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
                                    Browse Audio Files
                                </label>
                            ) : (
                                <div className="audio-preview-box">
                                    <div className="audio-preview-top">
                                        <span className="audio-ready-badge">✓ {audioFile.name}</span>
                                        <button className="remove-btn-action" onClick={() => fileInputRef.current.click()}>Change</button>
                                    </div>
                                    <audio controls src={URL.createObjectURL(audioFile)} className="custom-audio-player" />
                                </div>
                            )}
                        </div>
                    )}

                    <div className="panel-actions">
                        <button className="button generate-btn" onClick={handleAddVoice} disabled={loading}>
                            {loading ? "Registering..." : "Confirm & Save"}
                        </button>
                        <button className="cancel-btn-action" onClick={() => { setAddMode(null); setInputMode(null); resetRecording(); setNewAudioName(""); setError(null) }}>
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            <div className="auth-feedback">
                {error && <p className="error-text">⚠️ {error}</p>}
                {success && <p className="success-text">✓ {success}</p>}
            </div>

            <hr className="divider" />

            <div className="account-actions">
                <button className="button auth-submit-btn" onClick={handleLogout}>Log Out</button>

                {!confirmDeleteAccount ? (
                    <button className="remove delete-account-btn" onClick={() => setConfirmDeleteAccount(true)}>
                        Delete Account
                    </button>
                ) : (
                    <div className="danger-zone">
                        <p className="warning-text">This will permanently delete your account and all associated voice data. This action is irreversible.</p>
                        <div className="panel-actions">
                            <button className="button record-btn" onClick={handleDeleteAccount} disabled={loading}>
                                {loading ? "Deleting..." : "Permanently Delete"}
                            </button>
                            <button className="cancel-btn-action" onClick={() => setConfirmDeleteAccount(false)}>Cancel</button>
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