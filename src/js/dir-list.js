export default class DirList {
    #db
    #playList
    #dirsDiv

    constructor(db, playList) {
        const that = this
        this.#db = db
        this.#playList = playList
        this.#dirsDiv = $("#dirlist-dirs")

        $("#dirlist-select-all").click(() => {
            that.#db.selectAllCats()
            that.refresh()
            that.#reportTotal()
        })
        $("#dirlist-clear-selection").click(() => {
            that.#db.unselectAllCats()
            that.refresh()
            that.#reportTotal()
        })
        $("#dirlist-inverse-selection").click(() => {
            that.#db.inverseCatsSelection()
            that.refresh()
            that.#reportTotal()
        })
    }

    refresh() {
        this.#playList.refresh()
        this.#updateDirs()
    }

    #updateDirs() {
        const that = this
        const c = this.#dirsDiv
        c.empty()

        const cats = this.#db.getCatsAll()
        const catsSelected = this.#db.getCatsSelected()
        const keys = Object.keys(cats).sort((a, b) => {
            const pna = a.split("/").length
            const pnb = a.split("/").length
            return pna - pnb || cats[b] - cats[a] || a < b
        })

        for (const dir of keys) {
            const btn = $("<button>")
            const spanNum = $("<span>")
            spanNum.text(`(${cats[dir]})`)
            const spanDir = $("<span>")
            spanDir.text(`${dir}`)
            btn.append(spanDir)
            btn.append(spanNum)

            if (catsSelected[dir]) {
                btn.addClass("active")
            }
            btn.click(() => {
                that.#db.toggleCat(dir)
                that.refresh()
                that.#reportTotal()
            })
            c.append(btn)
        }
    }

    #reportTotal() {
        const selected = this.#db.getPlayList().length
        const all = this.#db.getAllMusic().length
        utils.showStatus(`选中：${selected} 总数：${all}`)
    }
}
