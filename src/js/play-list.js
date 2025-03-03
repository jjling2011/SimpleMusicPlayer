import Pager from "./pager.js"

export default class PlayList {
    #pageSize = 10
    #pager

    #db
    #player
    #musicDiv
    list

    constructor(db, player) {
        const that = this

        this.#db = db
        this.#player = player
        this.#player.onPlay = (track) => this.refresh(track)
        this.#pager = new Pager("playlist-pager-container", 5)
        this.#pager.onClick = (n) => that.#genMusicList(n)
        this.#musicDiv = $("#playlist-music-list")
        this.#musicDiv.click((e) => {
            if (e.target.tagName === "LI") {
                const src = e.target.getAttribute("data-src")
                that.#player.play(src)
            }
        })

        $("#playlist-sort-btn").click(() => {
            this.#db.sortPlayList()
            that.refresh()
        })
        $("#playlist-shuffle-btn").click(() => {
            this.#db.shufflePlayList()
            that.refresh()
        })
        $("#playlist-reverse-btn").click(() => {
            this.#db.reversePlayList()
            that.refresh()
        })
    }

    #genMusicList(cur) {
        const list = this.list
        this.#musicDiv.empty()
        const start = Math.max(0, (cur - 1) * this.#pageSize)
        const end = Math.min(start + this.#pageSize, list.length)
        if (end <= start) {
            this.#musicDiv.text("列表为空")
            return
        }
        for (let i = start; i < end; i++) {
            const url = list[i]
            const name = utils.getMusicName(url)
            const li = $("<li>")
            li.text(`${i + 1}. ${name}`)
            li.attr("title", url)
            li.attr("data-src", url)
            this.#musicDiv.append(li)
        }
    }

    #updateMusicList(track) {
        const list = this.#db.getPlayList()

        const idx = Math.max(0, list.indexOf(track))
        const cur = Math.floor(idx / this.#pageSize) + 1
        const pns = Math.ceil(list.length / this.#pageSize)

        this.list = list

        this.#pager.goto(cur, pns)
    }

    refresh(track) {
        const src = track || this.#db.getCurTrack()
        this.#updateMusicList(src)
    }
}
