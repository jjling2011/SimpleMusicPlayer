import $ from "jquery"
import utils from "./utils.js"

export default class About {
    #db

    constructor(db) {
        this.#db = db
    }

    showStats() {
        const stats = this.#db.getStats()
        const size_data = utils.formatSize(stats["data"])
        const size_state = utils.formatSize(stats["state"])
        const size_total = utils.formatSize(stats["state"] + stats["data"])
        const msg = `状态数据：${size_state}\n歌曲数据: ${size_data}\n合计：${size_total}`
        utils.alert(msg)
    }

    init() {
        const that = this
        $("#about-get-stats").on("click", () => that.showStats())
    }
}
