
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApi } from './hooks/useAPI'
import { useRecording } from './hooks/useRecording'
import './Account.css'

const MAX_VOICES = 5 // 1 registered + 4 additional

function Account({ user, setUser, setIsAuthenticated, setToken }) {
    const navigate = useNavigate()
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
            setError("Audio name must be at least 3 characters")
            return
        }

        if (!audioBlob && !audioFile) {
            setError("Please record or import an audio file")
            return
        }

        const formData = new FormData()

        formData.append("email", user.email)
        formData.append("audio_name", newAudioName.trim())

        if (audioBlob) {
            formData.append(
                "file",
                new File([audioBlob], "recording.wav", {
                    type: "audio/wav"
                })
            )
        } else {
            formData.append("file", audioFile)
        }

        const data = await call("/add_voice_db", {
            method: "POST",
            body: formData
        })

        if (data.status) {
            const updatedUser = {
                ...user,
                audios_names: [...voices, newAudioName.trim() ]
            }

            sessionStorage.setItem("user", JSON.stringify(updatedUser))
            setUser(updatedUser)

            setNewAudioName("")
            resetRecording()
            setAddMode(null)
            setInputMode(null)

            flash("Voice added successfully!")
        }
    }

    const handleDeleteVoice = async (audio_name) => {
        setError(null)

        const formData = new FormData()
        formData.append("email", user.email)
        formData.append("audio_name", audio_name)

        const data = await call("/delete_voice_db", {
            method: "POST",
            body: formData
        })

        if (data) {
            const updatedUser = {
                ...user,
                audios_names: voices.filter(v => v !== audio_name)
            }

            sessionStorage.setItem("user", JSON.stringify(updatedUser))
            setUser(updatedUser)

            setConfirmDelete(null)

            flash(`"${audio_name}" deleted.`)
        }
    }

    const handleDeleteAccount = async () => {
        setError(null)

        const formData = new FormData()
        formData.append("email", user.email)

        const data = await call("/delete_compte", {
            method: "POST",
            body: formData
        })

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
        <div className="box account-container">
            <h2>My Account</h2>

            <section className="user-section">
                <InfoRow label="Name" value={user?.name} />
                <InfoRow label="Email" value={user?.email} />
            </section>

            <hr className="separator" />

            <section className="voices-section">
                <div className="voices-header">
                    <h3 className="voices-title">
                        Registered voices{" "}
                        <span className="voices-counter">
                            ({voices.length} / {MAX_VOICES})
                        </span>
                    </h3>

                    {canAddVoice && !addMode && (
                        <button onClick={() => setAddMode("choose")}>
                            + Add a voice
                        </button>
                    )}
                </div>

                {voices.length === 0 && (
                    <p className="empty-voices">
                        No voices registered yet.
                    </p>
                )}

                <ul className="voice-list">
                    {voices.map((v) => (
                        <li
                            key={v}
                            className="voice-item"
                        >
                            <span>🎙 {v}</span>

                            {confirmDelete === v ? (
                                <span className="confirm-delete">
                                    <span className="confirm-delete-text">
                                        Delete?
                                    </span>

                                    <button
                                        className="remove"
                                        onClick={() =>
                                            handleDeleteVoice(v)
                                        }
                                    >
                                        Yes
                                    </button>

                                    <button
                                        onClick={() =>
                                            setConfirmDelete(null)
                                        }
                                    >
                                        No
                                    </button>
                                </span>
                            ) : (
                                <button
                                    className="remove"
                                    onClick={() =>
                                        setConfirmDelete(v)
                                    }
                                >
                                    Delete
                                </button>
                            )}
                        </li>
                    ))}
                </ul>
            </section>

            {addMode && (
                <div className="add-voice-panel">
                    <h4 className="add-voice-title">
                        Add a new voice
                    </h4>

                    <label>Audio name</label>

                    <input
                        type="text"
                        placeholder="e.g. Office microphone"
                        value={newAudioName}
                        onChange={(e) =>
                            setNewAudioName(e.target.value)
                        }
                        className="form-field"
                    />

                    {!inputMode && (
                        <div className="button-group">
                            <button
                                onClick={() => {
                                    setInputMode("record")
                                    resetRecording()
                                }}
                            >
                                Record voice
                            </button>

                            <button
                                onClick={() => {
                                    setInputMode("import")
                                    resetRecording()
                                }}
                            >
                                Import file
                            </button>
                        </div>
                    )}

                    {inputMode === "record" && (
                        <div>
                            {!isRecording && !audioURL && (
                                <button
                                    onClick={() => {
                                        setError(null)
                                        startRecording()
                                    }}
                                >
                                    Start recording
                                </button>
                            )}

                            {isRecording && (
                                <div>
                                    <p className="recording-timer">
                                        {Math.floor(recordingTime / 60)}m{" "}
                                        {recordingTime % 60}s / 10m
                                    </p>

                                    <button
                                        onClick={() =>
                                            stopRecording(setError)
                                        }
                                    >
                                        Stop recording
                                    </button>
                                </div>
                            )}

                            {audioURL && (
                                <div className="file-info">
                                    <p>Recording ready</p>

                                    <audio
                                        controls
                                        src={audioURL}
                                    />

                                    <button
                                        className="remove"
                                        onClick={resetRecording}
                                    >
                                        Record again
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {inputMode === "import" && (
                        <div>
                            <input
                                ref={fileInputRef}
                                id="audio-upload-account"
                                type="file"
                                accept="audio/*"
                                onChange={(e) =>
                                    handleFileChange(e, setError)
                                }
                            />

                            {!audioFile ? (
                                <label
                                    htmlFor="audio-upload-account"
                                    className="button"
                                >
                                    Import an audio file
                                </label>
                            ) : (
                                <div className="file-info">
                                    <p>
                                        Selected:
                                        <strong>
                                            {" "}
                                            {audioFile.name}
                                        </strong>
                                    </p>

                                    <audio
                                        controls
                                        src={URL.createObjectURL(audioFile)}
                                    />

                                    <button
                                        className="remove"
                                        onClick={() =>
                                            fileInputRef.current.click()
                                        }
                                    >
                                        Change file
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="panel-actions">
                        <button
                            onClick={handleAddVoice}
                            disabled={loading}
                        >
                            {loading ? "Adding…" : "Confirm"}
                        </button>

                        <button
                            onClick={() => {
                                setAddMode(null)
                                setInputMode(null)
                                resetRecording()
                                setNewAudioName("")
                                setError(null)
                            }}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {error && (
                <p className="error-message">
                    {error}
                </p>
            )}

            {success && (
                <p className="success-message">
                    {success}
                </p>
            )}

            <hr className="separator-large" />

            <div className="account-actions">
                <button onClick={handleLogout}>
                    Log out
                </button>

                {!confirmDeleteAccount ? (
                    <button
                        className="remove delete-account-btn"
                        onClick={() =>
                            setConfirmDeleteAccount(true)
                        }
                    >
                        Delete my account
                    </button>
                ) : (
                    <div className="delete-account-confirmation">
                        <p className="delete-account-warning">
                            This will permanently delete your
                            account and all your voice data.
                            Are you sure?
                        </p>

                        <div className="delete-account-buttons">
                            <button
                                className="remove"
                                onClick={handleDeleteAccount}
                                disabled={loading}
                            >
                                {loading
                                    ? "Deleting…"
                                    : "Yes, delete everything"}
                            </button>

                            <button
                                onClick={() =>
                                    setConfirmDeleteAccount(false)
                                }
                            >
                                Cancel
                            </button>
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
            <span className="info-label">
                {label}
            </span>

            <span className="info-value">
                {value ?? "—"}
            </span>
        </div>
    )
}

export default Account

