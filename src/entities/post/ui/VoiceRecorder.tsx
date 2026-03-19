'use client';

import { useState, useRef, useCallback } from 'react';
import { Mic, Square, Trash2 } from 'lucide-react';
import { Button } from '@/src/shared/ui/button';
import { toast } from 'sonner';

interface VoiceRecorderProps {
  onRecordingComplete?: (blob: Blob | null) => void;
}

/**
 * 제공된 레퍼런스 코드를 바탕으로 구현된 타건음 녹음 컴포넌트입니다.
 * MediaRecorder와 AudioContext를 함께 사용하여 안정적인 녹음을 지원합니다.
 */
export const VoiceRecorder = ({ onRecordingComplete }: VoiceRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  // 녹음 관련 객체 참조 (제공된 코드 구조 참고)
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const analyserRef = useRef<ScriptProcessorNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const clearAudio = useCallback(() => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    if (onRecordingComplete) onRecordingComplete(null);
  }, [audioUrl, onRecordingComplete]);

  const startRecording = async () => {
    clearAudio();
    try {
      const AudioContextClass = (window.AudioContext || 
        (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext);
      const audioCtx = new AudioContextClass();

      // 자바스크립트를 통해 음원의 진행상태에 직접 접근 (0: 브라우저가 버퍼 사이즈 결정)
      const analyser = audioCtx.createScriptProcessor(0, 1, 1);

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });
      const mediaRecorder = new MediaRecorder(stream);

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);
      analyser.connect(audioCtx.destination);

      // 객체 저장
      streamRef.current = stream;
      mediaRecorderRef.current = mediaRecorder;
      sourceRef.current = source;
      analyserRef.current = analyser;
      audioCtxRef.current = audioCtx;

      mediaRecorder.start();
      setIsRecording(true);

      analyser.onaudioprocess = (e) => {
        // 3분(180초) 지나면 자동으로 녹음 중지
        if (e.playbackTime > 180) {
          stopRecording();
        }
      };

      // 녹음 데이터 사용 가능 시 처리
      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          const mimeType = mediaRecorder.mimeType || 'audio/webm';
          const extension = mimeType.includes('mp4') ? 'mp4' : 'webm';
          
          // 실제 타입을 포함한 File 객체 생성
          const soundFile = new File([e.data], `recording.${extension}`, {
            type: mimeType,
            lastModified: Date.now(),
          });

          const url = URL.createObjectURL(soundFile);
          setAudioUrl(url);
          onRecordingComplete?.(soundFile);
          toast.success('녹음 완료!');
        }
      };
    } catch (err) {
      console.error('녹음 시작 실패:', err);
      toast.error('마이크 권한을 확인해 주세요.');
    }
  };

  const stopRecording = () => {
    if (
      !mediaRecorderRef.current ||
      !streamRef.current ||
      !analyserRef.current ||
      !sourceRef.current ||
      !audioCtxRef.current
    )
      return;

    const media = mediaRecorderRef.current;
    const stream = streamRef.current;
    const analyser = analyserRef.current;
    const source = sourceRef.current;
    const audioCtx = audioCtxRef.current;

    // 미디어 캡처 중지 및 스트림 정지
    media.stop();
    stream.getAudioTracks().forEach((track) => track.stop());

    // 노드 연결 해제
    analyser.disconnect();
    source.disconnect();

    // 오디오 컨텍스트 닫기
    audioCtx.close();

    setIsRecording(false);
  };

  return (
    <div className="mt-2 flex w-full flex-col items-center justify-center gap-3 rounded-2xl border border-neutral-200 bg-neutral-50/50 p-4">
      <h3 className="text-center text-xs font-bold tracking-wider text-neutral-500 uppercase">
        Keyboard ASMR
      </h3>

      <div className="flex w-full items-center justify-center gap-3">
        {!isRecording ? (
          <Button
            type="button"
            onClick={startRecording}
            variant="outline"
            className="size-10 rounded-full border-primary/20 bg-white p-0 text-primary shadow-sm transition-transform hover:scale-105"
          >
            <Mic className="size-4" />
          </Button>
        ) : (
          <Button
            type="button"
            onClick={stopRecording}
            variant="destructive"
            className="size-10 animate-pulse rounded-full p-0 shadow-lg shadow-red-200"
          >
            <Square className="size-4 fill-current" />
          </Button>
        )}
      </div>

      {isRecording && (
        <span className="animate-pulse text-center text-[10px] font-bold text-red-500">
          Recording...
        </span>
      )}

      {audioUrl && (
        <div className="mx-auto flex w-full max-w-[300px] flex-col items-center justify-center gap-2 text-center">
          <audio src={audioUrl} controls className="h-8 w-full origin-center scale-90" />
          <button
            type="button"
            onClick={clearAudio}
            className="inline-flex items-center gap-1 text-[10px] text-neutral-400 transition-colors hover:text-red-500"
          >
            <Trash2 className="size-3" /> 지우고 다시 녹음하기
          </button>
        </div>
      )}
    </div>
  );
};
