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
        })
        $("#dirlist-clear-selection").click(() => {
            that.#db.unselectAllCats()
            that.refresh()
        })
        $("#dirlist-inverse-selection").click(() => {
            that.#db.inverseCatsSelection()
            that.refresh()
        })
    }

    refresh() {
        this.#playList.refresh()
        this.#updateDirs()
        this.#reportTotal()
    }

    #updateDirs() {
        const that = this
        const c = this.#dirsDiv
        c.empty()

        const cats = this.#db.getCatsAll()
        const catsSelected = this.#db.getCatsSelected()
        const keys = Object.keys(cats).sort((a, b) => {
            const pna = a.split("/").filter((s) => s).length
            const pnb = b.split("/").filter((s) => s).length
            return pna - pnb || cats[b] - cats[a] || utils.compareString(a, b)
        })

        for (const dir of keys) {
            const li = $("<li>")
            const spanNum = $("<span>")
            spanNum.text(`(${cats[dir]})`)
            const spanDir = $("<span>")
            spanDir.text(`${dir}`)
            li.append(spanDir)
            li.append(spanNum)

            if (catsSelected[dir]) {
                li.addClass("active")
            }
            li.click(() => {
                that.#db.toggleCat(dir)
                that.refresh()
            })
            c.append(li)
        }
    }

    #reportTotal() {
        const selected = this.#db.getPlayList().length
        const all = this.#db.getAllMusic().length
        utils.showText("dirlist-total", `选中：${selected} 共：${all}`)
    }
}
