export default class Player {
    #db

    #title
    #audio

    #audioSource
    #currentTrack

    // callback event handler
    onPlay = (track) => {}

    constructor(db) {
        const that = this

        this.#db = db
        this.#title = $("#audio-title")
        this.#audio = $("#audio")[0]
        this.#audioSource = $("#audio-source")

        this.#audio.addEventListener("ended", () => that.nextTrack())
        if ("mediaSession" in navigator) {
            utils.log("注册 <上一首> <下一首> 响应函数")
            navigator.mediaSession.setActionHandler("nexttrack", () =>
                that.nextTrack(),
            )
            navigator.mediaSession.setActionHandler("previoustrack", () =>
                that.prevTrack(),
            )
        }

        this.#initTimeLabel()
        this.#initProgressContainer()
        this.#initPlayModeButton()
        this.#initPrevNextTrackButtons()
        this.#initPlayButton()
    }

    #initProgressContainer() {
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
        const playModeBtn = $("#audio-play-mode")
        function updatePlayModeBtn() {
            const isRandom = that.#db.isPlayModeRandom()
            playModeBtn.val(isRandom ? "🔀" : "🔁")
        }
        updatePlayModeBtn()
        playModeBtn.click(() => {
            const isRandom = !this.#db.isPlayModeRandom()
            that.#db.setPlayMode(isRandom)
            updatePlayModeBtn()
        })
    }

    #initTimeLabel() {
        const that = this
        const timeLabel = $("#audio-timestamp")
        const progBar = $("#audio-progress-bar")

        this.#audio.addEventListener("timeupdate", () => {
            const dur = that.#audio.duration
            if (!dur) {
                timeLabel.text("0:00 / 0:00")
                return
            }

            const cur = that.#audio.currentTime
            const percent = Math.floor((cur / dur) * 100)
            progBar.width(`${percent}%`)

            const head = utils.formatTime(cur)
            const tail = utils.formatTime(dur)
            timeLabel.text(`${head} / ${tail}`)
        })
    }

    #initPrevNextTrackButtons() {
        const that = this
        $("#audio-prev-track").click(() => {
            that.prevTrack()
        })

        $("#audio-next-track").click(() => {
            that.nextTrack()
        })
    }

    #initPlayButton() {
        const that = this

        let isPlaying = false
        const playBtn = $("#audio-start-pause")

        this.#audio.addEventListener("play", () => {
            isPlaying = true
            playBtn.val("⏸")
        })

        this.#audio.addEventListener("pause", () => {
            isPlaying = false
            playBtn.val("▶")
        })

        playBtn.click(() => {
            if (isPlaying) {
                that.#audio.pause()
                return
            }
            const src = that.#audioSource.attr("src")
            if (src) {
                utils.log(`try play: ${src}`)
                that.#tryPlay()
            } else {
                utils.log(`nextTrack()`)
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
        const idx = tracks.indexOf(this.#currentTrack) + delta
        const len = tracks.length
        const src = tracks[(idx + len) % len]
        this.play(src)
    }

    play(src) {
        this.#audio.pause()
        this.#audio.currentTime = 0
        if (!src) {
            throw new Error("路径为空")
        }
        this.#currentTrack = src
        this.#audioSource.attr("src", src)
        const name = utils.getMusicName(src)
        this.#title.text(name)
        utils.log(`播放：${src}`)
        this.#audio.load()
        this.#tryPlay()
        if ("mediaSession" in navigator) {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: name,
            })
        }
        this.onPlay && this.onPlay(this.#currentTrack)
    }

    #tryPlay() {
        this.#audio.play().catch((err) => utils.log(`play err: ${err.message}`))
    }
}
