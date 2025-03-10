export default class DirList {
    #db
    #playList
    #navBar
    #dirsUl

    constructor(db, playList) {
        this.#db = db
        this.#playList = playList
        this.#navBar = $("#dirlist-nav-bar")
        this.#dirsUl = $("#dirlist-dirs")
    }

    refresh() {
        const curDir = this.#db.getCurDir()
        const dirInfo = this.#db.getAllDirs()
        this.#genNavBar(curDir)
        this.#genDirs(curDir, dirInfo)
    }

    #genNavBar(curDir) {
        const that = this

        const bar = this.#navBar
        bar.empty()

        const root = $("<button>root</button>")
        root.click(() => {
            that.#db.setCurDir("")
            that.refresh()
        })
        bar.append(root)

        const dirs = (curDir || "").split("/").filter((s) => s)
        let path = ""
        for (let dir of dirs) {
            path = `${path}${dir}/`
            const p = path
            const btn = $("<button>")
            btn.text(dir)
            btn.click(() => {
                that.#db.setCurDir(p)
                that.refresh()
            })
            bar.append($(`<span>&gt;</span>`))
            bar.append(btn)
        }
    }

    #genDirs(curDir, dirInfo) {
        const that = this
        const c = this.#dirsUl
        const dirs = Object.keys(dirInfo)

        const depth = curDir.split("/").length + 1
        const matches = dirs
            .filter((d) => d.startsWith(curDir) && d !== curDir)
            .filter((d) => d.split("/").length === depth)
            .sort((a, b) => utils.compareString(a, b))

        c.empty()
        if (matches.length < 1) {
            c.append($("<span>当前目录没有子目录</span>"))
            return
        }
        for (let dir of matches) {
            const d = dir
            function cd() {
                that.#db.setCurDir(d)
                that.refresh()
            }

            const li = $("<li>")

            const spanTitle = $("<span>")
            spanTitle.text(`${dir}`)
            spanTitle.click(() => cd())
            li.append(spanTitle)

            const fullDir = `./${dir}`
            function add() {
                const all = that.#db.getAllMusic()
                const m = all.filter((s) => s.startsWith(fullDir))
                const n = that.#db.addToPlayList(m)
                that.#playList.refresh()
                utils.alert(`添加了 ${n} 首歌曲`)
            }

            const spanCount = $("<span>")
            spanCount.text(`(${dirInfo[dir]})`)
            spanCount.click(() => add())
            li.append(spanCount)

            const btnAdd = $(
                '<button title="添加到列表"><i class="fa-solid fa-plus"></i></button>',
            )
            btnAdd.click(() => add())
            li.append(btnAdd)

            c.append(li)
        }
    }
}
