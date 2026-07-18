'use client';

import { useState, useRef, useEffect } from 'react';
import styles from './VoiceRecorder.module.css';

interface VoiceRecorderProps {
  onRecordingComplete: (audioBlob: Blob, transcript?: string) => void;
  isLoading?: boolean;
}

export default function VoiceRecorder({ onRecordingComplete, isLoading }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime(t => t + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());
        onRecordingComplete(audioBlob);
        setRecordingTime(0);
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
    } catch (error) {
      console.error('Microphone access denied:', error);
      alert('Microphone access required for voice recording');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={styles['voice-recorder']}>
      {isRecording ? (
        <div className={styles['recording-state']}>
          <div className={styles['recording-dot']} />
          <span className={styles['recording-time']}>{formatTime(recordingTime)}</span>
          <button
            className={styles['stop-btn']}
            onClick={stopRecording}
            disabled={isLoading}
          >
            ⏹️ Stop
          </button>
        </div>
      ) : (
        <button
          className={styles['start-btn']}
          onClick={startRecording}
          disabled={isLoading}
          title="Record audio message"
        >
          🎤 Record
        </button>
      )}
    </div>
  );
}
