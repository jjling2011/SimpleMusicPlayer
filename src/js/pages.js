const TAGS = ["lib", "playlist", "dirlist", "about"]

export default class Pages {
    #lastX
    #lastY
    #curTag
    #marginX
    #marginY

    constructor() {
        const width = Math.min(window.screen.width, window.screen.height)
        this.#marginX = width * 0.25
        this.#marginY = width * 0.2
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
        const d = isLeft ? -1 : +1
        const idx = (TAGS.indexOf(this.#curTag) + d + TAGS.length) % TAGS.length
        const tag = TAGS[idx]
        // utils.log(`从 ${this.#curTag} 切换到：${tag}`)
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
