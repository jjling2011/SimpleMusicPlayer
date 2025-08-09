import utils from "./utils.js"

const DEFAULT_PLAYLIST_NAME = "默认歌单"
const DATA_KEY = "data-key"
const STATE_KEY = "state-key"
function saveToLocalStorage(key, value) {
    try {
        const str = JSON.stringify(value)
        window.localStorage.setItem(key, str)
    } catch (err) {
        utils.alert(`保存数据失败：${err.message}`)
    }
}

function isEmptyList(list) {
    return !list || list.length < 1
}

export default class Database {
    #data
    #saveDataTimer

    #state
    #saveStateTimer

    constructor() {
        this.#load()
    }

    #load() {
        const defState = {
            isRandom: true,
            curDir: "",
            customCurList: DEFAULT_PLAYLIST_NAME,
            curTrack: "",
            customHistory: {},
        }

        const defData = {
            all: [],
            allDirs: {},
            customLists: {
                [DEFAULT_PLAYLIST_NAME]: [],
            },
            update: "",
        }

        // load Data
        try {
            const raw_data = window.localStorage.getItem(DATA_KEY)
            const data = JSON.parse(raw_data || "{}")
            for (let key in defData) {
                if (data[key] === undefined) {
                    data[key] = defData[key]
                }
            }
            this.#data = data
        } catch {}
        this.#data = this.#data || defData
        // console.log("data:", this.#data)

        // load State
        try {
            const raw_state = window.localStorage.getItem(STATE_KEY)
            const state = JSON.parse(raw_state || "{}")
            for (let key in defState) {
                if (state[key] === undefined) {
                    // backward-compatible
                    state[key] = state[key] || this.#data[key] || defState[key]
                }
            }
            this.#state = state
        } catch {}
        this.#state = this.#state || defState
        // console.log("state:", this.#state)
    }

    isPlayModeRandom() {
        return this.#state.isRandom
    }

    setPlayMode(isRandom) {
        this.#state["isRandom"] = isRandom
        this.#saveState()
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
                    that.#updatePlayListDB()
                    that.#saveData()
                    resolve()
                })
        })
        utils.loading("更新数据库中", done)
        utils.log(`更新数据库`)
        return done
    }

    #saveCustomHistory() {
        const name = this.#state.customCurList
        if (!name) {
            return
        }
        this.#state.customHistory[name] = {
            curTrack: this.#state.curTrack,
            isRandom: this.#state.isRandom,
        }
    }

    #loadCustomHistory() {
        const name = this.#state.customCurList
        const hist = this.#state.customHistory[name]
        if (!hist) {
            return
        }
        this.#state.curTrack = hist["curTrack"] || ""
        this.#state.isRandom = hist["isRandom"] || false
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

    selectCustomPlaylist(name) {
        const clist = this.#data.customLists[name]
        if (!clist) {
            return false
        }

        if (this.#state.customCurList !== name) {
            this.#saveCustomHistory()
            this.#state.customCurList = name
            this.#loadCustomHistory()
            this.#saveState()
        }
        return true
    }

    removeCustomPlayList(name) {
        delete this.#data.customLists[name]
        this.#saveData()

        delete this.#state.customHistory[name]
        if (this.#state.customCurList !== name) {
            this.#saveState()
            return
        }

        const names = this.getCustomPlayListNames()
        if (names.length < 1) {
            this.#data.customLists[DEFAULT_PLAYLIST_NAME] = []
            this.#saveData()
            this.#state.customCurList = DEFAULT_PLAYLIST_NAME
        } else {
            this.#state.customCurList = names[0]
        }
        this.#saveState()
    }

    addCustomPlayList(name) {
        this.#data.customLists[name] = []
        this.#saveData()
        this.#state.customCurList = name
        this.#saveState()
    }

    replaceCustomPlayList(name, urls) {
        urls = urls || []
        this.#data.customLists[name] = urls
        this.#saveData()
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
        this.#saveData()
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
        this.#saveData()
        return ""
    }

    getCustomCurListName() {
        return this.#state.customCurList
    }

    getCustomPlayListNames() {
        if (!this.#data.customLists) {
            this.#data.customLists = {}
        }
        const names = Object.keys(this.#data.customLists)
        names.sort()
        return names
    }

    #updatePlayListDB() {
        const all = this.#data.all
        const names = this.getCustomPlayListNames()
        for (let name of names) {
            this.#data.customLists[name] = this.#data.customLists[name].filter(
                (s) => all.indexOf(s) >= 0,
            )
        }
    }

    setCurTrack(track) {
        this.#state.curTrack = track
        this.#saveState()
    }

    getCurTrack() {
        return this.#state.curTrack
    }

    getLastUpdateDate() {
        return this.#data.update
    }

    movePlayListMusic(fromIndex, toIndex) {
        const list = this.getPlayList()
        if (
            !list ||
            !list.length ||
            list.length < 2 ||
            fromIndex === toIndex ||
            fromIndex < 0 ||
            toIndex < 0 ||
            fromIndex >= list.length
        ) {
            return
        }

        const dest = Math.min(list.length - 1, toIndex)
        utils.move(list, fromIndex, dest)
        this.#saveData()
    }

    #modifyList(action) {
        const list = this.getPlayList()
        if (isEmptyList(list)) {
            return
        }
        action(list)
        this.#saveData()
    }

    removeOnePlayListMusic(src) {
        this.#modifyList((list) => utils.removeAll(list, src))
    }

    clearPlayList() {
        this.#modifyList((list) => (list.length = 0))
    }

    reversePlayList() {
        this.#modifyList((list) => list.reverse())
    }

    sortPlayList() {
        this.#modifyList((list) =>
            list.sort((a, b) => {
                const pa = a.split("/")
                const pb = b.split("/")
                const la = pa[pa.length - 1]
                const lb = pb[pb.length - 1]
                return utils.compareString(la, lb)
            }),
        )
    }

    shufflePlayList() {
        this.#modifyList((list) => utils.shuffleArray(list))
    }

    getPlayList() {
        const name = this.#state.customCurList
        const list = this.#data.customLists[name]
        return list || []
    }

    getAllMusic() {
        return this.#data.all || []
    }

    getCurDir() {
        return this.#state.curDir
    }

    setCurDir(dir) {
        this.#state.curDir = dir
        this.#saveState()
    }

    getAllDirs() {
        return this.#data.allDirs || {}
    }

    #saveState() {
        const that = this
        clearTimeout(that.#saveStateTimer)
        that.#saveStateTimer = setTimeout(
            () => saveToLocalStorage(STATE_KEY, that.#state),
            500,
        )
    }

    #saveData() {
        const that = this
        clearTimeout(that.#saveDataTimer)
        that.#saveDataTimer = setTimeout(
            () => saveToLocalStorage(DATA_KEY, that.#data),
            500,
        )
    }
}
