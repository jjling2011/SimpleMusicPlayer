import Pager from "./pager.js"

export default class LibList {
    #pageSize = 10
    #searchResult = []

    #db
    #player
    #playList
    #musicList
    #searchBox
    #pager

    constructor(db, player, playList) {
        const that = this

        this.#db = db
        this.#player = player
        this.#playList = playList

        this.#searchBox = $(`#lib-search-box`)
        this.#searchBox.on("input", () => that.doSearch())
        $(`#lib-clear`).click(() => that.#clearSearchKeyword())
        $(`#lib-update-db`).click(() => that.#confirmUpdateMusicDb())

        this.#musicList = $(`#lib-music-list`)
        this.#musicList.click((e) => {
            if (e.target.tagName === "LI") {
                const src = e.target.getAttribute("data-src")
                that.#player.play(src)
            }
        })

        this.#pager = new Pager("lib-pager-container", 5)
        this.#pager.onClick = (n) => that.#updateMusicList(n)
    }

    async #confirmUpdateMusicDb() {
        const last = this.#db.getLastUpdateDate()
        if (!last || confirm(`上次更新：${last}\n确定要更新数据库吗？`)) {
            await this.#db.updateMusicDbAsync()
            this.#clearSearchKeyword()
            this.#playList.refresh()
        }
    }

    #clearSearchKeyword() {
        const that = this
        this.#searchBox.val("")
        setTimeout(() => {
            that.doSearch()
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

    doSearch() {
        utils.showStatus("搜索中...")
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
        utils.showStatus(
            `匹配：${this.#searchResult.length} 总数：${db.length}`,
        )

        const lastPage =
            Math.floor(this.#searchResult.length / this.#pageSize) + 1
        this.#pager.goto(1, lastPage)
    }

    #updateMusicList(cur) {
        const start = Math.max((cur - 1) * this.#pageSize, 0)
        const end = Math.min(start + this.#pageSize, this.#searchResult.length)
        this.#musicList.empty()
        if (end <= start) {
            utils.showStatus("没有匹配数据")
            return
        }
        for (let i = start; i < end; i++) {
            const url = this.#searchResult[i]
            const name = utils.getMusicName(url)
            const li = $("<li>")
            li.text(`${i + 1}. ${name}`)
            li.attr("title", url)
            li.attr("data-src", url)
            this.#musicList.append(li)
        }
    }
}
