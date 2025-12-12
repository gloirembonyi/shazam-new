'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Mic, Music2, Loader2, AlertCircle } from 'lucide-react';

export default function Home() {
  const [isRecording, setIsRecording] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      setError(null);
      setResult(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        await identifySong(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);

      // Record for 5 seconds
      setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop();
          setIsRecording(false);
        }
      }, 5000);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      setError('Could not access microphone. Please ensure permissions are granted.');
    }
  };

  const identifySong = async (audioBlob: Blob) => {
    setIsProcessing(true);
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');
    
    // Token is now handled server-side via .env

    try {
      const response = await fetch('/api/identify', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.status === 'success' && data.result) {
        setResult(data.result);
      } else if (data.status === 'error') {
         // Generic error if env token is missing or limit reached server-side
         if (data.error?.error_code === 901) {
            setError('Server configuration error: API Limit reached. Please check server logs.');
         } else {
            setError(data.error?.error_message || 'Recognition failed');
         }
      } else {
        setError('No song identified. Try again.');
      }
    } catch {
      setError('Failed to connect to recognition service.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    // Applied requested palette:
    // Bg: Gradient from deep blue to dark navy
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden"
         style={{ background: 'linear-gradient(135deg, #234C6A 0%, #1B3C53 100%)' }}>
      
      {/* Decorative background elements using the lighter blue */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-[#456882] rounded-full mix-blend-overlay filter blur-3xl opacity-20 -translate-x-1/2 -translate-y-1/2 animate-pulse"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#456882] rounded-full mix-blend-overlay filter blur-3xl opacity-20 translate-x-1/2 translate-y-1/2 animate-pulse" style={{ animationDelay: '1s' }}></div>

      {/* Main Card - Glassmorphism adaptation for the new palette */}
      <div className="bg-[#456882]/10 backdrop-blur-xl border border-[#E3E3E3]/10 rounded-[2.5rem] p-10 w-full max-w-md shadow-2xl text-center relative z-10">
        
        <div className="mb-10 flex justify-center">
             <div className="relative w-28 h-28 rounded-3xl overflow-hidden shadow-2xl hover:scale-105 transition-transform duration-500 ring-4 ring-[#E3E3E3]/5">
               <Image 
                 src="/logo.png" 
                 alt="Music Finder Logo" 
                 fill
                 className="object-cover"
                 priority
               />
            </div>
        </div>

        <h1 className="text-4xl font-bold text-[#E3E3E3] mb-3 tracking-tight">Music Finder</h1>
        <p className="text-[#E3E3E3]/60 mb-12 text-lg font-light">Tap below to identify music</p>

        <div className="flex justify-center mb-12">
          <button
            onClick={isRecording ? undefined : startRecording}
            disabled={isRecording || isProcessing}
            className={`
              relative w-40 h-40 rounded-full flex items-center justify-center transition-all duration-500 group
              ${isRecording 
                ? 'bg-[#E3E3E3] shadow-[0_0_0_20px_rgba(227,227,227,0.1)] scale-110' 
                : 'bg-gradient-to-b from-[#456882] to-[#234C6A] hover:scale-105 hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)] shadow-xl ring-1 ring-[#E3E3E3]/20'
              }
            `}
          >
             {/* Pulse rings */}
             {isRecording && (
                <>
                  <div className="absolute inset-0 rounded-full border border-[#E3E3E3] opacity-0 animate-ping"></div>
                  <div className="absolute inset-0 rounded-full border border-[#E3E3E3] opacity-0 animate-ping delay-75"></div>
                </>
             )}

             {isProcessing ? (
                <Loader2 className="w-16 h-16 text-[#E3E3E3] animate-spin" />
             ) : (
                <Mic className={`w-16 h-16 transition-colors duration-300 ${isRecording ? 'text-[#234C6A]' : 'text-[#E3E3E3] group-hover:text-white'}`} />
             )}
          </button>
        </div>

        <p className="text-[#E3E3E3]/80 font-medium text-lg h-6 tracking-wide uppercase text-sm">
          {isRecording ? 'Listening...' : isProcessing ? 'Analyzing...' : ''}
        </p>

        {error && (
          <div className="mt-8 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-100 text-left text-sm animate-in slide-in-from-bottom-2 backdrop-blur-sm">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
            <p>{error}</p>
          </div>
        )}

        {result && (
          <div className="mt-10 p-5 bg-[#1B3C53]/60 border border-[#E3E3E3]/10 rounded-3xl text-left animate-in fade-in slide-in-from-bottom-6 backdrop-blur-md shadow-lg">
            <div className="flex gap-5 items-center">
              {result.song_link && (
                 <div className="w-20 h-20 bg-[#234C6A] rounded-2xl overflow-hidden shrink-0 flex items-center justify-center shadow-inner">
                     <Music2 className="w-10 h-10 text-[#E3E3E3]/50" />
                 </div>
              )}
              <div className="min-w-0 flex-1">
                <h2 className="text-xl font-bold text-[#E3E3E3] truncate leading-tight mb-1">{result.title}</h2>
                <p className="text-[#456882] text-sm font-semibold uppercase tracking-wider truncate">{result.artist}</p>
                {result.album && <p className="text-[#E3E3E3]/40 text-xs truncate mt-1">{result.album}</p>}
              </div>
            </div>
            
            <div className="mt-5 flex gap-3">
                {result.song_link && (
                    <a href={result.song_link} target="_blank" rel="noopener noreferrer" 
                       className="flex-1 bg-[#E3E3E3] text-[#1B3C53] py-3 rounded-xl font-bold text-sm hover:bg-white transition-colors text-center shadow-lg">
                        Details
                    </a>
                )}
                 {result.spotify?.external_urls?.spotify && (
                    <a href={result.spotify.external_urls.spotify} target="_blank" rel="noopener noreferrer" 
                       className="flex-1 bg-[#1DB954] text-white py-3 rounded-xl font-bold text-sm hover:bg-[#1ed760] transition-colors text-center shadow-lg flex items-center justify-center gap-2">
                        Spotify
                    </a>
                )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
