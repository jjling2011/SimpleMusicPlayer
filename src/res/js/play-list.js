import Pager from "./pager.js"

export default class PlayList {
    #pageSize = 10
    #pager

    #db
    #player
    #musicListUl
    list

    constructor(db, player) {
        const that = this

        this.#db = db
        this.#player = player
        this.#player.onPlay = (track) => this.refresh(track)
        this.#pager = new Pager("playlist-pager-container", 5)
        this.#pager.onClick = (n) => that.#genMusicList(n)
        this.#musicListUl = $("#playlist-music-list")

        this.#addMusicListUlDragDropSupport()

        $("#playlist-sort-btn").click(() => {
            that.#db.sortPlayList()
            that.refresh()
        })
        $("#playlist-shuffle-btn").click(() => {
            that.#db.shufflePlayList()
            that.refresh()
        })
        $("#playlist-reverse-btn").click(() => {
            that.#db.reversePlayList()
            that.refresh()
        })
        $("#playlist-clear-btn").click(() => {
            that.#db.clearPlayList()
            that.refresh()
        })

        async function selectCustomPlayListName(tag) {
            const names = that.#db.getCustomPlayListNames()
            if (!names || names.length < 1) {
                utils.alert(`没有歌单可选，请先新建歌单。`)
                return
            }
            const name = await utils.select(`请选择要${tag}的歌单名：`, names)
            return name
        }

        $("#playlist-load-custom-playlist").click(async () => {
            const name = await selectCustomPlayListName("加载")
            if (!name) {
                return
            }
            const ok = that.#db.loadCustomPlaylist(name)
            if (ok) {
                that.refresh()
            } else {
                utils.alert(`加载失败`)
            }
        })

        $("#playlist-replace-custom-playlist").click(async () => {
            const name = await selectCustomPlayListName("替换")
            if (!name) {
                return
            }
            that.#db.addCustomPlayList(name)
            that.refresh()
        })

        $("#playlist-remove-custom-playlist").click(async () => {
            const name = await selectCustomPlayListName("删除")
            if (!name) {
                return
            }
            that.#db.removeCustomPlayList(name)
            that.refresh()
        })

        $("#playlist-add-new-custom-playlist").click(async () => {
            const name = await utils.prompt("请输入歌单名：")
            if (!name) {
                return
            }
            that.#db.addCustomPlayList(name)
            that.refresh()
        })
    }

    #addMusicListUlDragDropSupport() {
        const that = this
        let dest = null
        let src = null

        this.#musicListUl.on("dragstart", (evt) => {
            dest = null
            src = $(evt.target)
        })

        this.#musicListUl.on("dragover", (evt) => {
            dest = $(evt.target)
            evt.preventDefault()
        })

        this.#musicListUl.on("dragend", () => {
            const d = dest
            const s = src
            if (!d || !s) {
                return
            }

            const si = s.attr("data-index")
            const di = d.attr("data-index")
            if (!si || !di) {
                return
            }

            const idxFrom = parseInt(si)
            const idxTo = parseInt(di)
            if (idxFrom === NaN || idxTo === NaN || idxFrom === idxTo) {
                return
            }
            that.#db.movePlayListMusic(idxFrom, idxTo)
            that.refresh()
        })
    }

    #removeOnePlayListMusic(src) {
        this.#db.removeOnePlayListMusic(src)
        this.refresh()
    }

    async #edit(idx, name) {
        const r = await utils.prompt(`请输入 [${name}] 的新序号：`, idx + 1)
        if (r === null) {
            return
        }
        const n = parseInt(r)
        if (n === NaN) {
            return
        }
        this.#db.movePlayListMusic(idx, Math.floor(n) - 1)
        this.refresh()
    }

    #genMusicList(cur) {
        const that = this
        const list = this.list
        this.#musicListUl.empty()
        const start = Math.max(0, (cur - 1) * this.#pageSize)
        const end = Math.min(start + this.#pageSize, list.length)
        if (end <= start) {
            this.#musicListUl.text("列表为空，请在 <目录> 中选取音乐")
            return
        }

        const track = this.#db.getCurTrack()
        for (let i = start; i < end; i++) {
            const url = list[i]
            const name = utils.getMusicName(url)
            const li = $("<li>")
            li.attr("title", url)
            li.attr("data-index", i)
            li.attr("draggable", "true")

            const span = $("<span>")
            span.text(`${i + 1}. ${name}`)
            span.attr("data-index", i)
            span.attr("draggable", "true")
            span.click(() => that.#player.play(url))
            li.append(span)

            const btnPlay = $(
                '<button><i class="fa-solid fa-play"></i></button>',
            )
            btnPlay.click(() => that.#player.play(url))
            li.append(btnPlay)

            const btnEdit = $(
                '<button><i class="fa-solid fa-pen"></i></button>',
            )
            btnEdit.click(() => that.#edit(i, name))
            li.append(btnEdit)

            const btnRemove = $(
                '<button><i class="fa-solid fa-xmark"></i></button>',
            )
            btnRemove.click(() => that.#removeOnePlayListMusic(url))
            li.append(btnRemove)

            if (track === url) {
                li.addClass("active")
            }
            this.#musicListUl.append(li)
        }
    }

    #updateMusicList(track) {
        const list = this.#db.getPlayList()

        const idx = Math.max(0, list.indexOf(track))
        const cur = Math.floor(idx / this.#pageSize) + 1
        const pns = Math.ceil(list.length / this.#pageSize)

        this.list = list
        this.#pager.goto(cur, pns)
    }

    refresh(track) {
        const src = track || this.#db.getCurTrack()
        this.#updateMusicList(src)
        const total = this.list.length
        utils.showText("playlist-total", `歌曲：${total}`)
        utils.showText("dirlist-total", `歌曲：${total}`)
        const n = this.#db.getCustomPlayListNames().length || 0
        utils.showText("custom-playlist-total", `歌单：${n}`)
    }
}
