const TAGS = ["lib", "playlist", "dirlist"]

export default class Pages {
    constructor() {}

    init() {
        const that = this
        for (const tag of TAGS) {
            $(`#pages-btn-${tag}`).click(() => {
                that.#hideAll()
                $(`#pages-btn-${tag}`).addClass("active")
                $(`#pages-div-${tag}`).addClass("active")
            })
        }

        const ms = navigator.mediaSession
        if (ms) {
            utils.log("注册 滑动 响应函数")
            ms.setActionHandler("nextslide", () =>
                utils.showStatus("next slide"),
            )
            ms.setActionHandler("previousslide", () =>
                utils.showStatus("prev slide"),
            )
        }
    }

    #hideAll() {
        for (const tag of TAGS) {
            $(`#pages-btn-${tag}`).removeClass("active")
            $(`#pages-div-${tag}`).removeClass("active")
        }
    }
}
