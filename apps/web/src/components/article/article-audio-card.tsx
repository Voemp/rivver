import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton.tsx'
import { Slider } from '@/components/ui/slider'
import { Download, Headphones, Pause, Play, Volume2, VolumeX } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

type ArticleAudioCardProps = {
  url: string
}

const initialVolume = 0.8

const formatTime = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return '00:00'
  }

  const totalSeconds = Math.floor(seconds)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const remainingSeconds = totalSeconds % 60

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`
  }

  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`
}

export const ArticleAudioCard = ({ url }: ArticleAudioCardProps) => {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(initialVolume)
  const [isMuted, setIsMuted] = useState(false)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) {
      return
    }

    audio.volume = initialVolume

    const syncDuration = () => {
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration)
      }
    }

    const syncCurrentTime = () => setCurrentTime(audio.currentTime)
    const onPlay = () => setIsPlaying(true)
    const onPause = () => setIsPlaying(false)
    const onVolumeChange = () => {
      setVolume(audio.volume)
      setIsMuted(audio.muted || audio.volume === 0)
    }

    audio.addEventListener('loadedmetadata', syncDuration)
    audio.addEventListener('durationchange', syncDuration)
    audio.addEventListener('timeupdate', syncCurrentTime)
    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)
    audio.addEventListener('volumechange', onVolumeChange)

    return () => {
      audio.removeEventListener('loadedmetadata', syncDuration)
      audio.removeEventListener('durationchange', syncDuration)
      audio.removeEventListener('timeupdate', syncCurrentTime)
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
      audio.removeEventListener('volumechange', onVolumeChange)
    }
  }, [])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) {
      return
    }

    if (audio.src !== url) {
      audio.pause()
      audio.src = url
      audio.load()
      setIsPlaying(false)
      setCurrentTime(0)
      setDuration(0)
    }
  }, [url])

  const canSeek = duration > 0
  const progressValue = canSeek ? Math.min(currentTime, duration) : 0
  const volumeValue = isMuted ? 0 : volume

  const togglePlay = () => {
    const audio = audioRef.current
    if (!audio) {
      return
    }

    if (audio.paused) {
      void audio.play().catch(() => undefined)
      return
    }

    audio.pause()
  }

  const handleSeek = (values: number[]) => {
    const audio = audioRef.current
    const nextTime = values[0] ?? 0
    if (!audio || !Number.isFinite(duration) || duration <= 0) {
      return
    }

    audio.currentTime = nextTime
    setCurrentTime(nextTime)
  }

  const handleVolumeChange = (values: number[]) => {
    const audio = audioRef.current
    const nextVolume = values[0] ?? 0
    if (!audio) {
      return
    }

    audio.muted = false
    audio.volume = nextVolume
    setVolume(nextVolume)
    setIsMuted(nextVolume === 0)
  }

  const toggleMute = () => {
    const audio = audioRef.current
    if (!audio) {
      return
    }

    audio.muted = !audio.muted
    setIsMuted(audio.muted)
  }

  return (
    <section className="mx-auto mt-10 max-w-3xl py-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div
          className="inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.24em] text-muted-foreground/80">
          <Headphones className="size-4" />
          <span>Audio</span>
        </div>

        <Button
          asChild
          size="icon-sm"
          variant="outline"
          className="rounded-full border-border/70 bg-background/80 shadow-none hover:bg-accent/60"
        >
          <a href={url} download aria-label="Download audio" title="Download audio">
            <Download className="size-4" />
          </a>
        </Button>
      </div>

      <p className="mb-5 max-w-2xl text-sm leading-6 text-muted-foreground">
        这篇文章提供了音频版本，您可以在此收听。
      </p>

      <audio ref={audioRef} preload="metadata" src={url} className="sr-only">
        Your browser does not support audio playback.
      </audio>

      <div className="border border-border/70 bg-background/70 rounded-xl p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            onClick={togglePlay}
            size="icon-lg"
            className="rounded-full shadow-none transition-transform active:scale-95"
            aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
          >
            {isPlaying ? <Pause className="size-4" /> : <Play className="size-4 translate-x-px" />}
          </Button>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3">
              <Slider
                value={[progressValue]}
                min={0}
                max={duration || 100}
                step={0.1}
                onValueChange={handleSeek}
                disabled={!canSeek}
                aria-label="Audio progress"
                className="flex-1 **:data-[slot=slider-thumb]:border-primary **:data-[slot=slider-thumb]:bg-background **:data-[slot=slider-track]:h-1.5 **:data-[slot=slider-track]:bg-muted/80"
              />
              <Separator orientation="vertical" />
              <div className="hidden shrink-0 items-center gap-2 sm:flex sm:w-36">
                <Button
                  type="button"
                  onClick={toggleMute}
                  size="icon-sm"
                  variant="ghost"
                  className="rounded-full text-muted-foreground hover:text-foreground"
                  aria-label={isMuted ? 'Unmute audio' : 'Mute audio'}
                >
                  {isMuted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
                </Button>
                <Slider
                  value={[volumeValue]}
                  min={0}
                  max={1}
                  step={0.01}
                  onValueChange={handleVolumeChange}
                  aria-label="Audio volume"
                  className="flex-1 **:data-[slot=slider-thumb]:size-3.5 **:data-[slot=slider-track]:h-1"
                />
              </div>
            </div>

            <div
              className="mt-2 flex items-center justify-start text-[11px] tracking-[0.12em] text-muted-foreground/90">
              <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export const ArticleAudioSkeleton = () => (
  <section className="mx-auto mt-10 max-w-3xl py-6">
    <div className="mb-4 flex items-center justify-between gap-3">
      <Skeleton className="h-3 w-24 rounded-none" />
      <Skeleton className="size-8 rounded-full" />
    </div>

    <Skeleton className="mb-5 h-4 w-2/3 rounded-none" />

    <div className="rounded-xl border border-border/70 bg-background/70 p-4 sm:p-5">
      <div className="flex items-center gap-3">
        <Skeleton className="size-10 rounded-full" />
        <div className="min-w-0 flex-1 space-y-3">
          <Skeleton className="h-3 w-full rounded-none" />
          <Skeleton className="h-3 w-24 rounded-none" />
        </div>
      </div>
    </div>
  </section>
)
