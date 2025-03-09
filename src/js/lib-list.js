import Pager from "./pager.js"

export default class LibList {
    #pageSize = 10
    #searchResult = []

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
            setTimeout(() => alert(`更新完成`), 1)
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
            `结果：${this.#searchResult.length} 共：${db.length}`,
        )

        const lastPage =
            Math.floor(this.#searchResult.length / this.#pageSize) + 1
        this.#pager.goto(1, lastPage)
    }

    #addOnePlayListMusic(src) {
        const name = utils.getMusicName(src)
        utils.showText("lib-total", `添加到列表：${name}`)
        this.#db.addOnePlayListMusic(src)
        this.#playList.refresh()
    }

    #updateMusicList(cur) {
        const that = this
        const start = Math.max((cur - 1) * this.#pageSize, 0)
        const end = Math.min(start + this.#pageSize, this.#searchResult.length)
        this.#musicList.empty()
        if (end <= start) {
            utils.showText("lib-total", "没有匹配的数据")
            return
        }
        for (let i = start; i < end; i++) {
            const url = this.#searchResult[i]
            const name = utils.getMusicName(url)
            const li = $("<li>")
            li.attr("title", url)
            li.attr("data-src", url)
            const span = $("<span>")
            span.attr("data-src", url)
            span.text(`${i + 1}. ${name}`)
            const btn = $('<button><i class="fa-solid fa-plus"></i></button>')
            btn.click(() => that.#addOnePlayListMusic(url))
            li.append(span)
            li.append(btn)
            this.#musicList.append(li)
        }
    }
}
