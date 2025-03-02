export default class DirList {
    #db
    #playList
    #dirsDiv

    constructor(db, playList) {
        this.#db = db
        this.#playList = playList
        this.#dirsDiv = $("#pages-div-dirlist")
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
        const keys = Object.keys(cats).sort(
            (a, b) => cats[b] - cats[a] || a.localeCompare(b),
        )

        for (const dir of keys) {
            const btn = $("<button>")
            btn.text(`${dir} (${cats[dir]})`)
            if (catsSelected[dir]) {
                btn.addClass("active")
            }
            btn.click(() => {
                that.#db.toggleCat(dir)
                that.refresh()

                const selected = this.#db.getPlayList().length
                const all = this.#db.getAllMusic().length
                utils.showStatus(`选中：${selected} 总数：${all}`)
            })
            c.append(btn)
        }
    }
}
