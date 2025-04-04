import $ from "jquery"
const TAGS = ["lib", "playlist", "dirlist", "about"]

export default class Pages {
    #lastX
    #lastY
    #curTag
    #marginX
    #marginY

    constructor() {
        const width = Math.min(window.screen.width, window.screen.height)
        this.#marginX = width * 0.22
        this.#marginY = width * 0.18
    }

    init() {
        const that = this
        for (const tag of TAGS) {
            $(`#pages-btn-${tag}`).on("click", () => {
                that.show(tag)
            })

            $(`#pages-div-${tag}`).on("touchstart", (evt) => {
                const o = evt.changedTouches[0]
                that.#lastX = o.screenX
                that.#lastY = o.screenY
            })

            $(`#pages-div-${tag}`).on("touchend", (evt) => {
                const o = evt.changedTouches[0]
                if (!o) {
                    return
                }
                const dx = o.screenX - that.#lastX
                const dy = Math.abs(o.screenY - that.#lastY)
                if (Math.abs(dx) > that.#marginX && dy < that.#marginY) {
                    const isLeft = dx < 0
                    that.slideTo(isLeft)
                }
            })
        }
    }

    slideTo(isLeft) {
        const d = isLeft ? +1 : -1
        const idx = TAGS.indexOf(this.#curTag) + d
        const i = Math.max(0, Math.min(TAGS.length - 1, idx))
        const tag = TAGS[i]
        this.show(tag)
    }

    show(tag) {
        this.#curTag = tag
        this.#hideAll()
        $(`#pages-btn-${tag}`).addClass("active")
        $(`#pages-div-${tag}`).addClass("active")
    }

    #hideAll() {
        for (const tag of TAGS) {
            $(`#pages-btn-${tag}`).removeClass("active")
            $(`#pages-div-${tag}`).removeClass("active")
        }
    }
}
