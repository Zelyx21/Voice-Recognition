import { useState, useRef } from 'react'

export function useRecording() {
  const [isRecording, setIsRecording] = useState(false)
  const [audioURL, setAudioURL] = useState(null)
  const [audioBlob, setAudioBlob] = useState(null)
  const [audioFile, setAudioFile] = useState(null)
  const [recordingTime, setRecordingTime] = useState(0)

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
    tooShortRef.current = false
    stopRecording()
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
    }
  }

  return {
    isRecording, audioURL, audioBlob, audioFile,
    recordingTime, fileInputRef,
    startRecording, stopRecording, resetRecording, handleFileChange,
    error, setError
  }
}