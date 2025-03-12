export default class DirList {
    #db
    #player
    #pages
    #playList
    #navBar
    #dirsUl

    constructor(db, playList, player, pages) {
        const that = this
        this.#db = db
        this.#player = player
        this.#pages = pages
        this.#playList = playList
        this.#navBar = $("#dirlist-nav-bar")
        this.#dirsUl = $("#dirlist-dirs")

        $("#dirlist-clear-btn").on("click", () => {
            that.#db.clearPlayList()
            that.#playList.refresh()
        })
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
        root.on("click", () => {
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
            btn.on("click", () => {
                that.#db.setCurDir(p)
                that.refresh()
            })
            bar.append($(`<span>&gt;</span>`))
            bar.append(btn)
        }
    }

    #getSubDirs(dir, dirs) {
        const depth = dir.split("/").length + 1
        const r = dirs
            .filter((d) => d.startsWith(dir) && d !== dir)
            .filter((d) => d.split("/").length === depth)

        r.sort((a, b) => utils.compareString(a, b))
        return r
    }

    #genDirs(curDir, dirInfo) {
        const that = this
        const ul = this.#dirsUl
        const dirs = Object.keys(dirInfo)
        const subDirs = this.#getSubDirs(curDir, dirs)

        ul.empty()
        if (subDirs.length < 1) {
            ul.append($("<span>当前目录没有子目录</span>"))
            return
        }
        for (let subDir of subDirs) {
            const sub = subDir
            const sub2 = that.#getSubDirs(sub, dirs)
            const s2c = sub2.length
            const mc = dirInfo[subDir]

            function cd() {
                that.#db.setCurDir(sub)
                that.refresh()
            }

            const li = $("<li>")

            const spanTitle = $("<span>")
            spanTitle.text(`${subDir}`)
            spanTitle.attr(`title`, `音乐：${mc} 子目录: ${s2c}`)
            if (s2c) {
                spanTitle.on("click", () => cd())
            } else {
                spanTitle.on("click", () => utils.alert(`当前目录没有子目录`))
            }
            li.append(spanTitle)

            const fullDir = `./${subDir}`
            function add() {
                const all = that.#db.getAllMusic()
                const m = all.filter((s) => s.startsWith(fullDir))
                const n = that.#db.addToPlayList(m)
                that.#playList.refresh()
                utils.alert(`添加了 ${n} 首音乐`)
            }

            const spanCount = $("<span>")
            spanCount.text(`(${mc}/${s2c})`)
            spanCount.attr(`title`, `音乐：${mc} 子目录: ${s2c}`)

            spanCount.on("click", () => add())
            li.append(spanCount)

            const btnPlay = $(
                '<button><i class="fa-solid fa-play"></i></button>',
            )
            btnPlay.on("click", () => {
                const all = that.#db.getAllMusic()
                const m = all.filter((s) => s.startsWith(fullDir))
                if (m.length < 1) {
                    utils.alert("目录内没有音乐")
                    return
                }
                that.#db.clearPlayList()
                that.#db.addToPlayList(m)
                that.#playList.refresh()
                that.#player.nextTrack()
                that.#pages.show("playlist")
            })
            li.append(btnPlay)

            const btnAdd = $(
                '<button title="添加到列表"><i class="fa-solid fa-plus"></i></button>',
            )
            btnAdd.on("click", () => add())
            li.append(btnAdd)

            ul.append(li)
        }
    }
}
