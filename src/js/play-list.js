import Pager from "./pager.js"

export default class PlayList {
    #pageSize = 10
    #pager

    #db
    #player
    #musicDiv
    #customPlayListSelect
    list

    constructor(db, player) {
        const that = this

        this.#db = db
        this.#player = player
        this.#player.onPlay = (track) => this.refresh(track)
        this.#pager = new Pager("playlist-pager-container", 5)
        this.#pager.onClick = (n) => that.#genMusicList(n)
        this.#musicDiv = $("#playlist-music-list")
        this.#customPlayListSelect = $("#playlist-custom-playlist")

        $("#playlist-sort-btn").click(() => {
            this.#db.sortPlayList()
            that.refresh()
        })
        $("#playlist-shuffle-btn").click(() => {
            this.#db.shufflePlayList()
            that.refresh()
        })
        $("#playlist-reverse-btn").click(() => {
            this.#db.reversePlayList()
            that.refresh()
        })
        $("#playlist-clear-btn").click(() => {
            this.#db.clearPlayList()
            that.refresh()
        })

        this.#customPlayListSelect.on("change", () => {
            const name = this.#customPlayListSelect.val()
            const first = this.#customPlayListSelect.children().first().val()
            if (!name || name === first) {
                return
            }
            const ok = this.#db.loadCustomPlaylist(name)
            if (ok) {
                this.refresh()
                this.#selectCustomPlaylistName(name)
            } else {
                utils.alert(`加载失败`)
            }
        })

        $("#playlist-remove-custom-playlist").click(async () => {
            const name = this.#customPlayListSelect.val()
            if (!(await utils.confirm(`删除 [${name}] ？`))) {
                return
            }
            this.#db.removeCustomPlayList(name)
            this.refresh()
            this.#selectCustomPlaylistName()
        })

        $("#playlist-add-new-custom-playlist").click(async () => {
            const name = await utils.prompt("请输入歌单名：")
            utils.log(`name: ${name}`)
            if (!name) {
                return
            }
            this.#db.addCustomPlayList(name)
            this.refresh()
            this.#selectCustomPlaylistName(name)
        })

        this.#initReplaceCustomPlayListDialog()
    }

    #initReplaceCustomPlayListDialog() {
        const dialog = $("#dialog-form-replace-custom-playlist")
        const that = this

        $("#dialog-custom-playlist-ok").click(() => {
            const name = $("#dialog-custom-playlist-names").val()
            if (name) {
                that.#db.addCustomPlayList(name)
            }
            dialog.hide()
        })

        $("#dialog-custom-playlist-cancel").click(() => dialog.hide())

        $("#playlist-replace-custom-playlist").click(() => {
            const sel = $("#dialog-custom-playlist-names")
            sel.empty()
            const names = that.#db.getCustomPlayListNames()
            if (names.length < 1) {
                return
            }
            for (let name of names) {
                const o = $("<option>")
                o.val(name)
                o.text(name)
                sel.append(o)
            }
            dialog.show()
        })
    }

    #removeOnePlayListMusic(src) {
        this.#db.removeOnePlayListMusic(src)
        this.refresh()
    }

    #selectCustomPlaylistName(name) {
        // pass
        this.#customPlayListSelect.children().each((idx, el) => {
            const option = $(el)
            option.prop("selected", option.val() === name)
        })
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
        this.#musicDiv.empty()
        const start = Math.max(0, (cur - 1) * this.#pageSize)
        const end = Math.min(start + this.#pageSize, list.length)
        if (end <= start) {
            this.#musicDiv.text("列表为空，请在<目录>中选取音乐")
            return
        }

        const track = this.#db.getCurTrack()
        for (let i = start; i < end; i++) {
            const url = list[i]
            const name = utils.getMusicName(url)
            const li = $("<li>")
            li.attr("title", url)

            const span = $("<span>")
            span.text(`${i + 1}. ${name}`)
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
            this.#musicDiv.append(li)
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

    #updateCustomPlayListSelector() {
        const customPlayListNames = this.#db.getCustomPlayListNames()
        const sel = this.#customPlayListSelect
        sel.empty()
        sel.append($("<option>-- 请选择歌单 --</option>"))
        for (let cname of customPlayListNames) {
            const option = $("<option>")
            option.val(cname)
            option.text(cname)
            sel.append(option)
        }
    }

    refresh(track) {
        const src = track || this.#db.getCurTrack()
        this.#updateMusicList(src)
        utils.showText("playlist-total", `合计：${this.list.length}`)
        this.#updateCustomPlayListSelector()
    }
}
