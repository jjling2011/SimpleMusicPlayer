import "./css/solid.min.css"
import "./css/fontawesome.min.css"
import "./css/styles.css"

import Player from "./js/player.js"
import Database from "./js/database.js"
import LibList from "./js/lib-list.js"
import Pages from "./js/pages.js"
import PlayList from "./js/play-list.js"
import DirList from "./js/dir-list.js"
import utils from "./js/utils.js"

const pages = new Pages()
pages.init()

const db = new Database()
const player = new Player(db)
const playList = new PlayList(db, player)
const dirList = new DirList(db, playList, player, pages)
const libList = new LibList(db, player, playList, dirList)

function init() {
    libList.clearSearchKeyword()
    playList.refresh()
    dirList.refresh()
    pages.show("playlist")
}

const cmd = utils.getSearchParam("cmd")
if (db.getAllMusic().length < 1 || cmd === "update") {
    db.updateMusicDbAsync()
        .catch((err) => utils.alert(`更新数据库错误：${err.message}`))
        .finally(() => init())
} else {
    init()
}
