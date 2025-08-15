import $ from "jquery"
import utils from "./utils.js"

export default class Player {
    #db

    #title
    #audio
    #audioSource
    #playModeButton

    #isPlaying

    // callback event handler
    onPlay = (track) => {}

    constructor(db) {
        const that = this

        this.#db = db
        this.#title = $("#audio-title")
        this.#audio = $("#audio")[0]
        this.#audioSource = $("#audio-source")
        this.#playModeButton = $("#audio-play-mode")

        this.#audio.addEventListener("ended", () => that.nextTrack())
        const ms = navigator.mediaSession
        if (ms) {
            utils.log("注册 <上一首> <下一首> 响应函数")
            ms.setActionHandler("nexttrack", () => that.nextTrack())
            ms.setActionHandler("previoustrack", () => that.prevTrack())
        }

        this.#resetTimeLabel()
        this.#initAudioEventListeners()

        this.#initProgressClickHandler()
        this.#initPlayModeButton()
        this.#initPrevNextTrackButtons()
        this.#initPlayButton()
    }

    #initProgressClickHandler() {
        const that = this
        const progContainer = $("#audio-progress-container")
        progContainer.on("click", function (e) {
            if (that.#audio.pasued) {
                return
            }
            const clickX = e.offsetX
            const width = progContainer.width()
            const jumpTime = (clickX / width) * that.#audio.duration
            that.#audio.currentTime = jumpTime
        })
    }

    #initPlayModeButton() {
        const that = this
        this.updatePlayModeButton()
        this.#playModeButton.on("click", () => {
            const isRandom = !this.#db.isPlayModeRandom()
            that.#db.setPlayMode(isRandom)
            that.updatePlayModeButton()
        })
    }

    updatePlayModeButton() {
        const isRandom = this.#db.isPlayModeRandom()
        const shuffle = '<i class="fa-solid fa-shuffle"></i>'
        const cycle = '<i class="fa-solid fa-repeat"></i>'
        this.#playModeButton.html(isRandom ? shuffle : cycle)
    }

    #resetTimeLabel() {
        $("#audio-timestamp").text("0:00 / 0:00")
        $("#audio-progress-bar").width("0%")
        $("#audio-progress-buff").width("0%")
    }

    #initAudioEventListeners() {
        const that = this

        const timeLabel = $("#audio-timestamp")
        const progBar = $("#audio-progress-bar")
        const bufBar = $("#audio-progress-buff")

        this.#audio.addEventListener("canplay", () => {
            that.#tryPlay()
        })

        const timerUpdateInterval = 350
        let lastTimerUpdate = Date.now() - timerUpdateInterval
        this.#audio.addEventListener("timeupdate", () => {
            const now = Date.now()
            if (now < lastTimerUpdate + timerUpdateInterval) {
                return
            }
            lastTimerUpdate = now

            const dur = that.#audio.duration
            const buf = that.#audio.buffered
            if (!dur || !buf || buf.length < 1) {
                timeLabel.text("0:00 / 0:00")
                return
            }

            const cur = that.#audio.currentTime
            const pcb = (buf.end(buf.length - 1) / dur) * 100
            const pcc = (((cur / dur) * 100) / pcb) * 100
            const label = utils.formatTimeLabel(cur, dur)
            bufBar.width(`${pcb}%`)
            progBar.width(`${pcc}%`)
            timeLabel.text(label)
        })
    }

    #initPrevNextTrackButtons() {
        const that = this
        $("#audio-prev-track").on("click", () => {
            that.prevTrack()
        })

        $("#audio-next-track").on("click", () => {
            that.nextTrack()
        })
    }

    #initPlayButton() {
        const that = this

        const playBtn = $("#audio-start-pause")

        this.#audio.addEventListener("play", () => {
            that.#isPlaying = true
            playBtn.html('<i class="fa-solid fa-pause"></i>')
        })

        this.#audio.addEventListener("pause", () => {
            that.#isPlaying = false
            playBtn.html('<i class="fa-solid fa-play"></i>')
        })

        playBtn.on("click", () => {
            that.#isPlaying = !that.#isPlaying
            // pause
            if (!that.#isPlaying) {
                that.#audio.pause()
                return
            }

            // play
            const src = that.#audioSource.attr("src")
            if (src) {
                that.#tryPlay()
                return
            }
            const cur = that.#db.getCurTrack()
            if (cur) {
                that.#loadTrack(cur)
            } else {
                that.nextTrack()
            }
        })
    }

    prevTrack() {
        if (!this.#db.isPlayModeRandom()) {
            this.#playIndexOffset(-1)
            return
        }
        this.nextTrack()
    }

    nextTrack() {
        if (!this.#db.isPlayModeRandom()) {
            this.#playIndexOffset(+1)
            return
        }
        const src = utils.pickRandom(this.#db.getPlayList())
        this.play(src)
    }

    #playIndexOffset(delta) {
        const tracks = this.#db.getPlayList()
        const curTrack = this.#db.getCurTrack()
        const idx = tracks.indexOf(curTrack) + delta
        const len = tracks.length
        const src = tracks[(idx + len) % len]
        this.play(src)
    }

    #loadTrack(src) {
        if (!src) {
            const msg = "错误：路径为空！"
            utils.alert(msg)
            throw new Error(msg)
        }
        utils.log(`加载：${src}`)
        this.#db.setCurTrack(src)
        const name = utils.getMusicName(src)
        this.#title.text(name)
        if ("mediaSession" in navigator) {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: name,
            })
        }
        this.#resetTimeLabel()
        this.#audioSource.attr("src", src)
        this.#audio.load()
    }

    play(src) {
        this.#audio.pause()
        this.#audio.currentTime = 0
        this.#loadTrack(src)
    }

    #tryPlay() {
        this.#audio
            .play()
            .catch((err) => utils.log(`ignore play err: ${err.message}`))
        const src = this.#db.getCurTrack()
        this.onPlay && this.onPlay(src)
    }
}
