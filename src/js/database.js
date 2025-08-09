import utils from "./utils.js"

const DATA_KEY = "data-key"

export default class Database {
    #data
    #saveSettingsTimerHandle

    constructor() {
        this.#load()
    }

    #load() {
        const defName = "默认歌单"
        const def = {
            isRandom: true,
            all: [],
            list: [],
            allDirs: {},
            curDir: "",

            customLists: {
                [defName]: [],
            },
            customCurList: defName,
            customHistory: {},

            update: "",
            curTrack: "",
        }

        try {
            const s = window.localStorage.getItem(DATA_KEY)
            const d = JSON.parse(s)
            for (let key in def) {
                if (d[key] === undefined) {
                    d[key] = def[key]
                }
            }
            this.#data = d
        } catch {}

        this.#data = this.#data || def
        // console.log(this.#data)
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
        const done = new Promise((resolve, reject) => {
            utils
                .post("serv.php")
                .catch(reject)
                .then((s) => {
                    that.#data.all = JSON.parse(s || "[]")
                    that.#data.update = new Date().toLocaleString()
                    that.#updateDirs()
                    that.#updatePlayList()
                    that.#save()
                    resolve()
                })
        })
        utils.loading("更新数据库中", done)
        utils.log("invoke DB update()")
        return done
    }

    #saveCustomHistory() {
        const name = this.#data.customCurList
        if (!name) {
            return
        }
        this.#data.customHistory[name] = {
            curTrack: this.#data.curTrack,
            isRandom: this.#data.isRandom,
        }
    }

    #loadCustomHistory() {
        const name = this.#data.customCurList
        const h = this.#data.customHistory[name]
        if (!h) {
            return
        }
        this.#data.curTrack = h["curTrack"] || ""
        this.#data.isRandom = h["isRandom"] || false
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
        this.#data.customCurList = name
        this.#data.list = [...clist]
        this.#loadCustomHistory()
        this.#save()
        return true
    }

    removeCustomPlayList(name) {
        this.#data.customCurList = ""
        delete this.#data.customLists[name]
        delete this.#data.customHistory[name]
        this.#save()
    }

    addCustomPlayList(name) {
        this.#data.customCurList = name
        this.#data.customLists[name] = [...this.#data.list]
        this.#save()
    }

    replaceCustomPlayList(name, urls) {
        urls = urls || []
        this.#data.customLists[name] = urls
        this.#save()
        return urls.length
    }

    addMusicsToCustomPlayList(name, urls) {
        if (!urls || !urls.length || urls.length < 1) {
            return 0
        }
        const list = this.#data.customLists[name]
        if (!list) {
            return 0
        }
        const slim = urls.filter((s) => list.indexOf(s) < 0)
        this.#data.customLists[name] = [...list, ...slim]
        this.#save()
        return slim.length
    }

    addOneMusicToCustomPlayList(name, url) {
        if (!url) {
            return `音乐路径为空！`
        }
        const list = this.#data.customLists[name]
        if (!list) {
            return `歌单不 [${name}] 存在！`
        }
        if (list.indexOf(url) >= 0) {
            return `目标歌单已经存在相同音乐！`
        }
        list.push(url)
        this.#save()
        return ""
    }

    clearCustomCurListName() {
        this.#data.customCurList = ""
    }

    getCustomCurListName() {
        return this.#data.customCurList
    }

    getCustomPlayListNames() {
        if (!this.#data.customLists) {
            this.#data.customLists = {}
        }
        const names = Object.keys(this.#data.customLists)
        names.sort()
        return names
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
        this.#data.customCurList = ""
        const dest = Math.min(arr.length - 1, toIndex)
        utils.move(arr, fromIndex, dest)
        this.#save()
    }

    removeOnePlayListMusic(src) {
        this.#data.customCurList = ""
        this.#data.list = this.#data.list.filter((s) => s !== src)
        this.#save()
    }

    clearPlayList() {
        this.#data.customCurList = ""
        this.#data.list = []
        this.#save()
    }

    reversePlayList() {
        this.#data.customCurList = ""
        this.#data.list.reverse()
        this.#save()
    }

    sortPlayList() {
        this.#data.customCurList = ""
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
        this.#data.customCurList = ""
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
        this.#saveCustomHistory()
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
