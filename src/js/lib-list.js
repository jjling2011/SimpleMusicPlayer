import $ from "jquery"
import utils from "./utils.js"
import Pager from "./pager.js"

export default class LibList {
    #pageSize = utils.getPageSize()
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
        $(`#lib-clear`).on("click", () => that.clearSearchKeyword())
        $(`#lib-update-db`).on("click", () => that.#confirmUpdateMusicDb())

        this.#musicList = $(`#lib-music-list`)
        this.#pager = new Pager("lib-pager-container", 5)
        this.#pager.onClick = (n) => that.#updateMusicList(n)

        $(`#lib-add-cur-page-to-playlist`).on("click", async () => {
            const n = await that.#playList.addMultiplePlayListMusic(
                that.#curResult,
            )
            utils.alert(`添加了 ${n} 首音乐`)
        })

        $(`#lib-add-result-to-playlist`).on("click", async () => {
            const n = await that.#playList.addMultiplePlayListMusic(
                that.#searchResult,
            )
            utils.alert(`添加了 ${n} 首音乐`)
        })
    }

    async #confirmUpdateMusicDb() {
        const last = this.#db.getLastUpdateDate()
        if (
            last &&
            !(await utils.confirm(`上次更新：${last}\n确定要更新数据库吗？`))
        ) {
            return
        }
        try {
            await this.#db.updateMusicDbAsync()
        } catch (err) {
            utils.alert(`更新数据库错误：${err.message}`)
        }
        this.clearSearchKeyword()
        this.#dirList.refresh()
    }

    clearSearchKeyword() {
        const that = this
        this.#searchBox.val("")
        setTimeout(() => {
            that.#doSearch()
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

    #genMusicList(start, end) {
        const that = this
        for (let i = start; i < end; i++) {
            const url = this.#searchResult[i]
            const name = utils.getMusicName(url)

            const li = $("<li>")
            li.attr("title", url)

            const span = $("<span>")
            span.text(`${i + 1}. ${name}`)
            span.on("click", () => {
                that.#player.play(url)
            })
            li.append(span)

            const btnAdd = $(
                '<button><i class="fa-solid fa-plus"></i></button>',
            )
            btnAdd.attr("title", "添加到歌单")
            btnAdd.on("click", () => that.#playList.addOnePlayListMusic(url))
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
