const TAGS = ["lib", "playlist", "setting"]

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
    }

    #hideAll() {
        for (const tag of TAGS) {
            $(`#pages-btn-${tag}`).removeClass("active")
            $(`#pages-div-${tag}`).removeClass("active")
        }
    }
}
