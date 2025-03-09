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
            catsAll: {},
            catsSelected: {},
            customLists: {},
            update: "",
            curTrack: "",
        }

        try {
            const s = window.localStorage.getItem(DATA_KEY)
            this.#data = JSON.parse(s)
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

    async updateMusicDbAsync() {
        utils.showStatus("更新数据库。。。")
        const s = await utils.post("serv.php")
        this.#data.all = JSON.parse(s || "[]")
        this.#data.update = new Date().toLocaleString()
        this.#updateCats()
        this.#updatePlayList()
        this.#save()
        utils.showStatus("")
    }

    #updateCats() {
        const catsAll = {}
        const catsSelected = {}
        for (const url of this.#data.all) {
            const dirs = url.split("/").filter((s) => s && s !== ".")
            let dir = ""
            for (let index = 0; index < dirs.length - 1; index++) {
                dir = `${dir}${dirs[index]}/`
                catsAll[dir] = (catsAll[dir] || 0) + 1
                catsSelected[dir] = this.#data.catsSelected[dir] || false
            }
        }
        this.#data.catsAll = catsAll
        this.#data.catsSelected = catsSelected
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

    replacePlayListBySelectedCats() {
        this.#data.list = this.genPlayListBySelectedCats()
        this.#save()
    }

    genPlayListBySelectedCats() {
        const list = []
        const cats = this.#data.catsSelected
        const dirs = Object.keys(cats).filter((k) => cats[k])
        for (const url of this.#data.all) {
            for (const dir of dirs) {
                if (url.indexOf(dir) >= 0) {
                    list.push(url)
                    break
                }
            }
        }
        return list
    }

    #setAllCats(state) {
        const cats = this.#data.catsSelected
        const keys = Object.keys(cats)
        for (const key of keys) {
            cats[key] = state
        }
        this.#save()
    }

    selectAllCats() {
        this.#setAllCats(true)
    }

    inverseCatsSelection() {
        const cats = this.#data.catsSelected
        const keys = Object.keys(cats)
        for (const key of keys) {
            cats[key] = !cats[key]
        }
        this.#save()
    }

    unselectAllCats() {
        this.#setAllCats(false)
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

    addOnePlayListMusic(src) {
        if (this.#data.list.indexOf(src) < 0) {
            this.#data.list.push(src)
        }
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
        return this.#data.list
    }

    getAllMusic() {
        return this.#data.all
    }

    getCatsAll() {
        return this.#data.catsAll
    }

    getCatsSelected() {
        return this.#data.catsSelected
    }

    toggleCat(cat) {
        this.#data.catsSelected[cat] = !this.#data.catsSelected[cat]
        this.#save()
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
