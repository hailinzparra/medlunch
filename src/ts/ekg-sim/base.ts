//#region Alias
const {
    events,
    math,
    common,
    domc,
    stage,
    input,
    time,
    font,
    draw,
    scene,
    obj,
    debug,
    runner,
    loader,
} = core
//#endregion

//#region Globals
G_BASE_CANVAS_HEIGHT = 1080
const G_BASE_ELECTRICAL_LINE_WIDTH = 10
const G_BASE_COLOR = {
    theme: '#198754',
    blueprint: '#350A84',
    electric: '#f4c621',
}
//#endregion

//#region Objects
class GhostElectricalPathway extends CoreObject {
    angle_deg: number = 0
    length: number = 0
    travel_time_ms: number = 250
    constructor(x: number, y: number) {
        super(x, y)
    }
    update(): void {
        const vdif = new CoreVec2(input.pointer_position.x - this.x, input.pointer_position.y - this.y)
        this.length = vdif.get_length()
        this.angle_deg = vdif.get_angle_deg()
    }
    render(): void {
        const p = CoreVec2.polar_deg(this.length, this.angle_deg)

        draw.ctx.lineWidth = G_BASE_ELECTRICAL_LINE_WIDTH
        draw.set_color('fff')
        draw.line(this.x, this.y, this.x + p.x, this.y + p.y)
    }
}

class ElectricalPathway extends CoreObject {
    angle_deg: number
    length: number
    travel_time_ms: number
    traveled_time_ms: number = 0
    constructor(x: number, y: number, angle_deg: number, length: number, travel_time_ms: number) {
        super(x, y)
        this.angle_deg = angle_deg
        this.length = length
        this.travel_time_ms = travel_time_ms
    }
    update(): void {
        if (this.traveled_time_ms >= this.travel_time_ms) {
            obj.remove(this.id)
        }
        else {
            this.traveled_time_ms += time.udt
        }
    }
    render(): void {
        const t = math.clamp(this.traveled_time_ms / this.travel_time_ms, 0, 1)
        const p = CoreVec2.polar_deg(this.length * t, this.angle_deg)

        draw.ctx.lineWidth = G_BASE_ELECTRICAL_LINE_WIDTH
        draw.set_color(G_BASE_COLOR.electric)
        draw.line(this.x, this.y, this.x + p.x, this.y + p.y)
    }
}

obj.add_name('ghostelectricalpathway')
obj.add_name('electricalpathway')
//#endregion

//#region Scenes
//#region Login
interface SceneLoginProps {
    login_button: HTMLDivElement
    view_all_button: HTMLDivElement
}

const scene_login = new CoreScene<SceneLoginProps>('Login', {
    login_button: domc.q('.login-button')!,
    view_all_button: domc.q('.view-all-button')!,
})

scene_login.props.login_button.onclick = () => {
    scene.change_scene(scene_loading)
}

scene_login.props.view_all_button.onclick = () => {
    window.location.href = '/'
}
//#endregion

//#region Loading
interface SceneLoadingProps {
    load_progress: number
}

const scene_loading = new CoreScene<SceneLoadingProps>('Loading', {
    load_progress: 0,
})

scene_loading.start = () => {
    scene_loading.props.load_progress = 0
}

scene_loading.render_ui = () => {
    scene_loading.props.load_progress += (loader.get_load_progress() - scene_loading.props.load_progress) * 0.18

    const progress_percent = Math.round(scene_loading.props.load_progress * 100)
    const loading_amount_text = `${loader.loaded_count}/${loader.load_amount}`

    draw.set_font(font.sm)
    const bar_h = draw.get_text_height(loading_amount_text) * 1.75

    draw.set_color('#fff')
    draw.rect(0, 0, stage.size.x, stage.size.y)

    draw.set_color('#fff')
    draw.rect(0, stage.size.y - bar_h, stage.size.x, bar_h)
    draw.set_color(G_BASE_COLOR.theme)
    draw.rect(0, stage.size.y - bar_h, scene_loading.props.load_progress * stage.size.x, bar_h)

    draw.set_hvalign('center', 'middle')

    if (loader.load_amount > 0) {
        draw.set_color('#fff')
        draw.text(scene_loading.props.load_progress * stage.size.x / 2, stage.size.y - bar_h * 0.475, loading_amount_text)
    }

    const loading_progress_text = `LOADING ${progress_percent}%`

    draw.set_font(font.m.bold())
    draw.set_color(G_BASE_COLOR.theme)

    draw.text(stage.size.x / 2, stage.size.y / 2, loading_progress_text)

    if (loader.get_is_loaded() && progress_percent >= 100) {
        scene.change_scene(scene_playground)
    }
}
//#endregion

//#region Playground
interface ScenePlaygroundProps {
    is_placing_ghost: boolean
}

const scene_playground = new CoreScene<ScenePlaygroundProps>('Playground', {
    is_placing_ghost: false,
})

scene_playground.start = () => {
}

scene_playground.update = () => {
    const p = scene_playground.props
    if (input.pointer_down()) {
        const ghosts = obj.take<ElectricalPathway>('ghostelectricalpathway')
        if (p.is_placing_ghost && ghosts.length > 0) {
            const ghost = ghosts[0]
            obj.instantiate<ElectricalPathway>('electricalpathway', new ElectricalPathway(
                ghost.x, ghost.y, ghost.angle_deg, ghost.length, ghost.travel_time_ms
            ))
            obj.clear('ghostelectricalpathway')
        }
        else {
            obj.instantiate<GhostElectricalPathway>('ghostelectricalpathway', new GhostElectricalPathway(
                input.pointer_position.x,
                input.pointer_position.y,
            ))
            p.is_placing_ghost = true
        }
    }
}

scene_playground.render = () => {
}

scene_playground.render_ui = () => {
    draw.on_transform(0, 0, 1, 1, 0, () => {
        debug.draw_fps(0, 0)
        debug.draw_text(0, font.s.size, `${core.time.udt.toFixed(2)}`)
        debug.draw_text(0, font.s.size * 2, `${core.time.dt.toFixed(2)}`)
        debug.draw_text(0, font.s.size * 4, `(${window.innerWidth}, ${window.innerHeight}) → (${stage.size.x}, ${stage.size.y})
(${stage.canvas.width}, ${stage.canvas.height})
${JSON.stringify(stage.canvas_bounding_client_rect).replaceAll(',', '\n')}`)
        debug.draw_text(0, stage.size.y - font.s.size * 1, `im the lowest`)
    })
}
//#endregion

const main_stage = {
    get_list() {
        return domc.qa('.main-stage')
    },
    unhide(el: Element) {
        domc.remove_class(el, 'hidden')
    },
    hide_all() {
        this.get_list().forEach(el => domc.add_class(el, 'hidden'))
    },
    change(el: Element) {
        this.hide_all()
        this.unhide(el)
    }
}

events.on('core_scene_change_scene', ev => {
    switch (ev.current_scene) {
        case scene_login:
            main_stage.change(domc.q('.main-stage#stage-login')!)
            break
        case scene_loading:
            main_stage.change(stage.canvas)
            break
        case scene_playground:
            main_stage.change(stage.canvas)
            break
        default:
            break
    }
})
//#endregion

//#region Load
//#endregion

//#region Entrypoint
document.addEventListener('DOMContentLoaded', async () => {
    stage.canvas.style.backgroundColor = G_BASE_COLOR.blueprint
    window.addEventListener('contextmenu', ev => ev.preventDefault())
    domc.add_class(core.stage.canvas, 'main-stage')
    core.events.on('core_stage_before_resize', () => {
        const wrapper = domc.q<HTMLDivElement>('.main-wrapper')!
        wrapper.style.height = `${window.innerHeight}px`
        wrapper.style.width = `${Math.min(window.innerWidth, window.innerHeight * 0.8)}px`
    })
    await core.init(domc.q('.main-container')!)
    core.start(scene_login)
    // core.start(scene_playground)
})
//#endregion
