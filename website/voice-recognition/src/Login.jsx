import { useState } from 'react'
import { useRecording } from './hooks/useRecording'
import { useApi } from './hooks/useAPI'
import { useNavigate, useSearchParams } from 'react-router-dom'
import './styles/AuthAccount.css'

function Login({ setIsAuthenticated, setUser, setToken }) {
    const [email, setEmail] = useState("")
    const [success, setSuccess] = useState("")
    const [password, setPassword] = useState("")
    const [recordingOption, setRecordingOption] = useState(false)
    const [searchParams] = useSearchParams()
    const expired = searchParams.get("expired")

    const { isRecording, audioURL, audioBlob, recordingTime, startRecording, stopRecording, resetRecording } = useRecording()
    const { call, loading, error, setError } = useApi()
    const navigate = useNavigate()

    const validate = () => {
        if (!email) return "Please enter an email address."
        if (!password && !audioBlob) return "Please enter a password or record your voice."
        return null
    }

    const login = async () => {
        const err = validate()
        if (err) {
            setError(err)
            return
        }

        const formData = new FormData()
        formData.append("email", email)
        if (audioBlob) {
            formData.append("file", new File([audioBlob], "recording.wav", { type: 'audio/wav' }))
        }
        if (password) {
            formData.append("password", password)
        }

        const data = await call("/login", { method: "POST", body: formData })
        if (data && !data.issue) {
            sessionStorage.setItem("token", data.token)
            sessionStorage.setItem("user", JSON.stringify(data))
            setIsAuthenticated(true)
            setUser(data)
            setToken(data.token)
            setSuccess(`Welcome back, ${data.name}!`)
        }

        if (data && data.issue) {
            setError(data.issue)
        }
    }

    return (
        <div className="box auth-box">
            <div className="auth-header">
                <h2>Account Login</h2>
            </div>
            
            <div className="form-group">
                <label htmlFor="mail-login">Email Address</label>
                <input
                    type="email"
                    id="mail-login"
                    placeholder="Enter your email"
                    onChange={(e) => setEmail(e.target.value)} 
                />
            </div>

            <div className="form-group">
                <label>Authentication Method</label>
                <div className="mode-selector">
                    <button 
                        className={`btn-mode ${!recordingOption ? 'active' : ''}`} 
                        onClick={() => {setRecordingOption(false)}}
                    >
                        🔑 Password
                    </button>
                    <button 
                        className={`btn-mode ${recordingOption ? 'active' : ''}`} 
                        onClick={() => {setRecordingOption(true), setPassword("")}}
                    >
                        🎙️ Voice Biometrics
                    </button>
                </div>
            </div>

            <div className="auth-input-area">
                {!recordingOption ? (
                    <input
                        type="password"
                        id="password-login"
                        placeholder="Enter your password"
                        onChange={(e) => setPassword(e.target.value)}
                    />
                ) : (
                    <div className="record-area">
                        {!isRecording && !audioURL && (
                            <button className="button record-btn" onClick={() => { setError(null); startRecording() }}>
                                Start Recording
                            </button>
                        )}

                        {isRecording && (
                            <div className="recording-live">
                                <span className="rec-dot" />
                                <span className="rec-time">
                                    {Math.floor(recordingTime / 60)}m {recordingTime % 60}s
                                </span>
                                <button className="remove-btn-action" onClick={() => stopRecording(setError)}>
                                    Stop
                                </button>
                            </div>
                        )}

                        {audioURL && (
                            <div className="audio-preview-box">
                                <div className="audio-preview-top">
                                    <span className="audio-ready-badge">✓ Voice captured</span>
                                    <button className="remove-btn-action" onClick={resetRecording}>
                                        Record again
                                    </button>
                                </div>
                                <audio controls src={audioURL} className="custom-audio-player" />
                                
                            </div>
                        )}
                    </div>
                )}
            </div>

            <button className="button auth-submit-btn" onClick={login} disabled={loading}>
                {loading ? "Authenticating..." : "Login"}
            </button>

            <div className="auth-feedback">
                {error && <p className="error-text">⚠️ {error}</p>}
                {expired && <p className="error-text">⚠️ Your session has expired, please login again.</p>}
                {success && <p className="success-text">✓ {success}</p>}
            </div>
        </div>
    )
}

export default Login