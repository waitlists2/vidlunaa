"use client"
import { useCallback, useEffect, useMemo, useState } from "react"
import { Loader2, AlertCircle, Play } from "lucide-react"
import VideoPlayer from "./VideoPlayer"
import type { TMDBMovie, TMDBTVShow, TMDBTVEpisode } from "@/lib/tmdb"

type PlayerPageProps = {
  type: string
  id: string
  season?: string
  episode?: string
}

type SubItem = {
  id: string
  url: string
  flagUrl?: string
  language: string
  display: string
  format?: string
  source: "wyzie" | "rainsubs"
  isHearingImpaired?: boolean
}

type VttCue = {
  start: number
  end: number
  lines: string[]
}

type Server = "veronica" | "vienna"

export default function PlayerPage(props: PlayerPageProps) {
  const { type, id, season, episode } = props

  const [accentColor, setAccentColor] = useState("#ef4444")
  const [subtitleColor, setSubtitleColor] = useState("#ffffff")
  const [subtitleSettings, setSubtitleSettings] = useState({
    fontSize: 24,
    fontFamily: "Inter",
    backgroundColor: "#000000",
    backgroundOpacity: 0,
    timing: 0,
  })

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const colorParam = urlParams.get("color")
    if (colorParam) {
      setAccentColor(`#${colorParam.replace("#", "")}`)
    }
  }, [])

  const [hlsUrl, setHlsUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [showPlayButton, setShowPlayButton] = useState(true)
  const [hasStartedPlaying, setHasStartedPlaying] = useState(false)

  const [currentServer, setCurrentServer] = useState<Server>("veronica")
  const [isServerSwitching, setIsServerSwitching] = useState(false)

  const [movieData, setMovieData] = useState<TMDBMovie | null>(null)
  const [tvShowData, setTvShowData] = useState<TMDBTVShow | null>(null)
  const [episodeData, setEpisodeData] = useState<TMDBTVEpisode | null>(null)
  const [backdropUrl, setBackdropUrl] = useState<string | null>(null)

  const [subs, setSubs] = useState<SubItem[]>([])
  const [selectedSub, setSelectedSub] = useState<SubItem | null>(null)
  const [vttCues, setVttCues] = useState<VttCue[]>([])
  const [activeSubtitle, setActiveSubtitle] = useState<string[] | null>(null)
  const [showSubtitles, setShowSubtitles] = useState(false)

  const targetPath = useMemo(() => {
    if (type === "movie") return `movie/${id}`
    return `tv/${id}/${season ?? "1"}/${episode ?? "1"}`
  }, [type, id, season, episode])

  const fetchTMDBData = useCallback(async () => {
    try {
      console.log("[v0] Fetching TMDB data for:", { type, id, season, episode })

      const params = new URLSearchParams({
        type,
        id,
      })

      if (season) params.append("season", season)
      if (episode) params.append("episode", episode)

      const response = await fetch(`/api/tmdb?${params}`)
      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || `API failed: ${response.status}`)
      }

      const data = result.data

      if (type === "movie") {
        setMovieData(data)
        setBackdropUrl(data.backdrop_url)
        console.log("[v0] Movie data loaded:", data.title)
      } else if (type === "tv") {
        setTvShowData(data.show)
        setEpisodeData(data.episode)
        setBackdropUrl(data.show.backdrop_url)
        console.log("[v0] TV show data loaded:", data.show.name, data.episode?.name)
      }
    } catch (error: any) {
      console.error("[v0] Failed to fetch TMDB data:", error)
      if (type === "movie") {
        setMovieData({
          id: Number.parseInt(id),
          title: "Movie",
          overview: "",
          poster_path: null,
          backdrop_path: null,
          poster_url: null,
          backdrop_url: null,
          release_date: "",
          runtime: null,
          genres: [],
          vote_average: 0,
          vote_count: 0,
        })
      }
    }
  }, [type, id, season, episode])

  const fetchStream = useCallback(
    async (server: Server = currentServer) => {
      setLoading(true)
      setError(null)
      try {
        console.log(`[v0] Fetching stream from ${server} for:`, targetPath)

        const url = `/api/rainsubs?tmdbId=${id}&server=${server}${season ? `&season=${season}` : ""}${episode ? `&episode=${episode}` : ""}`

        const res = await fetch(url, { cache: "no-store" })
        const data = await res.json()

        console.log(`[v0] ${server} response:`, data)

        if (!res.ok || !data.success) {
          throw new Error(data.error || `API failed: ${res.status}`)
        }

        if (!data.streamUrl) {
          throw new Error("No HLS stream found")
        }

        setHlsUrl(data.streamUrl)
        setCurrentServer(server)
        console.log(`[v0] Stream URL set from ${server}:`, data.streamUrl)
      } catch (e: any) {
        console.error(`[v0] ${server} fetch error:`, e)

        if (server === "veronica") {
          console.log("[v0] Trying fallback server Vienna...")
          try {
            await fetchStream("vienna")
            return
          } catch (fallbackError) {
            console.error("[v0] Both servers failed")
          }
        }

        setError(e?.message ?? "Failed to load stream from both servers")
      } finally {
        setLoading(false)
      }
    },
    [type, id, season, episode, targetPath, currentServer],
  )

  const fetchSubs = useCallback(async () => {
    try {
      const showName = type === "tv" ? tvShowData?.name || "TV Show" : movieData?.title || "Movie"
      console.log(
        `[v0] Requesting ${showName} subtitles for season ${season || 1} episode ${episode || 1} which is tmdb id ${id}`,
      )

      const wyzieUrl =
        type === "movie"
          ? `https://sub.wyzie.ru/search?id=${id}`
          : `https://sub.wyzie.ru/search?id=${id}&season=${season ?? 1}&episode=${episode ?? 1}`

      const rainsubsUrl =
        type === "movie"
          ? `/api/rainsubs?tmdbId=${id}&subtitles=true`
          : `/api/rainsubs?tmdbId=${id}&season=${season ?? 1}&episode=${episode ?? 1}&subtitles=true`

      const [wyzieRes, rainRes] = await Promise.allSettled([
        fetch(wyzieUrl).then((r) => r.json()),
        fetch(rainsubsUrl).then((r) => r.json()),
      ])

      const wyzieList: SubItem[] =
        wyzieRes.status === "fulfilled"
          ? (wyzieRes.value || []).map((s: any) => ({
              id: String(s.id ?? `${s.language}-${s.url}`),
              url: String(s.url),
              flagUrl: String(s.flagUrl || ""),
              language: String(s.language || "und"),
              display: String(s.display || s.language || "Unknown"),
              format: String(s.format || "srt"),
              source: "wyzie" as const,
              isHearingImpaired: Boolean(s.isHearingImpaired),
            }))
          : []

      const rainList: SubItem[] =
        rainRes.status === "fulfilled" && rainRes.value?.success && rainRes.value?.subtitles
          ? [
              {
                id: "rainsubs",
                url: "data:text/plain;base64," + btoa(rainRes.value.subtitles),
                language: "rainbow",
                display: "Rainbow",
                format: "srt",
                source: "rainsubs" as const,
              },
            ]
          : []

      const englishSubs = wyzieList.filter((sub) => sub.language === "en")
      const otherSubs = wyzieList.filter((sub) => sub.language !== "en")

      const allSubs = [...englishSubs, ...otherSubs, ...rainList]
      setSubs(allSubs)
      console.log("[v0] Loaded subtitles:", allSubs.length)
    } catch (error) {
      console.error("[v0] Failed to fetch subtitles:", error)
      setSubs([])
    }
  }, [id, type, season, episode, tvShowData?.name, movieData?.title])

  const loadSubtitle = useCallback(
    async (sub: SubItem | null) => {
      if (!sub) {
        setVttCues([])
        setActiveSubtitle(null)
        return
      }

      try {
        let text: string

        if (sub.url.startsWith("data:")) {
          const base64Data = sub.url.split(",")[1]
          text = atob(base64Data)
        } else {
          const res = await fetch(sub.url)
          text = await res.text()
        }

        const vtt = await convertToVtt(text, sub.format || "srt", subtitleSettings.timing)
        const cues = parseVttToCues(vtt)
        setVttCues(cues)
      } catch (error) {
        console.error("Failed to load subtitle:", error)
        setVttCues([])
      }
    },
    [subtitleSettings.timing],
  )

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return

      switch (e.key.toLowerCase()) {
        case "f":
          e.preventDefault()
          document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen()
          break
        case " ":
        case "k":
          e.preventDefault()
          setHasStartedPlaying((prev) => {
            if (!prev) {
              handlePlayClick()
              return true
            }
            return prev
          })
          break
        case "arrowleft":
        case "arrowright":
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  const handlePlayClick = () => {
    setShowPlayButton(false)
    setHasStartedPlaying(true)
  }

  const switchServer = useCallback(
    async (server: Server) => {
      if (server === currentServer || isServerSwitching) return

      setIsServerSwitching(true)
      const previousServer = currentServer

      try {
        console.log(`[v0] Switching to ${server} server...`)

        const url = `/api/rainsubs?tmdbId=${id}&server=${server}${season ? `&season=${season}` : ""}${episode ? `&episode=${episode}` : ""}`

        const res = await fetch(url, { cache: "no-store" })
        const data = await res.json()

        if (!res.ok || !data.success || !data.streamUrl) {
          throw new Error(data.error || "Server not available")
        }

        setHlsUrl(data.streamUrl)
        setCurrentServer(server)
        setError(null)

        console.log(`[v0] Successfully switched to ${server}:`, data.streamUrl)
      } catch (e: any) {
        console.error(`[v0] Failed to switch to ${server}:`, e)

        setError(`${server} server unavailable. Reverting to ${previousServer}.`)
        setTimeout(() => setError(null), 3000)
      } finally {
        setIsServerSwitching(false)
      }
    },
    [currentServer, isServerSwitching, id, season, episode],
  )

  const handleSubtitleSelect = useCallback(
    (subId: string) => {
      if (!subId) {
        setSelectedSub(null)
        setShowSubtitles(false)
        return
      }

      const sub = subs.find((s) => s.id === subId)
      if (sub) {
        setSelectedSub(sub)
        setShowSubtitles(true)
      }
    },
    [subs],
  )

  const handleSubtitleToggle = useCallback(() => {
    setShowSubtitles((prev) => !prev)
  }, [])

  useEffect(() => {
    fetchTMDBData()
    fetchStream()
  }, [fetchTMDBData, fetchStream])

  useEffect(() => {
    if (movieData || tvShowData) {
      fetchSubs()
    }
  }, [fetchSubs, movieData, tvShowData])

  useEffect(() => {
    loadSubtitle(selectedSub)
  }, [selectedSub, loadSubtitle])

  useEffect(() => {
    if (vttCues.length > 0) {
      const activeCue = vttCues.find((cue) => currentTime >= cue.start && currentTime <= cue.end)
      setActiveSubtitle(activeCue ? activeCue.lines : null)
    } else {
      setActiveSubtitle(null)
    }
  }, [currentTime, vttCues])

  const getTitle = () => {
    if (type === "tv") {
      const showName = tvShowData?.name || "TV Show"
      const seasonEpisode = `S${season ?? 1}E${episode ?? 1}`
      return `${showName} - ${seasonEpisode}`
    }
    return movieData?.title || "Movie"
  }

  const getShowNameForPlayButton = () => {
    if (type === "tv") {
      const showName = tvShowData?.name || "TV Show"
      return `${showName} S${season ?? 1} E${episode ?? 1}`
    }
    return movieData?.title || "Movie"
  }

  const servers = [
    { id: "veronica", name: "Veronica", flag: "🇺🇸" },
    { id: "vienna", name: "Vienna", flag: "🇺🇸" },
  ]

  const subtitleOptions = subs.map((sub) => ({
    id: sub.id,
    language: sub.language,
    label: sub.display,
    flagUrl: sub.flagUrl,
    source: sub.source,
  }))

  if (loading) {
    return (
      <div className="relative w-full h-screen bg-black overflow-hidden">
        {backdropUrl && (
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${backdropUrl})` }} />
        )}
        <div className="absolute inset-0 bg-black/60" />

        <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-8">
          <div className="mb-8">
            <Loader2 className="w-16 h-16 text-white animate-spin mx-auto" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4 text-balance">{getTitle()}</h1>
          <p className="text-xl text-gray-300 mb-6">Preparing your viewing experience...</p>
        </div>
      </div>
    )
  }

  if (error && !hlsUrl) {
    return (
      <div className="relative w-full h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Playback Error</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <button
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            onClick={() => {
              setError(null)
              fetchStream()
            }}
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-screen bg-black">
      <VideoPlayer
        src={hlsUrl!}
        poster={backdropUrl || undefined}
        onTimeUpdate={setCurrentTime}
        className="w-full h-full"
        accentColor={accentColor}
        autoPlay={hasStartedPlaying}
        onServerSwitch={switchServer}
        onSubtitleToggle={handleSubtitleToggle}
        servers={servers}
        currentServer={currentServer}
        subtitles={subtitleOptions}
        selectedSubtitle={selectedSub?.id}
        onSubtitleSelect={handleSubtitleSelect}
        showSubtitleOverlay={showSubtitles}
        subtitleColor={subtitleColor}
        onSubtitleColorChange={setSubtitleColor}
        subtitleSettings={subtitleSettings}
        onSubtitleSettingsChange={setSubtitleSettings}
      />

      {showPlayButton && (
        <div className="absolute inset-0 flex items-center justify-center z-30">
          <div className="text-center">
            <button
              onClick={handlePlayClick}
              className="flex items-center justify-center w-16 h-16 rounded-full bg-white hover:bg-white/90 transition-all duration-300 hover:scale-110 mb-4"
            >
              <Play className="w-6 h-6 text-black ml-1" fill="black" />
            </button>
            <div className="text-white text-lg font-normal">{getShowNameForPlayButton()}</div>
          </div>
        </div>
      )}

      {error && hlsUrl && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 bg-red-600/90 backdrop-blur-sm text-white px-4 py-2 rounded-lg">
          {error}
        </div>
      )}

      {activeSubtitle && showSubtitles && (
        <div className="absolute bottom-32 left-1/2 -translate-x-1/2 z-20 max-w-4xl">
          <div
            className="px-4 py-2 rounded-lg"
            style={{
              backgroundColor: `${subtitleSettings.backgroundColor}${Math.round(
                subtitleSettings.backgroundOpacity * 255,
              )
                .toString(16)
                .padStart(2, "0")}`,
            }}
          >
            {activeSubtitle.map((line, index) => (
              <div
                key={index}
                className="text-center leading-relaxed"
                style={{
                  color: subtitleColor,
                  fontSize: `${subtitleSettings.fontSize}px`,
                  fontFamily: subtitleSettings.fontFamily,
                  fontWeight: "normal",
                  textShadow: "2px 2px 4px rgba(0,0,0,0.8), -1px -1px 2px rgba(0,0,0,0.8)",
                }}
                dangerouslySetInnerHTML={{ __html: line }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

async function convertToVtt(input: string, format: string, offsetSec: number): Promise<string> {
  const applyOffset = (t: number) => Math.max(0, t + offsetSec)

  if (format.toLowerCase() === "srt" || input.includes("-->")) {
    const lines = input.replace(/\r/g, "").split("\n")
    const out: string[] = ["WEBVTT", ""]
    let i = 0

    while (i < lines.length) {
      const line = lines[i].trim()
      if (/^\d+$/.test(line)) {
        i++
        continue
      }

      if (line.includes("-->")) {
        const [start, end] = line.split("-->").map((s) => s.trim())
        const startSec = srtTimeToSeconds(start)
        const endSec = srtTimeToSeconds(end)
        out.push(`${secondsToVtt(applyOffset(startSec))} --> ${secondsToVtt(applyOffset(endSec))}`)
        i++

        const textLines: string[] = []
        while (i < lines.length && lines[i].trim() !== "") {
          textLines.push(lines[i])
          i++
        }
        out.push(...textLines, "")
      } else {
        i++
      }
    }
    return out.join("\n")
  }

  return `WEBVTT\n\n00:00:00.000 --> 00:10:00.000\n${input.replace(/\n/g, " ")}`
}

function srtTimeToSeconds(t: string): number {
  const m = t.match(/(\d+):(\d+):(\d+)[,.](\d+)/)
  if (!m) return 0
  const h = Number.parseInt(m[1], 10)
  const min = Number.parseInt(m[2], 10)
  const s = Number.parseInt(m[3], 10)
  const ms = Number.parseInt(m[4].padEnd(3, "0").slice(0, 3), 10)
  return h * 3600 + min * 60 + s + ms / 1000
}

function secondsToVtt(sec: number): string {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = Math.floor(sec % 60)
  const ms = Math.round((sec - Math.floor(sec)) * 1000)
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(ms).padStart(3, "0")}`
}

function parseVttToCues(vtt: string): VttCue[] {
  const lines = vtt.replace(/\r/g, "").split("\n")
  const cues: VttCue[] = []
  let i = 0

  if (lines[0]?.startsWith("WEBVTT")) i = 1

  while (i < lines.length) {
    const line = lines[i].trim()
    if (!line) {
      i++
      continue
    }

    if (line.includes("-->")) {
      const [start, end] = line.split("-->").map((s) => s.trim())
      const startSec = srtTimeToSeconds(start.replace(".", ","))
      const endSec = srtTimeToSeconds(end.replace(".", ","))
      i++

      const textLines: string[] = []
      while (i < lines.length && lines[i].trim() !== "") {
        textLines.push(lines[i])
        i++
      }
      cues.push({ start: startSec, end: endSec, lines: textLines })
    } else {
      i++
    }
  }

  return cues
}
