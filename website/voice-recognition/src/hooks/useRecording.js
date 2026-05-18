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

  const startRecording = async () => {
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
        setAudioBlob(blob)
        setAudioURL(URL.createObjectURL(blob))
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= 600) {
            stopRecording()
            return 0
          }
          return prev + 1
        })
      }, 1000)

    } catch (err) {
      alert("Microphone inaccessible : " + err.message)
    }
  }

  const stopRecording = () => {
    mediaRecorderRef.current?.stop()
    setIsRecording(false)
    clearInterval(timerRef.current)
    setRecordingTime(0)
  }

  const resetRecording = () => {
    setAudioURL(null)
    setAudioBlob(null)
    setAudioFile(null)
    stopRecording()
  }

  const handleFileChange = (event, setError) => {
    const file = event.target.files[0]
    if (!file) return

    const audio = new Audio(URL.createObjectURL(file))
    audio.onloadedmetadata = () => {
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
    startRecording, stopRecording, resetRecording, handleFileChange
  }
}