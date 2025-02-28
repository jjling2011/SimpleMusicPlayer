export default class Pager {
    #container
    #showN

    onClick = function (n) {
        // click page [1, ..., n]
        console.log(`call onClick(${n})`)
        console.log(`please override Pager.onClick(n) function`)
    }

    constructor(divId, showN) {
        this.#container = $(`#${divId}`)
        this.#showN = showN
    }

    goto(cur, last) {
        const end = Math.max(1, last)
        const c = Math.min(Math.max(1, cur), end)
        // console.log(`goto: ${cur}, ${last}`)
        this.onClick(c, end)
        this.#draw(c, end)
    }

    #createBtn(tag, idx, last) {
        const that = this
        const btn = $("<button>")
        btn.text(tag)
        btn.click(() => that.goto(idx, last))
        return btn
    }

    #draw(curPage, lastPage) {
        const c = this.#container

        c.empty()
        if (lastPage < 2) {
            return
        }

        const start = Math.max(Math.floor(curPage - this.#showN / 2), 1)
        const end = Math.min(start + this.#showN, lastPage)

        if (start !== 1) {
            const firstBtn = this.#createBtn("<", 1, lastPage)
            c.append(firstBtn)
            c.append($("<span>...</span>"))
        }

        for (let index = start; index <= end; index++) {
            const idx = index
            const btn = this.#createBtn(`${idx}`, idx, lastPage)
            if (idx === curPage) {
                btn.addClass("active")
            }
            this.#container.append(btn)
        }
        if (end !== lastPage) {
            c.append($("<span>...</span>"))
            const lastBtn = this.#createBtn(">", lastPage, lastPage)
            c.append(lastBtn)
        }

        const s = $("<div>")
        const lbPageNum = $('<input type="text">')
        const btnJump = $("<button>Go</button>")

        btnJump.click(() => {
            const pn = parseInt(lbPageNum.val()) || 1
            this.goto(pn, lastPage)
        })
        lbPageNum.keydown((evt) => {
            if (evt.key === "Enter") {
                btnJump.trigger("click")
            }
        })

        s.append(lbPageNum)
        s.append(btnJump)
        c.append(s)
    }
}
