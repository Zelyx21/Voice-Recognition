import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApi } from './hooks/useAPI'
import { useRecording } from './hooks/useRecording'

const MAX_VOICES = 5 // 1 registered + 4 additional

function Account({ user, setUser, setIsAuthenticated, setToken }) {
    const navigate = useNavigate()
    const { call, loading, error, setError } = useApi()
    const {
        isRecording, audioURL, audioBlob, audioFile,
        recordingTime, fileInputRef,
        startRecording, stopRecording, resetRecording, handleFileChange
    } = useRecording()

    const [addMode, setAddMode] = useState(null)        // "record" | "import" | null
    const [inputMode, setInputMode] = useState(null)    // "record" | "import" | null
    const [newAudioName, setNewAudioName] = useState("")
    const [success, setSuccess] = useState(null)
    const [confirmDelete, setConfirmDelete] = useState(null) // audio_name to delete
    const [confirmDeleteAccount, setConfirmDeleteAccount] = useState(false)

    // voices is stored in user.voices (array of { audio_name, ... })
    const voices = user?.voices ?? []
    const canAddVoice = voices.length < MAX_VOICES

    // ─── Flash helper ────────────────────────────────────────────────────────
    const flash = (msg) => {
        setSuccess(msg)
        setTimeout(() => setSuccess(null), 3000)
    }

    // ─── Add voice ───────────────────────────────────────────────────────────
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
            formData.append("file", new File([audioBlob], "recording.wav", { type: "audio/wav" }))
        } else {
            formData.append("file", audioFile)
        }

        const data = await call("/add_voice_db", { method: "POST", body: formData })
        if (data) {
            const updatedUser = {
                ...user,
                voices: [...voices, { audio_name: newAudioName.trim() }]
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

    // ─── Delete voice ─────────────────────────────────────────────────────────
    const handleDeleteVoice = async (audio_name) => {
        setError(null)
        const formData = new FormData()
        formData.append("email", user.email)
        formData.append("audio_name", audio_name)

        const data = await call("/delete_voice_db", { method: "POST", body: formData })
        if (data) {
            const updatedUser = {
                ...user,
                voices: voices.filter(v => v.audio_name !== audio_name)
            }
            sessionStorage.setItem("user", JSON.stringify(updatedUser))
            setUser(updatedUser)
            setConfirmDelete(null)
            flash(`"${audio_name}" deleted.`)
        }
    }

    // ─── Delete account ───────────────────────────────────────────────────────
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

    // ─── Logout ───────────────────────────────────────────────────────────────
    const handleLogout = () => {
        sessionStorage.clear()
        setIsAuthenticated(false)
        setUser(null)
        setToken(null)
        navigate("/")
    }

    return (
        <div className="box" style={{ flex: 1, maxWidth: 640 }}>
            <h2>My Account</h2>

            {/* ── User info ── */}
            <section style={{ marginBottom: "1.5rem" }}>
                <InfoRow label="Name"  value={user?.name}  />
                <InfoRow label="Email" value={user?.email} />
            </section>

            <hr style={{ marginBottom: "1.5rem", opacity: 0.2 }} />

            {/* ── Registered voices ── */}
            <section style={{ marginBottom: "1.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                    <h3 style={{ margin: 0 }}>
                        Registered voices&nbsp;
                        <span style={{ fontWeight: 400, fontSize: "0.85em", opacity: 0.6 }}>
                            ({voices.length} / {MAX_VOICES})
                        </span>
                    </h3>
                    {canAddVoice && !addMode && (
                        <button onClick={() => setAddMode("choose")}>+ Add a voice</button>
                    )}
                </div>

                {voices.length === 0 && (
                    <p style={{ opacity: 0.5, fontSize: "0.9em" }}>No voices registered yet.</p>
                )}

                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                    {voices.map((v) => (
                        <li key={v.audio_name} style={{
                            display: "flex", justifyContent: "space-between", alignItems: "center",
                            padding: "0.5rem 0.75rem", marginBottom: "0.4rem",
                            background: "rgba(255,255,255,0.05)", borderRadius: 6,
                        }}>
                            <span>🎙 {v.audio_name}</span>
                            {confirmDelete === v.audio_name ? (
                                <span style={{ display: "flex", gap: 8 }}>
                                    <span style={{ fontSize: "0.85em", opacity: 0.7 }}>Delete?</span>
                                    <button className="remove" onClick={() => handleDeleteVoice(v.audio_name)}>Yes</button>
                                    <button onClick={() => setConfirmDelete(null)}>No</button>
                                </span>
                            ) : (
                                <button className="remove" onClick={() => setConfirmDelete(v.audio_name)}>Delete</button>
                            )}
                        </li>
                    ))}
                </ul>
            </section>

            {/* ── Add voice panel ── */}
            {addMode && (
                <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: "1rem", marginBottom: "1.5rem" }}>
                    <h4 style={{ marginTop: 0 }}>Add a new voice</h4>

                    <label>Audio name</label>
                    <input
                        type="text"
                        placeholder="e.g. Office microphone"
                        value={newAudioName}
                        onChange={(e) => setNewAudioName(e.target.value)}
                        style={{ marginBottom: "0.75rem" }}
                    />

                    {!inputMode && (
                        <div className="button-group">
                            <button onClick={() => { setInputMode("record"); resetRecording() }}>Record voice</button>
                            <button onClick={() => { setInputMode("import"); resetRecording() }}>Import file</button>
                        </div>
                    )}

                    {/* Record mode */}
                    {inputMode === "record" && (
                        <div>
                            {!isRecording && !audioURL && (
                                <button onClick={() => { setError(null); startRecording() }}>Start recording</button>
                            )}
                            {isRecording && (
                                <div>
                                    <p>{Math.floor(recordingTime / 60)}m {recordingTime % 60}s / 10m</p>
                                    <button onClick={() => stopRecording(setError)}>Stop recording</button>
                                </div>
                            )}
                            {audioURL && (
                                <div className="file-info">
                                    <p>Recording ready</p>
                                    <audio controls src={audioURL} />
                                    <button className="remove" onClick={resetRecording}>Record again</button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Import mode */}
                    {inputMode === "import" && (
                        <div>
                            <input
                                ref={fileInputRef}
                                id="audio-upload-account"
                                type="file"
                                accept="audio/*"
                                onChange={(e) => handleFileChange(e, setError)}
                            />
                            {!audioFile ? (
                                <label htmlFor="audio-upload-account" className="button">
                                    Import an audio file
                                </label>
                            ) : (
                                <div className="file-info">
                                    <p>Selected: <strong>{audioFile.name}</strong></p>
                                    <audio controls src={URL.createObjectURL(audioFile)} />
                                    <button className="remove" onClick={() => fileInputRef.current.click()}>
                                        Change file
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    <div style={{ display: "flex", gap: 8, marginTop: "1rem" }}>
                        <button onClick={handleAddVoice} disabled={loading}>
                            {loading ? "Adding…" : "Confirm"}
                        </button>
                        <button onClick={() => { setAddMode(null); setInputMode(null); resetRecording(); setNewAudioName(""); setError(null) }}>
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* ── Feedback ── */}
            {error   && <p style={{ color: "red"   }}>{error}</p>}
            {success && <p style={{ color: "green" }}>{success}</p>}

            <hr style={{ margin: "1.5rem 0", opacity: 0.2 }} />

            {/* ── Actions ── */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <button onClick={handleLogout}>Log out</button>

                {!confirmDeleteAccount ? (
                    <button
                        className="remove"
                        onClick={() => setConfirmDeleteAccount(true)}
                        style={{ marginTop: "0.5rem" }}
                    >
                        Delete my account
                    </button>
                ) : (
                    <div style={{ background: "rgba(255,60,60,0.08)", borderRadius: 8, padding: "0.75rem" }}>
                        <p style={{ margin: "0 0 0.5rem", color: "salmon" }}>
                            This will permanently delete your account and all your voice data. Are you sure?
                        </p>
                        <div style={{ display: "flex", gap: 8 }}>
                            <button className="remove" onClick={handleDeleteAccount} disabled={loading}>
                                {loading ? "Deleting…" : "Yes, delete everything"}
                            </button>
                            <button onClick={() => setConfirmDeleteAccount(false)}>Cancel</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

// ── Small helper component ────────────────────────────────────────────────────
function InfoRow({ label, value }) {
    return (
        <div style={{ display: "flex", gap: "1rem", marginBottom: "0.4rem", alignItems: "baseline" }}>
            <span style={{ minWidth: 60, opacity: 0.55, fontSize: "0.85em", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {label}
            </span>
            <span style={{ fontWeight: 500 }}>{value ?? "—"}</span>
        </div>
    )
}

export default Account