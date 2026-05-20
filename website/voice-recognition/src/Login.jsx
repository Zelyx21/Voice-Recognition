import { useState } from 'react'
import { useRecording } from './hooks/useRecording'
import { useApi } from './hooks/useAPI'
import { useNavigate, useSearchParams } from 'react-router-dom'

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
        if (!email) return "Please enter an email"
        if (!password && !audioBlob) return "Please enter a password or record your voice"
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
            setSuccess(`Welcome back, ${data.name} !`)
            setTimeout(() => navigate("/"), 2000)
        }

        if (data && data.issue) {
            setError(data.issue)
        }
    }


    return (
        <div className="box" style={{ flex: 1 }}>

            <h2>Login</h2>

            <label htmlFor="mail-login">Email</label>
            <input
                type="text"
                id="mail-login"
                onChange={(e) => setEmail(e.target.value)} />

            <label htmlFor="password-login">Put your password or record your voice</label>

            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <button onClick={() => setRecordingOption(false)}>Enter a password</button>
                <button onClick={() => { setRecordingOption(true) }}>Record your voice</button>
            </div>
            <div>

                {!recordingOption && (
                    <input
                        type="password"
                        id="password-login"
                        style={{ width: "50%" }}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                )}

                {recordingOption && (
                    <div>
                        {!isRecording && !audioURL && (
                            <div>
                                <button onClick={() => { setError(null); startRecording() }}>Start recording</button>
                            </div>
                        )}

                        {isRecording && (
                            <div>
                                <p>{Math.floor(recordingTime / 60)}m {recordingTime % 60}s / 10m</p>
                                <button onClick={() => stopRecording(setError)}>Stop recording</button>
                            </div>
                        )
                        }

                        {audioURL && (
                            <div className="file-info">
                                <p>Finished recording</p>
                                <audio controls src={audioURL} />
                                <button className="remove" onClick={resetRecording}>
                                    Record again
                                </button>
                            </div>
                        )}
                    </div>
                )}

            </div>

            <button onClick={login}>Login</button>

            {error && <p style={{ color: "red" }}>{error}</p>}
            {expired && (
                <p style={{ color: "red" }}>Your session has expired, please login again</p>
            )}
            {success && (
                <p style={{ color: "green" }}>{success}</p>
            )}

        </div>
    )
}

export default Login