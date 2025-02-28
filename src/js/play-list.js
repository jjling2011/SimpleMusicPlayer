import Pager from "./pager.js"

export default class PlayList {
    #pageSize = 10
    #pager

    #db
    #player
    #dirsDiv
    #musicDiv
    #list

    constructor(db, player) {
        const that = this

        this.#pager = new Pager("playlist-pager-container", 5)
        this.#pager.onClick = (n) => that.#genMusicList(n)

        this.#db = db
        this.#dirsDiv = $("#playlist-dirs")

        this.#player = player
        this.#player.onPlay = (track) => this.refresh(track)

        this.#musicDiv = $("#playlist-music-list")
        this.#musicDiv.click((e) => {
            if (e.target.tagName === "LI") {
                const src = e.target.getAttribute("data-src")
                that.#player.play(src)
            }
        })
    }

    #genMusicList(cur) {
        const list = this.#list
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

        this.#list = list

        this.#pager.goto(cur, pns)
    }

    #updateDirBtns() {
        const that = this
        const c = this.#dirsDiv
        c.empty()

        const btnPlayRandom = $("<button title='随机播放'>随机</button>")
        btnPlayRandom.click(() => {
            that.#db.setPlayMode(true)
            that.refresh()
        })
        const btnPlayCycle = $("<button title='顺序播放'>顺序</button>")
        btnPlayCycle.click(() => {
            that.#db.setPlayMode(false)
            that.refresh()
        })
        if (this.#db.isPlayModeRandom()) {
            btnPlayRandom.addClass("active")
        } else {
            btnPlayCycle.addClass("active")
        }
        c.append(btnPlayCycle)
        c.append(btnPlayRandom)

        const cats = this.#db.getCatsAll()
        const catsSelected = this.#db.getCatsSelected()
        const keys = Object.keys(cats)
        for (const dir of keys) {
            const btn = $("<button>")
            btn.text(`${dir} (${cats[dir]})`)
            if (catsSelected[dir]) {
                btn.addClass("active")
            }
            btn.click(() => {
                that.#db.toggleCat(dir)
                that.refresh()
            })
            c.append(btn)
        }
    }

    refresh(track) {
        this.#updateDirBtns()
        this.#updateMusicList(track)
    }
}
