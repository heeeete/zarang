'use client';

import { useState, useRef } from 'react';
import { Mic, Square, Trash2 } from 'lucide-react';
import { Button } from '@/src/shared/ui/button';
import { toast } from 'sonner';

interface VoiceRecorderTestProps {
  onRecordingComplete?: (blob: Blob | null) => void;
}

/**
 * 키보드 타건음 녹음을 위한 테스트 컴포넌트입니다.
 */
export const VoiceRecorderTest = ({ onRecordingComplete }: VoiceRecorderTestProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const getSupportedMimeType = () => {
    const types = ['audio/webm', 'audio/mp4', 'audio/ogg', 'audio/wav', 'audio/aac'];
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) return type;
    }
    return '';
  };

  const clearAudio = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    audioChunksRef.current = [];
    if (onRecordingComplete) onRecordingComplete(null);
  };

  const startRecording = async () => {
    clearAudio();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        } 
      });
      
      const mimeType = getSupportedMimeType();
      const options = mimeType ? { mimeType } : {};
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const mimeTypeUsed = mediaRecorderRef.current?.mimeType || 'audio/wav';
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeTypeUsed });
        
        if (audioBlob.size === 0) {
          toast.error('녹음된 데이터가 없어요.');
          return;
        }

        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        if (onRecordingComplete) onRecordingComplete(audioBlob);
        toast.success(`녹음 완료!`);
      };

      mediaRecorder.start(1000);
      setIsRecording(true);
    } catch (err) {
      console.error('녹음 시작 실패:', err);
      toast.error('마이크를 사용할 수 없어요.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  return (
    <div className="w-full mt-2 rounded-2xl border border-neutral-200 p-4 bg-neutral-50/50 flex flex-col items-center justify-center gap-3">
      <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider text-center">Keyboard ASMR</h3>

      <div className="flex items-center justify-center gap-3 w-full">
        {!isRecording ? (
          <Button 
            type="button"
            onClick={startRecording}
            variant="outline"
            className="rounded-full size-10 p-0 bg-white border-primary/20 text-primary shadow-sm hover:scale-105 transition-transform"
          >
            <Mic className="size-4" />
          </Button>
        ) : (
          <Button 
            type="button"
            onClick={stopRecording}
            variant="destructive"
            className="rounded-full size-10 p-0 animate-pulse shadow-lg shadow-red-200"
          >
            <Square className="size-4 fill-current" />
          </Button>
        )}
      </div>

      {isRecording && (
        <span className="text-[10px] font-bold text-red-500 animate-pulse text-center">Recording...</span>
      )}

      {audioUrl && (
        <div className="flex flex-col items-center justify-center gap-2 w-full max-w-[300px] mx-auto text-center">
          <audio src={audioUrl} controls className="h-8 w-full scale-90 origin-center" />
          <button 
            type="button"
            onClick={clearAudio}
            className="text-[10px] text-neutral-400 hover:text-red-500 transition-colors inline-flex items-center gap-1"
          >
            <Trash2 className="size-3" /> 지우고 다시 녹음하기
          </button>
        </div>
      )}
    </div>
  );
};
