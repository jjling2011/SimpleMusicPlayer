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
    }

    #updateCats() {
        const catsAll = {}
        const catsSelected = {}
        for (const url of this.#data.all) {
            const dirs = url.split("/").filter((s) => s && s !== ".")
            for (let index = 0; index < dirs.length - 1; index++) {
                const dir = `${dirs[index]}`
                catsAll[dir] = (catsAll[dir] || 0) + 1
                catsSelected[dir] = this.#data.catsSelected[dir] || false
            }
        }
        this.#data.catsAll = catsAll
        this.#data.catsSelected = catsSelected
    }

    #updatePlayList() {
        const list = []
        const cats = this.#data.catsSelected
        const dirs = Object.keys(cats)
            .filter((k) => cats[k])
            .map((k) => `/${k}/`)
        for (const url of this.#data.all) {
            for (const dir of dirs) {
                if (url.indexOf(dir) >= 0) {
                    list.push(url)
                    break
                }
            }
        }
        this.#data.list = list
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
            return la < lb ? -1 : la > lb ? 1 : 0
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
        this.#updatePlayList()
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
