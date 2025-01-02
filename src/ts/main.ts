//#region Utils
const dom = {
    q<K extends keyof HTMLElementTagNameMap>(selectors: K | string): HTMLElementTagNameMap[K] | null {
        return document.querySelector(selectors)
    },
    qe<K extends keyof HTMLElementTagNameMap>(el: HTMLElement, selectors: K | string): HTMLElementTagNameMap[K] | null {
        return el.querySelector(selectors)
    },
    qa<K extends keyof HTMLElementTagNameMap>(selectors: K | string, to_array?: boolean): NodeListOf<HTMLElementTagNameMap[K]> | HTMLElementTagNameMap[K][] {
        if (to_array) {
            const arr: HTMLElementTagNameMap[K][] = []
            document.querySelectorAll(selectors).forEach(item => {
                arr.push(item as HTMLElementTagNameMap[K])
            })
            return arr
        }
        return document.querySelectorAll(selectors)
    },
    qea<K extends keyof HTMLElementTagNameMap>(el: HTMLElement, selectors: K | string): NodeListOf<HTMLElementTagNameMap[K]> {
        return el.querySelectorAll(selectors)
    },
    disable(...elements: HTMLElement[]) {
        for (const el of elements) {
            el.setAttribute('disabled', '')
            el.classList.add('disabled')
        }
    },
    enable(...elements: HTMLElement[]) {
        for (const el of elements) {
            if (el.hasAttribute('disabled')) {
                el.removeAttribute('disabled')
            }
            el.classList.remove('disabled')
        }
    },
    c<K extends keyof HTMLElementTagNameMap>(tag_name: K, options?: {
        classes?: string[],
        attributes?: { [name: string]: string },
        html?: string,
        text?: string,
        children?: Node[],
    }): HTMLElementTagNameMap[K] {
        const el = document.createElement(tag_name)
        if (options) {
            if (options.classes) el.classList.add(...options.classes)
            if (options.attributes) {
                for (const name in options.attributes) {
                    el.setAttribute(name, options.attributes[name])
                }
            }
            if (options.html) el.innerHTML = options.html
            else if (options.text) el.textContent = options.text
            if (options.children) {
                for (const child of options.children) {
                    el.appendChild(child)
                }
            }
        }
        return el
    },
    get_input_radio_value(name: string) {
        let value = ''
        this.qa<'input'>(`input[name="${name}"]`).forEach(n => {
            if (n.checked) value = n.value
        })
        return value
    },
    hide(...elements: HTMLElement[]) {
        for (const el of elements) {
            el.classList.add('visually-hidden')
        }
    },
    show(...elements: HTMLElement[]) {
        for (const el of elements) {
            el.classList.remove('visually-hidden')
        }
    },
}
//#endregion
