import { useState } from 'react'
import { useRecording } from './hooks/useRecording'
import { useApi } from './hooks/useAPI'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import './styles/AuthAccount.css'

import ButtonRecord from './forms/ButtonRecord'


function Login({ setIsAuthenticated, setUser, setToken }) {
    const [email, setEmail] = useState("")
    const [success, setSuccess] = useState("")
    const [password, setPassword] = useState("")
    const [recordingOption, setRecordingOption] = useState(false)
    const [searchParams] = useSearchParams()
    const expired = searchParams.get("expired")

    const { isRecording, audioURL, audioBlob, audioFile, recordingTime, startRecording, stopRecording, resetRecording } = useRecording()
    const { call, loading, error, setError } = useApi()
    const navigate = useNavigate()
    const { t } = useTranslation()

    const validate = () => {
        if (!email) return t('login.error_email')
        if (!password && !audioBlob) return t('login.error_password')
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
            setSuccess(t('login.welcome_back', { name: data.name }))
        }

        if (data && data.issue) {
            setError(data.issue)
        }
    }

    return (
        <div className="box auth-box">
            <div className="auth-header">
                <h2>{t('login.title')}</h2>
            </div>
            
            <div className="form-group">
                <label htmlFor="mail-login">{t('login.email_label')}</label>
                <input
                    type="email"
                    id="mail-login"
                    placeholder={t('login.email_placeholder')}
                    onChange={(e) => setEmail(e.target.value)} 
                />
            </div>

            <div className="form-group">
                <label>{t('login.auth_method')}</label>
                <div className="mode-selector">
                    <button 
                        className={`btn-mode ${!recordingOption ? 'active' : ''}`} 
                        onClick={() => {setRecordingOption(false)}}
                    >
                        {t('login.password_mode')}
                    </button>
                    <button 
                        className={`btn-mode ${recordingOption ? 'active' : ''}`} 
                        onClick={() => {setRecordingOption(true), setPassword("")}}
                    >
                        {t('login.voice_mode')}
                    </button>
                </div>
            </div>

            <div className="auth-input-area">
                {!recordingOption ? (
                    <input
                        type="password"
                        id="password-login"
                        placeholder={t('login.password_placeholder')}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                ) : (
                    <div className="record-area">
          
                        <ButtonRecord isRecording={isRecording} audioURL={audioURL} setError={setError} startRecording={startRecording} stopRecording={stopRecording} recordingTime={recordingTime}/>

                        {audioURL && (

                            <div className="file-info" style={{alignItems:"center"}}>
                                <p>
                                    {t('common.audio_ready')}
                                </p>

                                <audio
                                    controls
                                    src={audioURL}
                                />

                                <button
                                    className="remove"
                                    onClick={resetRecording}
                                    style={{ alignSelf: "center" }}
                                >
                                    {t('common.button_remove')}
                                </button>

                            </div>
                        )}
                    </div>

                )}
            </div>
            
            <button className="button auth-submit-btn" onClick={login} disabled={loading}>
                {loading ? t('login.button_authenticating') : t('login.button_login')}
            </button>

            <div className="auth-feedback">
                {error && <p className="error-text">{t('common.error_prefix')} {error}</p>}
                {expired && <p className="error-text">{t('login.session_expired')}</p>}
                {success && <p className="success-text">{t('common.success_prefix')} {success}</p>}
            </div>
        </div>
    )
}

export default Login
