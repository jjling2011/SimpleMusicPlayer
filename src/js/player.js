export default class Player {
    #db

    #title
    #audio
    #playBtn
    #audioSource
    #currentTrack
    #isPlaying = false
    onPlay = null

    constructor(db) {
        const that = this
        this.#db = db
        this.#title = $("#audio-title")
        this.#audio = $("#audio")[0]
        this.#audioSource = $("#audio-source")
        this.#playBtn = $("#audio-start-pause")

        this.#audio.addEventListener("ended", () => this.nextTrack())

        if ("mediaSession" in navigator) {
            utils.log("注册 <上一首> <下一首> 按钮响应函数")
            navigator.mediaSession.setActionHandler("nexttrack", () =>
                that.nextTrack(),
            )
            navigator.mediaSession.setActionHandler("previoustrack", () =>
                that.prevTrack(),
            )
        }

        const progBar = $("#audio-progress-bar")
        const timeLabel = $("#audio-timestamp")
        this.#audio.addEventListener("timeupdate", () => {
            const dur = that.#audio.duration
            if (!dur) {
                timeLabel.text(`0:00 / 0:00`)
                return
            }

            const cur = that.#audio.currentTime
            const percent = Math.floor((cur / dur) * 100)
            progBar.width(`${percent}%`)
            timeLabel.text(
                `${utils.formatTime(cur)} / ${utils.formatTime(dur)}`,
            )
        })

        this.#audio.addEventListener("play", () => {
            that.#isPlaying = true
            that.#playBtn.val("⏸")
        })

        this.#audio.addEventListener("pause", () => {
            that.#isPlaying = false
            that.#playBtn.val("▶")
        })

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

        $("#audio-prev-track").click(() => {
            that.prevTrack()
        })

        $("#audio-next-track").click(() => {
            that.nextTrack()
        })

        this.#playBtn.click(() => {
            if (that.#isPlaying) {
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
