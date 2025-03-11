import Pager from "./pager.js"

export default class LibList {
    #pageSize = 10
    #searchResult = []
    #curResult = []

    #db
    #player
    #dirList
    #musicList
    #searchBox
    #pager
    #playList

    constructor(db, player, playList, dirList) {
        const that = this

        this.#db = db
        this.#player = player
        this.#playList = playList
        this.#dirList = dirList

        this.#searchBox = $(`#lib-search-box`)
        this.#searchBox.on("input", () => that.#doSearch())
        $(`#lib-clear`).click(() => that.clearSearchKeyword())
        $(`#lib-update-db`).click(() => that.#confirmUpdateMusicDb())

        this.#musicList = $(`#lib-music-list`)
        this.#pager = new Pager("lib-pager-container", 5)
        this.#pager.onClick = (n) => that.#updateMusicList(n)

        $(`#lib-add-cur-page-to-playlist`).click(() => {
            const n = that.#db.addToPlayList(that.#curResult)
            that.#playList.refresh()
            utils.alert(`添加了 ${n} 首音乐`)
        })

        $(`#lib-add-result-to-playlist`).click(() => {
            const n = that.#db.addToPlayList(that.#searchResult)
            that.#playList.refresh()
            utils.alert(`添加了 ${n} 首音乐`)
        })
    }

    async #confirmUpdateMusicDb() {
        const last = this.#db.getLastUpdateDate()
        if (
            !last ||
            (await utils.confirm(`上次更新：${last}\n确定要更新数据库吗？`))
        ) {
            await this.#db.updateMusicDbAsync()
            this.clearSearchKeyword()
            this.#dirList.refresh()
        }
    }

    clearSearchKeyword() {
        const that = this
        this.#searchBox.val("")
        setTimeout(() => {
            that.#doSearch()
            that.#searchBox.focus()
        }, 1)
    }

    #getKeywrods() {
        const kws = this.#searchBox
            .val()
            .toLowerCase()
            .split(/[ ,-]/)
            .filter((kw) => kw)
        return kws
    }

    #doSearch() {
        utils.showText("lib-total", "搜索中...")
        const db = this.#db.getAllMusic()
        const kws = this.#getKeywrods()
        if (kws.length < 1) {
            this.#searchResult = db
        } else {
            const r = []
            for (let index = 0; index < db.length; index++) {
                const url = db[index]
                const name = utils.getMusicName(url).toLowerCase()
                if (name && utils.isMatch(name, kws)) {
                    r.push(url)
                }
            }
            this.#searchResult = r
        }
        utils.showText(
            "lib-total",
            `匹配：${this.#searchResult.length} 共：${db.length}`,
        )

        const lastPage =
            Math.floor(this.#searchResult.length / this.#pageSize) + 1
        this.#pager.goto(1, lastPage)
    }

    #addOnePlayListMusic(src) {
        const name = utils.getMusicName(src)
        const n = this.#db.addToPlayList([src])
        const msg = n > 0 ? `添加 [${name}] 成功` : `已存在：[${name}]`
        utils.showText("lib-total", msg)
        if (n) {
            this.#playList.refresh()
        }
    }

    #genMusicList(start, end) {
        const that = this
        for (let i = start; i < end; i++) {
            const url = this.#searchResult[i]
            const name = utils.getMusicName(url)

            const li = $("<li>")
            li.attr("title", url)

            const span = $("<span>")
            span.text(`${i + 1}. ${name}`)
            span.click(() => that.#player.play(url))
            li.append(span)

            const btnPlay = $(
                '<button><i class="fa-solid fa-play"></i></button>',
            )
            btnPlay.click(() => that.#player.play(url))
            li.append(btnPlay)

            const btnAdd = $(
                '<button><i class="fa-solid fa-plus"></i></button>',
            )
            btnAdd.attr("title", "添加到列表")
            btnAdd.click(() => that.#addOnePlayListMusic(url))
            li.append(btnAdd)

            this.#musicList.append(li)
        }
    }

    #updateMusicList(cur) {
        const start = Math.max((cur - 1) * this.#pageSize, 0)
        const end = Math.min(start + this.#pageSize, this.#searchResult.length)
        this.#musicList.empty()
        if (end <= start) {
            this.#curResult = []
            utils.showText("lib-total", "没有匹配的数据")
            return
        }

        this.#curResult = this.#searchResult.slice(start, end)
        this.#genMusicList(start, end)
    }
}
