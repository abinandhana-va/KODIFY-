import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Clock,
  Video,
  AlertTriangle,
  Film,
  Download,
  ShieldCheck,
  FastForward
} from 'lucide-react';

export default function ExamMediaRecordingPlayer({
  recordings = [],
  assignmentId,
  integrityEvents = [],
  attemptStartedAt,
  candidateName = 'Candidate'
}) {
  const [selectedRecordingIdx, setSelectedRecordingIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [videoError, setVideoError] = useState(null);

  const videoRef = useRef(null);

  const activeRecording = recordings[selectedRecordingIdx] || null;

  const streamUrl = activeRecording
    ? `/api/assignments/${assignmentId}/recordings/${activeRecording.id}/stream`
    : null;

  const formatDuration = (secs) => {
    if (isNaN(secs) || secs < 0) return '00:00';
    const mins = Math.floor(secs / 60);
    const remainingSecs = Math.floor(secs % 60);
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 KB';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setVideoError(null);
  }, [selectedRecordingIdx]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration || 0);
    }
  };

  const handleSeek = (e) => {
    const seekTime = parseFloat(e.target.value);
    setCurrentTime(seekTime);
    if (videoRef.current) {
      videoRef.current.currentTime = seekTime;
    }
  };

  const handleVolumeChange = (e) => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    setIsMuted(newVol === 0);
    if (videoRef.current) {
      videoRef.current.volume = newVol;
      videoRef.current.muted = newVol === 0;
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    if (isMuted) {
      videoRef.current.muted = false;
      videoRef.current.volume = volume || 0.5;
      setIsMuted(false);
    } else {
      videoRef.current.muted = true;
      setIsMuted(true);
    }
  };

  const changeSpeed = () => {
    const speeds = [1, 1.25, 1.5, 2, 0.75];
    const nextIdx = (speeds.indexOf(playbackRate) + 1) % speeds.length;
    const nextSpeed = speeds[nextIdx];
    setPlaybackRate(nextSpeed);
    if (videoRef.current) {
      videoRef.current.playbackRate = nextSpeed;
    }
  };

  const handleFullscreen = () => {
    if (videoRef.current?.requestFullscreen) {
      videoRef.current.requestFullscreen();
    }
  };

  const jumpToRelativeEventTime = (eventTimestamp) => {
    if (!attemptStartedAt || !eventTimestamp || !videoRef.current) return;
    try {
      const startMs = new Date(attemptStartedAt).getTime();
      const eventMs = new Date(eventTimestamp).getTime();
      const diffSecs = Math.max(0, (eventMs - startMs) / 1000);
      if (diffSecs <= duration) {
        videoRef.current.currentTime = diffSecs;
        setCurrentTime(diffSecs);
        if (videoRef.current.paused) {
          videoRef.current.play();
          setIsPlaying(true);
        }
      }
    } catch (e) {
      console.warn('Could not calculate relative timestamp:', e);
    }
  };

  if (!recordings || recordings.length === 0) {
    return (
      <div
        style={{
          padding: '24px',
          textAlign: 'center',
          background: 'var(--bg-secondary, rgba(255,255,255,0.02))',
          borderRadius: '8px',
          border: '1px solid var(--border, rgba(255,255,255,0.08))'
        }}
      >
        <Film size={36} color="var(--text-muted)" style={{ opacity: 0.5, marginBottom: '8px' }} />
        <h4 style={{ margin: '0 0 4px 0', fontSize: '0.95rem', color: 'var(--text)' }}>
          No Proctoring Media Recordings Available
        </h4>
        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          The participant either completed the assessment without camera/mic permissions or recording is being processed.
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        background: 'var(--bg-card, #1e1e24)',
        border: '1px solid var(--border, rgba(255,255,255,0.1))',
        borderRadius: '10px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Header Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '10px 16px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-secondary, rgba(255,255,255,0.03))'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Video size={16} color="var(--primary, #3b82f6)" />
          <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text)' }}>
            Proctoring Session Recording: {candidateName}
          </span>
          {recordings.length > 1 && (
            <span
              style={{
                fontSize: '0.75rem',
                padding: '2px 6px',
                borderRadius: '4px',
                background: 'rgba(59, 130, 246, 0.2)',
                color: 'var(--primary)'
              }}
            >
              Stream {selectedRecordingIdx + 1} of {recordings.length}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          <span>Size: {formatFileSize(activeRecording?.fileSizeBytes)}</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#10b981' }}>
            <ShieldCheck size={14} /> Authorized Stream
          </span>
        </div>
      </div>

      {/* Stream Tabs if multiple recordings */}
      {recordings.length > 1 && (
        <div style={{ display: 'flex', gap: '6px', padding: '8px 16px', borderBottom: '1px solid var(--border)', overflowX: 'auto' }}>
          {recordings.map((rec, idx) => (
            <button
              key={rec.id}
              type="button"
              className={`btn ${selectedRecordingIdx === idx ? 'btn-primary' : 'btn-secondary'} btn-sm`}
              onClick={() => setSelectedRecordingIdx(idx)}
              style={{ fontSize: '0.75rem', padding: '3px 8px' }}
            >
              Stream #{idx + 1} ({rec.type || 'VIDEO'})
            </button>
          ))}
        </div>
      )}

      {/* Video Viewport */}
      <div
        style={{
          position: 'relative',
          background: '#000',
          aspectRatio: '16/9',
          maxHeight: '420px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {videoError ? (
          <div style={{ textAlign: 'center', padding: '20px', color: '#ef4444' }}>
            <AlertTriangle size={32} style={{ marginBottom: '8px' }} />
            <p style={{ margin: 0, fontSize: '0.85rem' }}>Failed to load recording stream.</p>
          </div>
        ) : (
          <video
            ref={videoRef}
            src={streamUrl}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={() => setIsPlaying(false)}
            onError={() => setVideoError('Stream could not be decoded.')}
            onClick={togglePlay}
            playsInline
            style={{ width: '100%', height: '100%', objectFit: 'contain', cursor: 'pointer' }}
          />
        )}
      </div>

      {/* Custom Control Bar */}
      <div
        style={{
          padding: '10px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          background: 'var(--bg-secondary, rgba(255,255,255,0.03))'
        }}
      >
        {/* Timeline Slider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
            {formatDuration(currentTime)}
          </span>
          <input
            type="range"
            min="0"
            max={duration || 100}
            step="0.1"
            value={currentTime}
            onChange={handleSeek}
            style={{
              flex: 1,
              accentColor: 'var(--primary, #3b82f6)',
              cursor: 'pointer',
              height: '4px'
            }}
          />
          <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
            {formatDuration(duration)}
          </span>
        </div>

        {/* Buttons Row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              type="button"
              onClick={togglePlay}
              className="btn btn-primary btn-sm"
              style={{ padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            >
              {isPlaying ? <Pause size={14} /> : <Play size={14} />}
              {isPlaying ? 'Pause' : 'Play'}
            </button>

            <button
              type="button"
              onClick={toggleMute}
              style={{ background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            >
              {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>

            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              style={{ width: '60px', accentColor: 'var(--primary)', height: '4px' }}
            />

            <button
              type="button"
              onClick={changeSpeed}
              className="btn btn-secondary btn-sm"
              style={{ padding: '2px 6px', fontSize: '0.75rem' }}
            >
              {playbackRate}x
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={handleFullscreen}
              className="btn btn-secondary btn-sm"
              style={{ padding: '4px 8px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            >
              <Maximize size={12} /> Fullscreen
            </button>
          </div>
        </div>
      </div>

      {/* Flagged Violation Jump Markers */}
      {integrityEvents && integrityEvents.length > 0 && (
        <div
          style={{
            padding: '10px 16px',
            borderTop: '1px solid var(--border)',
            background: 'rgba(239, 68, 68, 0.05)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexWrap: 'wrap'
          }}
        >
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--danger, #ef4444)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <AlertTriangle size={12} /> Jump to Violation:
          </span>
          {integrityEvents.map((evt, idx) => (
            <button
              key={evt.id || idx}
              type="button"
              onClick={() => jumpToRelativeEventTime(evt.timestamp)}
              className="btn btn-secondary btn-sm"
              style={{
                padding: '2px 6px',
                fontSize: '0.7rem',
                borderRadius: '4px',
                border: '1px solid rgba(239,68,68,0.3)',
                color: evt.severity === 'CRITICAL' ? '#ef4444' : '#f59e0b',
                background: 'rgba(239,68,68,0.08)'
              }}
              title={evt.metadata || evt.eventType}
            >
              {evt.eventType} ({evt.timestamp ? new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : `#${idx + 1}`})
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
