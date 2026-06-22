import { useState, useRef } from 'react'

const DIARIZATION_API_URL = "http://localhost:8000/diarization"

export function useRecording() {
  const [isRecording, setIsRecording] = useState(false)
  const [audioURL, setAudioURL] = useState(null)
  const [audioBlob, setAudioBlob] = useState(null)
  const [audioFile, setAudioFile] = useState(null)
  const [recordingTime, setRecordingTime] = useState(0)
  
  // Diarization results
  const [diarization, setDiarization] = useState(null)
  const [isDiarizationLoading, setIsDiarizationLoading] = useState(false)
  const [diarizationError, setDiarizationError] = useState(null)

  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const timerRef = useRef(null)
  const fileInputRef = useRef(null)
  const recordingTimeRef = useRef(0)
  const tooShortRef = useRef(false)

  const [error, setError] = useState(null)

  const startRecording = async () => {
    tooShortRef.current = false
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data)
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/wav' })
        stream.getTracks().forEach(track => track.stop())

        if (tooShortRef.current) return

        setAudioBlob(blob)
        setAudioURL(URL.createObjectURL(blob))
        
        // Run diarization on recorded audio
        runDiarization(blob)
      }

      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)
      recordingTimeRef.current = 0

      timerRef.current = setInterval(() => {
        recordingTimeRef.current += 1
        setRecordingTime(recordingTimeRef.current)

        if (recordingTimeRef.current >= 600) {
          stopRecording()
        }
      }, 1000)

    } catch (err) {
      alert("Microphone access is required to record audio")
      setError("Microphone inaccessible : " + err.message)
    }
  }

  const stopRecording = (setError) => {
    tooShortRef.current = recordingTimeRef.current < 5

    mediaRecorderRef.current?.stop()
    setIsRecording(false)
    clearInterval(timerRef.current)
    recordingTimeRef.current = 0
    setRecordingTime(0)

    if (tooShortRef.current && setError) {
      setError("Recording must be at least 5 seconds")
    }
  }

  const resetRecording = () => {
    setAudioURL(null)
    setAudioBlob(null)
    setAudioFile(null)
    setDiarization(null)
    setDiarizationError(null)
    tooShortRef.current = false
    stopRecording()
  }

  // Run diarization on audio blob
  const runDiarization = async (audioBlob) => {
    setIsDiarizationLoading(true)
    setDiarizationError(null)
    setDiarization(null)

    try {
      const formData = new FormData()
      formData.append("file", audioBlob)

      const response = await fetch(DIARIZATION_API_URL, {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        let errorDetail = `Server error: ${response.status}`
        try {
          const errData = await response.json()
          errorDetail = errData.detail || errorDetail
        } catch {
          // Ignore JSON parse errors
        }
        setDiarizationError(errorDetail)
        return
      }

      const data = await response.json()

      if (data.issue) {
        setDiarizationError(data.issue_info)
      } else {
        // Success - store diarization results
        setDiarization({
          issue_info: data.issue_info,
          result: data.result
        })
      }
    } catch (err) {
      setDiarizationError(err.message || "Failed to run diarization")
    } finally {
      setIsDiarizationLoading(false)
    }
  }

  const handleFileChange = (event, setError) => {
    const file = event.target.files[0]
    if (!file) return

    const allowedExtensions = [
      ".opus",
      ".oga",
      ".mka",
      ".flac",
      ".webm",
      ".weba",
      ".wav",
      ".ogg",
      ".m4a",
      ".mid",
      ".mp3",
      ".aiff",
      ".wma",
      ".au"
    ]

    const isValid = allowedExtensions.some(ext =>
      file.name.toLowerCase().endsWith(ext)
    )

    if (!isValid) {
      setError("Unsupported audio format")
      event.target.value = ""
      return
    }

    const audio = new Audio(URL.createObjectURL(file))
    audio.onloadedmetadata = () => {
      if (audio.duration < 5) {
        setError("Audio file must be at least 5 seconds")
        event.target.value = ""
        return
      }
      if (audio.duration > 10 * 60) {
        setError("Audio file must be under 10 minutes")
        event.target.value = ""
        return
      }
      setError(null)
      setAudioFile(file)
      setAudioURL(URL.createObjectURL(file))
      
      // Run diarization on uploaded file
      runDiarization(file)
    }
  }

  return {
    isRecording, audioURL, audioBlob, audioFile,
    recordingTime, fileInputRef,
    startRecording, stopRecording, resetRecording, handleFileChange,
    error, setError,
    // Diarization results
    diarization, isDiarizationLoading, diarizationError
  }
}