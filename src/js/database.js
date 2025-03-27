import utils from "./utils.js"

const DATA_KEY = "data-key"

export default class Database {
    #data
    #saveSettingsTimerHandle

    constructor() {
        this.#load()
    }

    #load() {
        const def = {
            isRandom: true,
            all: [],
            list: [],
            allDirs: {},
            curDir: "",
            customLists: {},
            customHistory: {},
            update: "",
            curTrack: "",
        }

        try {
            const s = window.localStorage.getItem(DATA_KEY)
            const d = JSON.parse(s)
            for (let key in this.#data) {
                if (d[key] === undefined) {
                    d[key] = def[key]
                }
            }
            this.#data = d
        } catch {}

        this.#data = this.#data || def
    }

    isPlayModeRandom() {
        return this.#data.isRandom
    }

    setPlayMode(isRandom) {
        this.#data["isRandom"] = isRandom
        this.#save()
    }

    updateMusicDbAsync() {
        const that = this
        const done = new Promise((resolve) => {
            utils
                .post("serv.php")
                .catch((err) => utils.alert(`更新数据库错误: ${err.message}`))
                .then((s) => {
                    that.#data.all = JSON.parse(s || "[]")
                    that.#data.update = new Date().toLocaleString()
                    that.#updateDirs()
                    that.#updatePlayList()
                    that.#save()
                    utils.alert("更新完成")
                })
                .finally(() => resolve())
        })
        utils.loading("更新数据库中", done)
        return done
    }

    #updateDirs() {
        const allDirs = {}
        for (const url of this.#data.all) {
            const dirs = url.split("/").filter((s) => s && s !== ".")
            let dir = ""
            for (let index = 0; index < dirs.length - 1; index++) {
                dir = `${dir}${dirs[index]}/`
                allDirs[dir] = (allDirs[dir] || 0) + 1
            }
        }
        this.#data.allDirs = allDirs
    }

    loadCustomPlaylist(name) {
        const clist = this.#data.customLists[name]
        if (!clist) {
            return false
        }
        this.#data.list = [...clist]
        this.#save()
        return true
    }

    removeCustomPlayList(name) {
        delete this.#data.customLists[name]
        this.#save()
    }

    addCustomPlayList(name) {
        this.#data.customLists[name] = [...this.#data.list]
        this.#save()
    }

    getCustomPlayListNames() {
        if (!this.#data.customLists) {
            this.#data.customLists = {}
        }
        return Object.keys(this.#data.customLists)
    }

    #updatePlayList() {
        const all = this.#data.all
        this.#data.list = this.#data.list.filter((s) => all.indexOf(s) >= 0)
        const names = this.getCustomPlayListNames()
        for (let name of names) {
            this.#data.customLists[name] = this.#data.customLists[name].filter(
                (s) => all.indexOf(s) >= 0,
            )
        }
    }

    addToPlayList(content) {
        if (!content || !content.length || content.length < 1) {
            return 0
        }
        const list = this.#data.list
        const slim = content.filter((s) => list.indexOf(s) < 0)
        this.#data.list = [...list, ...slim]
        this.#save()
        return slim.length
    }

    setCurTrack(track) {
        this.#data.curTrack = track
        this.#save()
    }

    getCurTrack() {
        return this.#data.curTrack
    }

    getLastUpdateDate() {
        return this.#data.update
    }

    movePlayListMusic(fromIndex, toIndex) {
        const arr = this.#data.list
        if (
            !arr ||
            !arr.length ||
            arr.length < 2 ||
            fromIndex === toIndex ||
            fromIndex < 0 ||
            toIndex < 0 ||
            fromIndex >= arr.length
        ) {
            return
        }
        const dest = Math.min(arr.length - 1, toIndex)
        utils.move(arr, fromIndex, dest)
        this.#save()
    }

    removeOnePlayListMusic(src) {
        this.#data.list = this.#data.list.filter((s) => s !== src)
        this.#save()
    }

    clearPlayList() {
        this.#data.list = []
        this.#save()
    }

    reversePlayList() {
        this.#data.list.reverse()
        this.#save()
    }

    sortPlayList() {
        this.#data.list.sort((a, b) => {
            const pa = a.split("/")
            const pb = b.split("/")
            const la = pa[pa.length - 1]
            const lb = pb[pb.length - 1]
            return utils.compareString(la, lb)
        })
        this.#save()
    }

    shufflePlayList() {
        utils.shuffleArray(this.#data.list)
        this.#save()
    }

    getPlayList() {
        return this.#data.list || []
    }

    getAllMusic() {
        return this.#data.all || []
    }

    getCurDir() {
        return this.#data.curDir
    }

    setCurDir(dir) {
        this.#data.curDir = dir
        this.#save()
    }

    getAllDirs() {
        return this.#data.allDirs || {}
    }

    #saveSettingsCore() {
        const d = JSON.stringify(this.#data)
        window.localStorage.setItem(DATA_KEY, d)
    }

    #save() {
        clearTimeout(this.#saveSettingsTimerHandle)
        this.#saveSettingsTimerHandle = setTimeout(() => {
            this.#saveSettingsCore()
        }, 500)
    }
}
