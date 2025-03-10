export default class Player {
    #db

    #title
    #audio
    #audioSource

    // callback event handler
    onPlay = (track) => {}

    constructor(db) {
        const that = this

        this.#db = db
        this.#title = $("#audio-title")
        this.#audio = $("#audio")[0]
        this.#audioSource = $("#audio-source")

        this.#audio.addEventListener("ended", () => that.nextTrack())
        const ms = navigator.mediaSession
        if (ms) {
            utils.log("注册 <上一首> <下一首> 响应函数")
            ms.setActionHandler("nexttrack", () => that.nextTrack())
            ms.setActionHandler("previoustrack", () => that.prevTrack())
        }

        this.#resetTimeLabel()
        this.#initTimeLabelUpdater()

        this.#initProgressClickHandler()
        this.#initPlayModeButton()
        this.#initPrevNextTrackButtons()
        this.#initPlayButton()

        const src = this.#db.getCurTrack()
        if (src) {
            this.#loadTrack(src)
        }
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
        const playModeBtn = $("#audio-play-mode")
        function updatePlayModeBtn() {
            const isRandom = that.#db.isPlayModeRandom()
            const shuffle = '<i class="fa-solid fa-shuffle"></i>'
            const cycle = '<i class="fa-solid fa-repeat"></i>'
            playModeBtn.html(isRandom ? shuffle : cycle)
        }
        updatePlayModeBtn()
        playModeBtn.click(() => {
            const isRandom = !this.#db.isPlayModeRandom()
            that.#db.setPlayMode(isRandom)
            updatePlayModeBtn()
        })
    }

    #resetTimeLabel() {
        $("#audio-timestamp").text("0:00 / 0:00")
        $("#audio-progress-bar").width("0%")
        $("#audio-progress-buff").width("0%")
    }

    #initTimeLabelUpdater() {
        const that = this

        const timeLabel = $("#audio-timestamp")
        const progBar = $("#audio-progress-bar")
        const bufBar = $("#audio-progress-buff")

        this.#audio.addEventListener("timeupdate", () => {})

        this.#audio.addEventListener("timeupdate", () => {
            const dur = that.#audio.duration
            const buf = that.#audio.buffered
            if (!dur || !buf || buf.length < 1) {
                timeLabel.text("0:00 / 0:00")
                return
            }
            const cur = that.#audio.currentTime

            // progress bar
            const pcb = Math.floor((buf.end(buf.length - 1) / dur) * 100)
            const pcc = Math.floor((((cur / dur) * 100) / pcb) * 100)
            bufBar.width(`${pcb}%`)
            progBar.width(`${pcc}%`)

            // timestamp
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
            playBtn.html('<i class="fa-solid fa-pause"></i>')
        })

        this.#audio.addEventListener("pause", () => {
            isPlaying = false
            playBtn.html('<i class="fa-solid fa-play"></i>')
        })

        playBtn.click(() => {
            if (isPlaying) {
                that.#audio.pause()
                return
            }
            const src = that.#audioSource.attr("src")
            if (src) {
                utils.log(`try play: ${src}`)
                that.#tryPlay(src)
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
        this.#db.setCurTrack(src)
        this.#tryPlay(src)
    }

    #tryPlay(src) {
        this.#audio.play().catch((err) => utils.log(`play err: ${err.message}`))
        this.onPlay && this.onPlay(src)
    }
}
