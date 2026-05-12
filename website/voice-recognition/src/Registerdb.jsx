import {useState, useRef} from 'react'

function RegisterDB(){
    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [isRecording, setIsRecording] = useState(false)
    const [audioURL, setAudioURL] = useState(null)
    const [audioBlob, setAudioBlob] = useState(null)
    const [loading,setLoading] = useState(false)
    const [result, setResult] = useState(null)

    const mediaRecorderRef = useRef(null)
    const chunksRef = useRef([])

    const startRecording = async () => {
    try {
    //Ask access to the microphone
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/wav' })
        const url = URL.createObjectURL(blob)
        setAudioBlob(blob)
        setAudioURL(url)

        // Stop all microphone tracks
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)

    } catch (err) {
      alert("Microphone inaccessible : " + err.message)
    }
  }

  const stopRecording = () => {
    mediaRecorderRef.current?.stop()
    setIsRecording(false)
  }

  const resetRecording = () => {
    setAudioURL(null)
    setAudioBlob(null)
    setResult(null)
  }

  const sendRecording = async () => {
    if (!audioBlob) return

    setLoading(true)
    const formData = new FormData()
    formData.append("file",new File([audioBlob], "recording.wav", { type: 'audio/wav' }))
    formData.append("name", name)
    formData.append("email",email)

    const response = await fetch("http://localhost:8000/registerdb", {
      method: "POST",
      body: formData,
    })

    const data = await response.json()
    setResult(data)
    setLoading(false)
  }

}