//#region Defines
type ValueOf<T> = T[keyof T]

interface ObjectOf<T> {
    [name: string]: T
}

const CORE_INPUT_KEY_STATUS_TEXT_IDLE = 'IDLE'
const CORE_INPUT_KEY_STATUS_TEXT_HELD = 'HELD'
const CORE_INPUT_KEY_STATUS_TEXT_PRESSED = 'PRESSED'
const CORE_INPUT_KEY_STATUS_TEXT_RELEASED = 'RELEASED'

const CORE_DRAW_IMAGE_TYPE_IMAGE = 'IMAGE'
const CORE_DRAW_IMAGE_TYPE_STRIP = 'STRIP'

type CoreDrawImageType = typeof CORE_DRAW_IMAGE_TYPE_IMAGE | typeof CORE_DRAW_IMAGE_TYPE_STRIP
//#endregion

//#region Globals
const G_CORE_MATH_TWO_PI = 2 * Math.PI
const G_CORE_MATH_DEG_TO_RAD = Math.PI / 180
const G_CORE_MATH_RAD_TO_DEG = 180 / Math.PI

const G_CORE_INPUT_DEFAULT_MOVING_TIMEOUT = 100
const G_CORE_INPUT_MOUSE_AMOUNT = 10
const G_CORE_INPUT_TOUCH_AMOUNT = 20

const G_CORE_TIME_BASE_FPS = 60

const G_CORE_FONT_DEFAULT_FAMILY = 'Nunito Sans'

const G_CORE_GAME_OBJECT_ALARM_DEACTIVATE_NUMBER = -1

const G_DEBUG_INDEX_AMOUNT = 4
const G_DEBUG_KEYCODE = 'Semicolon'
//#endregion

//#region Core
interface Core {
    events: CoreEvents
    math: CoreMath
    common: CoreCommon
    domu: CoreDOM
    stage: CoreStage
    input: CoreInput
    time: CoreTime
    font: CoreFontManager
    draw: CoreDraw
    scene: CoreSceneManager
    obj: CoreObjectManager
    debug: CoreDebug
    runner: CoreRunner
    loader: CoreLoader
    init(canvas_parent: Element): Promise<void>
    start(starting_scene: CoreScene): void
}

declare const core: Core

core.init = async (canvas_parent) => {
    canvas_parent.appendChild(core.stage.canvas)
    return new Promise((resolve) => {
        setTimeout(() => {
            core.stage.resize_event()
            resolve()
        }, 500)
    })
}

core.start = (starting_scene) => {
    core.scene.change_scene(starting_scene)
    core.runner.run()
}
//#endregion

//#region Events
interface CoreEventsMap { }
type CoreEventsListener<K extends keyof CoreEventsMap> = (ev: CoreEventsMap[K] & { source: any }) => any
interface CoreEvents {
    ev: { [K in keyof (CoreEventsMap & ObjectOf<any>)]?: K extends keyof CoreEventsMap ? CoreEventsListener<K>[] : (CoreEventsListener<any>)[] }
    on<K extends keyof CoreEventsMap>(name: K, listener: CoreEventsListener<K>): CoreEventsListener<K>
    on(name: string, listener: CoreEventsListener<any>): CoreEventsListener<any>
    off<K extends keyof CoreEventsMap>(name: K, listener: CoreEventsListener<K>): void
    off(name: string, listener: CoreEventsListener<any>): void
    once<K extends keyof CoreEventsMap>(name: K, listener: CoreEventsListener<K>): CoreEventsListener<K>
    once(name: string, listener: CoreEventsListener<any>): CoreEventsListener<any>
    trigger<K extends keyof CoreEventsMap>(name: K, events: CoreEventsMap[K], source?: any): void
    trigger<K extends string>(name: K, events?: K extends keyof CoreEventsMap ? CoreEventsMap[K] : any, source?: any): void
}

core.events = {
    ev: {},
    on(name: string, listener: CoreEventsListener<any>) {
        this.ev[name] = this.ev[name] || []
        this.ev[name]!.push(listener)
        return listener
    },
    off(name: string, listener: CoreEventsListener<any>) {
        const new_listeners: CoreEventsListener<any>[] = []
        const ev = this.ev[name]
        if (ev) {
            for (let i = 0; i < ev.length; i++) {
                if (ev[i] !== listener) {
                    new_listeners.push(ev[i])
                }
            }
            this.ev[name] = new_listeners
        }
    },
    once(name: string, listener: CoreEventsListener<any>) {
        const fn = (ev: any) => {
            listener.call(this, ev)
            this.off(name, fn)
        }
        return this.on(name, fn)
    },
    trigger(name: string, events: any) {
        const ev = this.ev[name]
        if (ev) {
            for (let i = 0; i < ev.length; i++) {
                ev[i].call(this, events)
            }
        }
    },
}
//#endregion

//#region Vec2
class CoreVec2 {
    x: number
    y: number
    constructor(v?: CoreVec2)
    constructor(x?: number, y?: number)
    constructor(x: CoreVec2 | number = 0, y: number = 0) {
        if (x instanceof CoreVec2) {
            this.x = x.x
            this.y = x.y
        }
        else {
            this.x = x
            this.y = y
        }
        return this
    }
    clone(): CoreVec2 {
        return new CoreVec2(this.x, this.y)
    }
    set(v: CoreVec2): CoreVec2
    set(x: number, y: number): CoreVec2
    set(x: CoreVec2 | number, y?: number): CoreVec2 {
        if (x instanceof CoreVec2) {
            this.x = x.x
            this.y = x.y
        }
        else {
            this.x = x
            this.y = y!
        }
        return this
    }
    set_length(length: number): CoreVec2 {
        const angle_rad = this.get_angle()
        this.x = Math.cos(angle_rad) * length
        this.y = Math.sin(angle_rad) * length
        return this
    }
    get_length(): number {
        return Math.sqrt(this.x * this.x + this.y * this.y)
    }
    set_angle(angle_rad: number): CoreVec2 {
        const length = this.get_length()
        this.x = Math.cos(angle_rad) * length
        this.y = Math.sin(angle_rad) * length
        return this
    }
    get_angle(): number {
        return Math.atan2(this.y, this.x)
    }
    set_angle_deg(angle_deg: number): CoreVec2 {
        this.set_angle(angle_deg * G_CORE_MATH_DEG_TO_RAD)
        return this
    }
    get_angle_deg(): number {
        return this.get_angle() * G_CORE_MATH_RAD_TO_DEG
    }
    add(v: CoreVec2): CoreVec2
    add(x: number, y: number): CoreVec2
    add(x: CoreVec2 | number, y?: number): CoreVec2 {
        if (x instanceof CoreVec2) {
            this.x += x.x
            this.y += x.y
        }
        else {
            this.x += x
            this.y += y!
        }
        return this
    }
    subtract(v: CoreVec2): CoreVec2
    subtract(x: number, y: number): CoreVec2
    subtract(x: CoreVec2 | number, y?: number): CoreVec2 {
        if (x instanceof CoreVec2) {
            this.x -= x.x
            this.y -= x.y
        }
        else {
            this.x -= x
            this.y -= y!
        }
        return this
    }
    multiply(v: CoreVec2): CoreVec2
    multiply(x: number, y: number): CoreVec2
    multiply(x: CoreVec2 | number, y?: number): CoreVec2 {
        if (x instanceof CoreVec2) {
            this.x *= x.x
            this.y *= x.y
        }
        else {
            this.x *= x
            this.y *= y!
        }
        return this
    }
    divide(v: CoreVec2): CoreVec2
    divide(x: number, y: number): CoreVec2
    divide(x: CoreVec2 | number, y?: number): CoreVec2 {
        if (x instanceof CoreVec2) {
            this.x /= x.x
            this.y /= x.y
        }
        else {
            this.x /= x
            this.y /= y!
        }
        return this
    }
    to_text(): string {
        return `x: ${this.x}, y: ${this.y}`
    }
    static get one() {
        return new CoreVec2(1, 1)
    }
    static create(v: CoreVec2): CoreVec2
    static create(x: number, y: number): CoreVec2
    static create(x: CoreVec2 | number, y?: number): CoreVec2 {
        if (x instanceof CoreVec2) return new CoreVec2(x.x, x.y)
        else return new CoreVec2(x, y!)
    }
    static polar(length: number, angle_rad: number): CoreVec2 {
        const v = new CoreVec2()
        v.set_length(length)
        v.set_angle(angle_rad)
        return v
    }
    static polar_deg(length: number, angle_deg: number): CoreVec2 {
        const v = new CoreVec2()
        v.set_length(length)
        v.set_angle_deg(angle_deg)
        return v
    }
}
//#endregion

//#region Math
interface CoreMath {
    hypot(a: number, b: number): number
    degtorad(deg: number): number
    radtodeg(rad: number): number
    clamp(value: number, min: number, max: number): number
    range(min: number, max?: number, t?: number): number
    irange(min: number, max?: number): number
    randneg(t?: number): number
    distance(x1: number, y1: number, x2: number, y2: number): number
    seed: number
    seeded_random(): number
}

core.math = {
    hypot(a, b) {
        return Math.sqrt(a * a + b * b)
    },
    degtorad(deg) {
        return deg * G_CORE_MATH_DEG_TO_RAD
    },
    radtodeg(rad) {
        return rad * G_CORE_MATH_RAD_TO_DEG
    },
    clamp(value, min, max) {
        return Math.min(Math.max(value, Math.min(min, max)), Math.max(min, max))
    },
    range(min, max = 0, t = Math.random()) {
        return min + t * (max - min)
    },
    irange(min, max = 0) {
        return Math.floor(min + Math.random() * (max - min))
    },
    randneg(t = 0.5) {
        return Math.random() < t ? -1 : 1
    },
    distance(x1, y1, x2, y2) {
        return Math.hypot(x2 - x1, y2 - y1)
    },
    seed: 0,
    seeded_random() {
        // https://en.wikipedia.org/wiki/Linear_congruential_generator
        this.seed = (this.seed * 9301 + 49297) % 233280
        return this.seed / 233280
    },
}
//#endregion

//#region Common
interface CoreCommon {
    randbool(t?: number): boolean
    pick<T>(array: T[]): T
    randpop<T>(array: T[]): T
    shuffle(array: any[]): void
}

core.common = {
    randbool(t = 0.5) {
        return Math.random() < t
    },
    pick(array) {
        return array[core.math.irange(array.length)]
    },
    randpop(array) {
        return array.splice(core.math.irange(array.length), 1)[0]
    },
    shuffle(array) {
        for (let i = 0; i < array.length; i++) {
            let rand_index = core.math.irange(i + 1, array.length)
            if (rand_index >= array.length) {
                rand_index -= array.length
            }
            let temp = array[rand_index]
            array[rand_index] = array[i]
            array[i] = temp
        }
        return array
    },
}
//#endregion

//#region Dom
interface CoreDOM {
    q: ParentNode['querySelector']
    qa: ParentNode['querySelectorAll']
    hide(el: HTMLElement): void
    show(el: HTMLElement, display_value?: string): void
    is_hidden(el: HTMLElement): boolean
    has_class(el: Element, class_name: string): boolean
    add_class(el: Element, ...class_names: string[]): void
    remove_class(el: Element, ...class_names: string[]): void
    toggle_class(el: Element, class_name: string): void
}

/**
 * DOM Utils, short domu because dom already taken.
 */
core.domu = {
    q(s: string) {
        return document.querySelector(s)
    },
    qa(s: string) {
        return document.querySelectorAll(s)
    },
    hide(el) {
        el.style.display = 'none'
    },
    show(el, display_value = '') {
        el.style.display = display_value
    },
    is_hidden(el): boolean {
        return el.style.display === 'none'
    },
    has_class(el, class_name: string) {
        return el.classList.contains(class_name)
    },
    add_class(el, ...class_names: string[]) {
        for (const name of class_names) {
            if (!el.classList.contains(name)) el.classList.add(name)
        }
    },
    remove_class(el, ...class_names: string[]) {
        for (const name of class_names) {
            if (el.classList.contains(name)) el.classList.remove(name)
        }
    },
    toggle_class(el, class_name: string) {
        el.classList.toggle(class_name)
    },
}
//#endregion

//#region Stage
interface CoreStage {
    canvas: HTMLCanvasElement
    canvas_bounding_client_rect: DOMRect
    canvas_scale: number
    size: CoreVec2
    clear_canvas(): void
    resize_event(): void
}

let G_BASE_CANVAS_HEIGHT = 1080 // set this in base globals
core.stage = {
    canvas: document.createElement('canvas'), // dummy canvas
    canvas_bounding_client_rect: new DOMRect(0, 0, 0, 0),
    canvas_scale: 1,
    size: new CoreVec2(300, 150),
    clear_canvas() {
        this.canvas.getContext('2d')!.clearRect(0, 0, this.size.x, this.size.y)
    },
    resize_event() {
        this.canvas_bounding_client_rect = core.stage.canvas.getBoundingClientRect()
        this.canvas_scale = G_BASE_CANVAS_HEIGHT / this.canvas_bounding_client_rect.height
        this.canvas.width = this.canvas_bounding_client_rect.width * this.canvas_scale
        this.canvas.height = this.canvas_bounding_client_rect.height * this.canvas_scale
        this.size.set(this.canvas.width, this.canvas.height)
    }
}

window.addEventListener('resize', () => core.stage.resize_event())
//#endregion

//#region Input
interface CoreInput {
    is_touch_supported: boolean
    /**
     * Pointer position: mouse position or last touch position relative to `core.stage.canvas`
     */
    pointer_position: CoreVec2
    pointer_previous_position: CoreVec2
    mouse_position: CoreVec2
    is_moving: boolean
    is_mouse_moving: boolean
    is_moving_timeout_id: number
    is_mouse_moving_timeout_id: number
    mouses: CoreInputKey[]
    /**
     * Ongoing touches, indexed by `identifier`, note that `identifier` is incremental in iOS, so `ongoing_touches[0]` will not always be the first touch
     */
    ongoing_touches: CoreInputTouch[]
    first_ongoing_touch: CoreInputTouch | null
    process_position(x: number, y: number): CoreVec2
    update_position(new_position: CoreVec2): void
    update_mouse_position(new_position: CoreVec2): void
    mouse_up(button: number): boolean
    mouse_down(button: number): boolean
    mouse_hold(button: number): boolean
    pointer_up(): boolean
    pointer_down(): boolean
    pointer_hold(): boolean
    reset(): void
}

class CoreInputKey {
    id: string | number
    is_held: boolean = false
    is_pressed: boolean = false
    is_released: boolean = false
    constructor(id: CoreInputKey['id']) {
        this.id = id
    }
    up() {
        this.is_held = false
        this.is_released = true
    }
    down() {
        if (!this.is_held) {
            this.is_held = true
            this.is_pressed = true
        }
    }
    /**
     * Call every frame at the end to make sure `is_pressed` and `is_released` only true in one frame
     */
    reset() {
        this.is_pressed = false
        this.is_released = false
    }
    get_status_text() {
        if (this.is_released) return CORE_INPUT_KEY_STATUS_TEXT_RELEASED
        if (this.is_pressed) return CORE_INPUT_KEY_STATUS_TEXT_PRESSED
        if (this.is_held) return CORE_INPUT_KEY_STATUS_TEXT_HELD
        return CORE_INPUT_KEY_STATUS_TEXT_IDLE
    }
}

class CoreInputTouch extends CoreInputKey {
    position: CoreVec2 = new CoreVec2()
    previous_position: CoreVec2 = new CoreVec2()
    constructor(id: CoreInputTouch['id']) {
        super(id)
    }
    update_position(new_position: CoreVec2) {
        this.previous_position.set(this.position)
        this.position.set(new_position)
    }
}

core.input = {
    is_touch_supported: ('ontouchstart' in window) || window.navigator.maxTouchPoints ? true : false,
    pointer_position: new CoreVec2(),
    pointer_previous_position: new CoreVec2(),
    mouse_position: new CoreVec2(),
    is_moving: false,
    is_mouse_moving: false,
    is_moving_timeout_id: -1,
    is_mouse_moving_timeout_id: -1,
    mouses: [],
    ongoing_touches: [],
    first_ongoing_touch: null,
    process_position(x, y) {
        const b = core.stage.canvas_bounding_client_rect
        const s = core.stage.canvas_scale
        return new CoreVec2((x - b.x) * s, (y - b.y) * s)
    },
    update_position(p) {
        this.pointer_previous_position.set(this.pointer_position)
        this.pointer_position.set(p)
    },
    update_mouse_position(p) {
        this.mouse_position.set(p)
        this.update_position(this.mouse_position)
    },
    mouse_up(button) {
        return this.mouses[button].is_released
    },
    mouse_down(button) {
        return this.mouses[button].is_pressed
    },
    mouse_hold(button) {
        return this.mouses[button].is_held
    },
    pointer_up() {
        if (!this.first_ongoing_touch) return this.mouse_up(0)
        return this.first_ongoing_touch.is_released
    },
    pointer_down() {
        if (!this.first_ongoing_touch) return this.mouse_down(0)
        return this.first_ongoing_touch.is_pressed
    },
    pointer_hold() {
        if (!this.first_ongoing_touch) return this.mouse_hold(0)
        return this.first_ongoing_touch.is_held
    },
    reset() {
        this.mouses.forEach(m => m.reset())
        this.ongoing_touches.forEach(t => t.reset())
    },
}

// Create inputs
for (let i = 0; i < G_CORE_INPUT_MOUSE_AMOUNT; i++) {
    core.input.mouses.push(new CoreInputKey(i))
}

for (let i = 0; i < G_CORE_INPUT_TOUCH_AMOUNT; i++) {
    core.input.ongoing_touches.push(new CoreInputTouch(i))
}

// Setup events
window.addEventListener('mouseup', ev => {
    const id = ev.button % G_CORE_INPUT_MOUSE_AMOUNT
    core.input.mouses[id].up()
    core.input.update_mouse_position(core.input.process_position(ev.clientX, ev.clientY))
})

window.addEventListener('mousedown', ev => {
    const id = ev.button % G_CORE_INPUT_MOUSE_AMOUNT
    core.input.mouses[id].down()
    core.input.update_mouse_position(core.input.process_position(ev.clientX, ev.clientY))
})

window.addEventListener('mousemove', ev => {
    core.input.update_mouse_position(core.input.process_position(ev.clientX, ev.clientY))
    core.input.is_mouse_moving = true
    window.clearTimeout(core.input.is_mouse_moving_timeout_id)
    core.input.is_mouse_moving_timeout_id = window.setTimeout(
        () => core.input.is_mouse_moving = false,
        G_CORE_INPUT_DEFAULT_MOVING_TIMEOUT,
    )
})

window.addEventListener('touchstart', ev => {
    for (let i = 0; i < ev.changedTouches.length; i++) {
        const t = ev.changedTouches[i]
        const id = t.identifier % G_CORE_INPUT_TOUCH_AMOUNT
        core.input.ongoing_touches[id].down()
        core.input.ongoing_touches[id].update_position(core.input.process_position(t.clientX, t.clientY))
        const ft = core.input.first_ongoing_touch
        if (!ft || (!ft.is_held && !ft.is_released)) {
            core.input.first_ongoing_touch = core.input.ongoing_touches[id]
        }
    }
    if (core.input.first_ongoing_touch) core.input.update_position(core.input.first_ongoing_touch.position)
})

window.addEventListener('touchmove', ev => {
    for (let i = 0; i < ev.changedTouches.length; i++) {
        const t = ev.changedTouches[i]
        const id = t.identifier % G_CORE_INPUT_TOUCH_AMOUNT
        core.input.ongoing_touches[id].update_position(core.input.process_position(t.clientX, t.clientY))
    }
    if (core.input.first_ongoing_touch) core.input.update_position(core.input.first_ongoing_touch.position)
})

window.addEventListener('touchcancel', ev => {
    for (let i = 0; i < ev.changedTouches.length; i++) {
        const t = ev.changedTouches[i]
        const id = t.identifier % G_CORE_INPUT_TOUCH_AMOUNT
        core.input.ongoing_touches[id].up()
        core.input.ongoing_touches[id].update_position(core.input.process_position(t.clientX, t.clientY))
    }
    if (core.input.first_ongoing_touch) core.input.update_position(core.input.first_ongoing_touch.position)
})

window.addEventListener('touchend', ev => {
    for (let i = 0; i < ev.changedTouches.length; i++) {
        const t = ev.changedTouches[i]
        const id = t.identifier % G_CORE_INPUT_TOUCH_AMOUNT
        core.input.ongoing_touches[id].up()
        core.input.ongoing_touches[id].update_position(core.input.process_position(t.clientX, t.clientY))
    }
    if (core.input.first_ongoing_touch) core.input.update_position(core.input.first_ongoing_touch.position)
})
//#endregion

//#region Time
interface CoreTime {
    t: number
    dt: number
    cdt: number
    udt: number
    pt: number
    fps: number
    update(t: number): void
}

core.time = {
    t: 0,
    dt: 0,
    /**
     * Clamped delta time (0-1)
     */
    cdt: 0,
    /**
     * Unscaled delta time
     */
    udt: 0,
    /**
     * Previous time
     */
    pt: 0,
    fps: 0,
    update(t) {
        this.pt = this.t
        this.t = t
        this.udt = this.t - this.pt
        this.fps = 1000 / this.udt
        this.dt = this.udt / (1000 / G_CORE_TIME_BASE_FPS)
        this.cdt = Math.min(1, this.dt)
    },
}
//#endregion

//#region Font
interface CoreFontManager {
    xs: CoreFont
    s: CoreFont
    sm: CoreFont
    m: CoreFont
    l: CoreFont
    xl: CoreFont
    xxl: CoreFont
}

class CoreFont {
    size: number
    style: '' | 'bold' | 'italic' | 'bold italic'
    family: string
    constructor(size: number, style: CoreFont['style'], family: string) {
        this.size = size
        this.style = style
        this.family = family
    }
    bold() {
        return new CoreFont(this.size, 'bold', this.family)
    }
    italic() {
        return new CoreFont(this.size, 'italic', this.family)
    }
    bold_italic() {
        return new CoreFont(this.size, 'bold italic', this.family)
    }
    set_family(new_family: string) {
        this.family = new_family
        return this
    }
    reset_family() {
        this.family = G_CORE_FONT_DEFAULT_FAMILY
    }
}

core.font = {
    xs: new CoreFont(12, '', G_CORE_FONT_DEFAULT_FAMILY),
    s: new CoreFont(18, '', G_CORE_FONT_DEFAULT_FAMILY),
    sm: new CoreFont(24, '', G_CORE_FONT_DEFAULT_FAMILY),
    m: new CoreFont(36, '', G_CORE_FONT_DEFAULT_FAMILY),
    l: new CoreFont(48, '', G_CORE_FONT_DEFAULT_FAMILY),
    xl: new CoreFont(64, '', G_CORE_FONT_DEFAULT_FAMILY),
    xxl: new CoreFont(96, '', G_CORE_FONT_DEFAULT_FAMILY),
}
//#endregion

//#region Draw
interface CoreDrawImage {
    origin: CoreVec2
    image: HTMLImageElement
}

interface CoreDrawStrip {
    origin: CoreVec2
    image: HTMLImageElement
    image_number: number
    image_per_row: number
    image_width: number
    image_height: number
}

interface CoreDraw {
    ctx: CanvasRenderingContext2D
    text_height: number
    images: { [name: string]: CoreDrawImage }
    strips: { [name: string]: CoreDrawStrip }
    set_color(fill: string, stroke?: string): void
    set_font(font: CoreFont, overrides?: {
        size?: CoreFont['size']
        style?: CoreFont['style']
        family?: CoreFont['family']
    }): void
    set_halign(align: CanvasTextAlign): void
    set_valign(align: CanvasTextBaseline): void
    set_hvalign(halign: CanvasTextAlign, valign: CanvasTextBaseline): void
    split_text(text: string): string[]
    text(x: number, y: number, text: string): void
    get_text_width(text: string): number
    get_text_height(text: string): number
    add_image(origin: CoreVec2, name: string, image: HTMLImageElement): HTMLImageElement
    add_strip(origin: CoreVec2, name: string, image: HTMLImageElement, image_number: number, image_per_row?: number): HTMLImageElement
    set_alpha(a: number): void
    reset_alpha(): void
    /**
     * Draw image element
     */
    image_el(image: HTMLImageElement, x: number, y: number, origin?: CoreVec2): void
    /**
     * Draw image from storage
     */
    image(name: string, x: number, y: number): void
    strip(name: string, image_index: number, x: number, y: number): void
    draw(is_stroke?: boolean): void
    line(x1: number, y1: number, x2: number, y2: number): void
    rect(x: number, y: number, w: number, h: number, is_stroke?: boolean): void
    circle(x: number, y: number, r: number, is_stroke?: boolean): void
    on_transform(x: number, y: number, xscale: number, yscale: number, angle_deg: number, draw_fn: Function): void
    image_transformed(name: string, x: number, y: number, xscale: number, yscale: number, angle_deg: number): void
    image_rotated(name: string, x: number, y: number, angle_deg: number): void
    image_ext(name: string, x: number, y: number, xscale: number, yscale: number, angle_deg: number, alpha: number): void // to add: blend mode
    strip_transformed(name: string, image_index: number, x: number, y: number, xscale: number, yscale: number, angle_deg: number): void
    strip_rotated(name: string, image_index: number, x: number, y: number, angle_deg: number): void
    strip_ext(name: string, image_index: number, x: number, y: number, xscale: number, yscale: number, angle_deg: number, alpha: number): void
}

core.draw = {
    ctx: core.stage.canvas.getContext('2d')!,
    text_height: 10,
    images: {},
    strips: {},
    set_color(fill, stroke) {
        this.ctx.fillStyle = fill
        this.ctx.strokeStyle = stroke || fill
    },
    set_font(font, overrides = {}) {
        const style = (typeof overrides.style === 'undefined' ? font.style : overrides.style)
        this.ctx.font = `${style}${style ? ' ' : ''}${overrides.size || font.size}px ${overrides.family || font.family}, serif`
        this.text_height = overrides.size || font.size
    },
    set_halign(align) {
        this.ctx.textAlign = align
    },
    set_valign(align) {
        this.ctx.textBaseline = align
    },
    set_hvalign(halign, valign) {
        this.ctx.textAlign = halign
        this.ctx.textBaseline = valign
    },
    split_text(text) {
        return ('' + text).split('\n')
    },
    text(x, y, text) {
        let baseline = 0
        const t = this.split_text(text)
        switch (this.ctx.textBaseline) {
            case 'bottom':
                baseline = -this.text_height * (t.length - 1)
                break
            case 'middle':
                baseline = -this.text_height * (t.length - 1) * 0.5
                break
        }
        for (let i = t.length - 1; i >= 0; --i) {
            this.ctx.fillText(t[i], x, y + baseline + this.text_height * i)
        }
    },
    get_text_width(text) {
        return Math.max(...this.split_text(text).map(x => this.ctx.measureText(x).width))
    },
    get_text_height(text) {
        return this.text_height * this.split_text(text).length
    },
    add_image(origin, name, image) {
        this.images[name] = {
            origin,
            image,
        }
        return this.images[name].image
    },
    add_strip(origin, name, image, image_number, image_per_row) {
        image_per_row = image_per_row || image_number
        const image_width = image.width / image_per_row
        const image_height = image.height / (image_number / image_per_row)
        this.strips[name] = {
            origin,
            image,
            image_number,
            image_per_row,
            image_width,
            image_height,
        }
        return this.strips[name].image
    },
    set_alpha(a) {
        this.ctx.globalAlpha = a
    },
    reset_alpha() {
        this.ctx.globalAlpha = 1
    },
    image_el(img, x, y, origin = new CoreVec2(0.5, 0.5)) {
        x -= img.width * origin.x
        y -= img.height * origin.y
        this.ctx.drawImage(img, x, y)
    },
    image(name, x, y) {
        const img = this.images[name]
        this.image_el(img.image, x, y, img.origin)
    },
    strip(name, image_index, x, y) {
        const img = this.strips[name]
        image_index = image_index % img.image_number
        x -= img.image_width * img.origin.x
        y -= img.image_height * img.origin.y
        this.ctx.drawImage(
            img.image,
            (image_index % img.image_per_row) * img.image_width,
            Math.floor(image_index / img.image_per_row) * img.image_height,
            img.image_width, img.image_height, x, y, img.image_width, img.image_height
        )
    },
    draw(is_stroke = false) {
        is_stroke ? this.ctx.stroke() : this.ctx.fill()
    },
    line(x1, y1, x2, y2) {
        this.ctx.beginPath()
        this.ctx.moveTo(x1, y1)
        this.ctx.lineTo(x2, y2)
        this.ctx.stroke()
    },
    rect(x, y, w, h, is_stroke = false) {
        this.ctx.beginPath()
        this.ctx.rect(x, y, w, h)
        this.draw(is_stroke)
    },
    circle(x, y, r, is_stroke = false) {
        this.ctx.beginPath()
        this.ctx.arc(x, y, r, 0, G_CORE_MATH_TWO_PI)
        this.draw(is_stroke)
    },
    on_transform(x, y, xscale, yscale, angle_deg, draw_fn) {
        this.ctx.save()
        this.ctx.translate(x, y)
        this.ctx.rotate(angle_deg * G_CORE_MATH_DEG_TO_RAD)
        this.ctx.scale(xscale, yscale)
        draw_fn()
        this.ctx.restore()
    },
    image_transformed(name, x, y, xscale, yscale, angle_deg) {
        this.on_transform(x, y, xscale, yscale, angle_deg, () => this.image(name, 0, 0))
    },
    image_rotated(name, x, y, angle_deg) {
        this.image_transformed(name, x, y, 1, 1, angle_deg)
    },
    image_ext(name, x, y, xscale, yscale, angle_deg, alpha) {
        this.set_alpha(alpha)
        this.image_transformed(name, x, y, xscale, yscale, angle_deg)
        this.reset_alpha()
    },
    strip_transformed(name, image_index, x, y, xscale, yscale, angle_deg) {
        this.on_transform(x, y, xscale, yscale, angle_deg, () => this.strip(name, image_index, 0, 0))
    },
    strip_rotated(name, image_index, x, y, angle_deg) {
        this.strip_transformed(name, image_index, x, y, 1, 1, angle_deg)
    },
    strip_ext(name, image_index, x, y, xscale, yscale, angle_deg, alpha) {
        this.set_alpha(alpha)
        this.strip_transformed(name, image_index, x, y, xscale, yscale, angle_deg)
        this.reset_alpha()
    },
}
//#endregion

//#region Scene
interface CoreSceneManager {
    current_scene: CoreScene
    previous_scene: CoreScene | null
    change_scene(new_scene: CoreScene): void
    restart(): void
    update(): void
    render(): void
    render_ui(): void
}

interface CoreSceneEventMap {
    'core_scene_change_scene': {
        current_scene: CoreScene
        previous_scene: CoreScene
    }
}

interface CoreEventsMap extends CoreSceneEventMap { }

class CoreScene<T = {}> {
    is_auto_clear_stage: boolean = true
    /**
     * Destroy all obj instance except persistent object on scene change, set this to `false` will make all instances in the given scene persistent
     */
    is_auto_destroy_obj: boolean = true
    is_obj_update_disabled: boolean = false
    is_obj_render_disabled: boolean = false
    name: string
    props: T = {} as any
    constructor(name: string, props?: T) {
        this.name = name
        if (props) this.props = props
    }
    start() { }
    update() { }
    render() { }
    render_ui() { }
}

core.scene = {
    current_scene: new CoreScene('Dummy'),
    previous_scene: null,
    change_scene(new_scene) {
        if (this.current_scene.is_auto_destroy_obj) {
            core.obj.clear_all()
        }
        this.previous_scene = this.current_scene
        this.current_scene = new_scene
        if (this.current_scene !== this.previous_scene) {
            this.restart()
        }
        core.events.trigger('core_scene_change_scene', {
            current_scene: this.current_scene,
            previous_scene: this.previous_scene,
        })
    },
    restart() {
        this.current_scene.start()
    },
    update() {
        this.current_scene.update()
    },
    render() {
        this.current_scene.render()
    },
    render_ui() {
        this.current_scene.render_ui()
    },
}
//#endregion

//#region Obj
interface CoreObjectManager {
    _ID: number
    names: string[]
    instances: CoreObject[][]
    add_name(name: string): number
    get_index(name: string): number
    update_all(): void
    render_all(): void
    render_ui_all(): void
    /**
     * Push instance, give it unique id, and call `start`
     */
    instantiate<T = CoreObject>(name: string, instance: T): T
    take<T = CoreObject>(...names: string[]): T[]
    get<T = CoreObject>(id: number): T | null
    remove(id: number): CoreObject | null
    clear(name: string): void
    clear_all(): void
    nearest<T = CoreObject>(name: string, x: number, y: number): T | null
}

class CoreObject {
    x: number
    y: number
    id: number = 0
    depth: number = 0
    is_active: boolean = true
    is_visible: boolean = true
    constructor(x: number = 0, y: number = 0) {
        this.x = x
        this.y = y
    }
    start() { }
    pre_update() { }
    update() { }
    post_update() { }
    inactive_update() { }
    render() { }
    render_ui() { }
}

class CoreGameObjectAlarm {
    tick_ms: number
    interval_ms: number
    callbacks: Function[] = []
    trigger_count: number = 0
    constructor(interval_ms: number, is_auto_start: boolean = true) {
        this.tick_ms = G_CORE_GAME_OBJECT_ALARM_DEACTIVATE_NUMBER
        this.interval_ms = interval_ms
        if (is_auto_start) this.restart()
    }
    on_alarm(callback: Function) {
        this.callbacks.push(callback)
    }
    /**
     * Call at callback to reset alarm
     */
    restart(interval_ms: number = this.interval_ms) {
        this.tick_ms = interval_ms
    }
    trigger() {
        for (let i = 0; i < this.callbacks.length; i++) {
            this.callbacks[i].call(this)
        }
        this.trigger_count++
    }
    update() {
        if (this.tick_ms === G_CORE_GAME_OBJECT_ALARM_DEACTIVATE_NUMBER) return
        if (this.tick_ms < 0) {
            this.tick_ms = G_CORE_GAME_OBJECT_ALARM_DEACTIVATE_NUMBER
            this.trigger()
        }
        else {
            this.tick_ms -= core.time.udt
        }
    }
}

class CoreGameObjectMaskRect {
    constructor(
        public mask_parent: CoreGameObjectMask,
        public offset: CoreVec2,
        public size: CoreVec2,
    ) { }
    contains_point(p: CoreVec2) {
        const rect = this.mask_parent.parent.position.clone().add(this.offset)
        return p.x > rect.x && p.x < rect.x + this.size.x
            && p.y > rect.y && p.y < rect.y + this.size.y
    }
}

class CoreGameObjectMaskCircle {
    constructor(
        public mask_parent: CoreGameObjectMask,
        public offset: CoreVec2,
        public r: number,
    ) { }
    contains_point(p: CoreVec2) {
        const pp = this.mask_parent.parent.position.clone().add(this.offset)
        return core.math.distance(p.x, p.y, pp.x, pp.y) < this.r
    }
}

class CoreGameObjectMask {
    constructor(
        public parent: CoreGameObject,
        public children: (CoreGameObjectMaskRect | CoreGameObjectMaskCircle)[] = [],
    ) { }
    contains_point(p: CoreVec2): boolean {
        for (const m of this.children) {
            if (m.contains_point(p)) return true
        }
        return false
    }
}

class CoreGameObject extends CoreObject {
    position: CoreVec2
    /**
     * Recorded position at the start of pre update before calling `before_update`
     */
    previous_position: CoreVec2
    scale: CoreVec2
    alarms: { [name: string]: CoreGameObjectAlarm } = {}
    image_name: string = ''
    image_index: number = 0
    image_speed: number = 1
    float_image_index: number = 0
    image_angle_deg: number = 0
    image_alpha: number = 1
    mask: CoreGameObjectMask = new CoreGameObjectMask(this)
    constructor(position: CoreVec2, scale: CoreVec2 = CoreVec2.one) {
        super(position.x, position.y)
        this.position = position
        this.previous_position = new CoreVec2(this.position)
        this.scale = scale
    }
    create_alarm(name: string, interval_ms: number, callback: Function) {
        this.alarms[name] = new CoreGameObjectAlarm(interval_ms)
        this.alarms[name].on_alarm(callback)
        return this.alarms[name]
    }
    restart_alarm(name: string, interval_ms?: number) {
        this.alarms[name].restart(interval_ms)
    }
    before_update() { }
    after_update() { }
    alarm_update() {
        for (const name in this.alarms) {
            this.alarms[name].update()
        }
    }
    physics_update(dt: number) { }
    pre_update() {
        this.previous_position.set(this.position)
        this.alarm_update()
        this.before_update()
        this.physics_update(core.time.dt)
    }
    post_update() {
        this.x = this.position.x
        this.y = this.position.y
        this.pre_render()
        this.after_update()
    }
    set_image_angle(angle_deg: number) {
        this.image_angle_deg = angle_deg
    }
    set_image_angle_rad(angle_rad: number) {
        this.image_angle_deg = angle_rad * G_CORE_MATH_RAD_TO_DEG
    }
    /**
     * Returns true if current position plus given margin is outside of the stage
     */
    is_outside_stage(xmargin: number = 0, ymargin: number = xmargin): boolean {
        return this.position.x + xmargin < 0
            || this.position.x - xmargin > core.stage.size.x
            || this.position.y + ymargin < 0
            || this.position.y - ymargin > core.stage.size.y
    }
    get_image_type(): CoreDrawImageType | null {
        if (core.draw.images[this.image_name]) return CORE_DRAW_IMAGE_TYPE_IMAGE
        if (core.draw.strips[this.image_name]) return CORE_DRAW_IMAGE_TYPE_STRIP
        return null
    }
    pre_render() {
        if (this.get_image_type() === CORE_DRAW_IMAGE_TYPE_STRIP) {
            this.float_image_index += core.time.dt * this.image_speed
            this.image_index = Math.round(this.float_image_index) % (core.draw.strips[this.image_name]?.image_number || 0)
        }
    }
    render() {
        this.draw_self()
    }
    draw_self() {
        if (this.get_image_type() === CORE_DRAW_IMAGE_TYPE_IMAGE) {
            core.draw.image_ext(
                this.image_name,
                this.position.x,
                this.position.y,
                this.scale.x,
                this.scale.y,
                this.image_angle_deg,
                this.image_alpha,
            )
        }
        else if (this.get_image_type() === CORE_DRAW_IMAGE_TYPE_STRIP) {
            core.draw.strip_ext(
                this.image_name,
                this.image_index,
                this.position.x,
                this.position.y,
                this.scale.x,
                this.scale.y,
                this.image_angle_deg,
                this.image_alpha,
            )
        }
    }
}

core.obj = {
    _ID: 0,
    names: [],
    instances: [],
    add_name(name) {
        this.instances.push([])
        return this.names.push(name) - 1
    },
    get_index(name) {
        return this.names.indexOf(name)
    },
    update_all() {
        for (let i = this.instances.length - 1; i >= 0; i--) {
            for (let j = this.instances[i].length - 1; j >= 0; j--) {
                if (this.instances[i][j].is_active) {
                    this.instances[i][j].pre_update()
                    // Check if instance is not removed
                    if (this.instances[i][j]) this.instances[i][j].update()
                    if (this.instances[i][j]) this.instances[i][j].post_update()
                }
                else {
                    this.instances[i][j].inactive_update()
                }
            }
        }
    },
    render_all() {
        const h: CoreObject[] = []
        for (let i = this.instances.length - 1; i >= 0; i--) {
            for (let j = this.instances[i].length - 1; j >= 0; j--) {
                if (this.instances[i][j].is_visible) {
                    h.push(this.instances[i][j])
                }
            }
        }
        h.sort((a, b) => a.depth - b.depth)
        for (let i = h.length - 1; i >= 0; i--) {
            h[i].render()
        }
    },
    render_ui_all() {
        const h: CoreObject[] = []
        for (let i = this.instances.length - 1; i >= 0; i--) {
            for (let j = this.instances[i].length - 1; j >= 0; j--) {
                if (this.instances[i][j].is_visible) {
                    h.push(this.instances[i][j])
                }
            }
        }
        h.sort((a, b) => a.depth - b.depth)
        for (let i = h.length - 1; i >= 0; i--) {
            h[i].render_ui()
        }
    },
    instantiate(name, n) {
        this.instances[this.get_index(name)].push((n as CoreObject));
        (n as CoreObject).id = this._ID++
        (n as CoreObject).start()
        return n
    },
    take(...names) {
        let h: any[] = []
        for (const name of names) {
            h = h.concat(this.instances[this.get_index(name)])
        }
        return h
    },
    get(id) {
        for (let i = this.instances.length - 1; i >= 0; i--) {
            for (let j = this.instances[i].length - 1; j >= 0; j--) {
                if (this.instances[i][j].id === id) {
                    return this.instances[i][j] as any
                }
            }
        }
        return null
    },
    remove(id) {
        for (let i = this.instances.length - 1; i >= 0; i--) {
            for (let j = this.instances[i].length - 1; j >= 0; j--) {
                if (this.instances[i][j].id === id) {
                    return this.instances[i].splice(j, 1)[0]
                }
            }
        }
        return null
    },
    clear(name) {
        this.instances[this.get_index(name)].length = 0
    },
    clear_all() {
        for (let i = this.instances.length - 1; i >= 0; i--) {
            this.instances[i].length = 0
        }
    },
    nearest(name, x, y) {
        let l = -1
        let m = null
        for (const n of this.instances[this.get_index(name)]) {
            const o = Math.hypot(n.x - x, n.y - y)
            if (l < 0 || o < l) {
                m = n
                l = o
            }
        }
        return m as any
    },
}
//#endregion

//#region Debug
interface CoreDebug {
    debug_index: number
    odd(): boolean
    draw_fps(x: number, y: number): void
}

core.debug = {
    debug_index: 0,
    odd() {
        return this.debug_index % 2 !== 0
    },
    draw_fps(x, y) {
        const t = `${Math.round(core.time.fps)}`

        core.draw.set_font(core.font.s)
        const tw = core.draw.get_text_width(t)
        const th = core.draw.get_text_height(t)

        core.draw.set_alpha(0.5)

        core.draw.set_color('#000')
        core.draw.rect(0, 0, tw, th)

        core.draw.set_hvalign('left', 'top')
        core.draw.set_color('#fff')
        core.draw.text(x, y, t)

        core.draw.reset_alpha()
    },
}

window.addEventListener('keydown', ev => {
    if (ev.ctrlKey && ev.shiftKey && ev.code === G_DEBUG_KEYCODE) {
        core.debug.debug_index = ++core.debug.debug_index % G_DEBUG_INDEX_AMOUNT
    }
})
//#endregion

//#region Runner
interface CoreRunner {
    is_running: boolean
    step(t?: number): void
    run(): void
    stop(): void
}

core.runner = {
    is_running: false,
    step(t = 0) {
        core.time.update(t)
        core.scene.update()
        if (!core.scene.current_scene.is_obj_update_disabled) {
            core.obj.update_all()
        }
        if (core.scene.current_scene.is_auto_clear_stage) {
            core.stage.clear_canvas()
        }
        core.scene.render()
        if (!core.scene.current_scene.is_obj_render_disabled) {
            core.obj.render_all()
            core.obj.render_ui_all()
        }
        core.scene.render_ui()
        core.input.reset()
    },
    run() {
        const callback = (t: number) => {
            this.step(t)
            if (this.is_running) {
                window.requestAnimationFrame(callback)
            }
        }
        this.is_running = true
        window.requestAnimationFrame(callback)
    },
    stop() {
        this.is_running = false
    },
}
//#endregion

//#region Loader
interface CoreLoader {
    _is_loaded: boolean
    load_amount: number
    loaded_count: number
    get_is_loaded(): boolean
    get_load_progress(): number
    set_image_load_event(img: HTMLImageElement, callback: Function): void
    load_image(origin: CoreVec2, name: string, src: string): void
    load_strip(origin: CoreVec2, name: string, src: string, image_number: number, image_per_row?: number): void
}

core.loader = {
    _is_loaded: false,
    load_amount: 0,
    loaded_count: 0,
    get_is_loaded() {
        return this._is_loaded ? true : this.loaded_count === this.load_amount
    },
    get_load_progress() {
        return this.load_amount < 1 ? 1 : this.loaded_count / this.load_amount
    },
    set_image_load_event(img, callback) {
        this.load_amount++
        img.addEventListener('load', () => {
            callback.call(this)
            this.loaded_count++
            if (this.loaded_count >= this.load_amount) {
                this._is_loaded = true
            }
        })
    },
    load_image(origin, name, src) {
        const img = new Image()
        img.src = src
        this.set_image_load_event(img, () => {
            core.draw.add_image(origin, name, img)
        })
    },
    load_strip(origin, name, src, image_number, image_per_row = 0) {
        image_per_row = image_per_row || image_number
        const img = new Image()
        img.src = src
        this.set_image_load_event(img, () => {
            core.draw.add_strip(origin, name, img, image_number, image_per_row)
        })
    },
}
//#endregion
