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

const G_BASE_ELECTRODE_SIZE = 30
const G_BASE_ELECTRODE_HOVER_RANGE = 48

const G_BASE_COLOR = {
    BG: '#fff',//'#350A84',
    THEME: '#198754',
    GRID_LINES: '#555',
    ELECTRIC: '#f4c621',
    ELECTRODE: '#178dc4',
}

enum G_BASE_OBJ {
    // ui
    UI_SELECT_OVERLAY_MODE = 0,
    UI_SELECT_BUILD_MODE,
    UI_SELECT_BUILD_COMPONENT,
    UI_SELECT_TEMPLATE,
    UI_HOVER_CONTEXT,
    UI_HOVER_PROPERTIES,
    // components
    ELECTRODE,
    LEAD,
    CELLS,
    PACEMAKER,
    BATTERY,
    // activities
    DIPOLE,
    // graph
    GRAPH_PAPER,
}
Object.values(G_BASE_OBJ).map(n => { if (typeof n === 'number') obj.add_name(n) })

enum G_BASE_MODE {
    TESTING = 0,
    PLAYBACK,
    BUILDING_ELECTRODE,
    BUILDING_LEAD,
    BUILDING_CELLS,
    BUILDING_PACEMAKER,
}
//#endregion

//#region Objects
/**
 * An electrical meter used to record an angle, that records electrical activity with two electrodes.
 * - Shows the potential on the positive electrode compared to the negative (potential diff across).
 * - Records only projections of currents that fall in the direction of the electrode placements.
 * - Our body is a good conductor of electricity.
 * Frontal/Coronal Plane
 * 3 Standard bipolar limb leads (Einthoven's triangle)
 * - Lead I: 0, Reference 0 angle
 * - Lead II: +60
 * - Lead III: +120
 * Electrodes: RA, LA, LF -> placing on arms equal to shoulder, leg = groin
 * Augmented unipolar limb leads
 * - aVR: -150 (a = augmented, V = unipolar, R = right arm)
 * - aVL: -30
 * - aVF: +90
 * Common reference point/CENTROID = a point INSIDE, not both outside like bipolar limb, so this is unipolar
 * 
 * Transverse Plane
 * Precordial leads
 * V1-V6
 * 
 * Lead III, aVF, Lead II = inferior wall, RCA
 * I, aVL, V5, V6 = lateral wall, LCA
 * V1, V2 = intraventricular septum, left anterior descending artery
 * V3, V4 = anterior wall, left anterior descending artery
 * 
 * A disease affecting a particular region, produces more prominent changes in their respective leads
 * 
 * How ECG waves are produced during CARDIAC CYCLE
 * 
 * in any region, some ventricular fibers start repol earlier, some delayed
 */

class Electrode extends CoreGameObject {
    size: number = G_BASE_ELECTRODE_SIZE
    color: string = G_BASE_COLOR.ELECTRODE

    charge: number = 0

    constructor(position: CoreVec2) {
        super(position)
    }

    render(): void {
        draw.set_color(this.color)
        draw.set_alpha(0.2)
        draw.circle(this.position.x, this.position.y, G_BASE_ELECTRODE_HOVER_RANGE + Math.sin(time.t * 0.005))
        draw.set_alpha(1)
        draw.circle(this.position.x, this.position.y, this.size)

        draw.set_font(font.sm)
        draw.set_color('black')
        draw.set_hvalign('center', 'middle')
        draw.text(this.position.x, this.position.y, `${this.charge < 0 ? '-' : '+'}\n${this.charge.toFixed(1)}`)
    }
}

// Each lead provides unique angle
class Lead extends CoreGameObject {
    positive_electrodes: Electrode[]
    negative_electrodes: Electrode[]

    color: string = G_BASE_COLOR.ELECTRODE

    constructor(
        position: CoreVec2,
        positive_electrode: Electrode | [Electrode, ...Electrode[]],
        negative_electrode: Electrode | [Electrode, ...Electrode[]],
    ) {
        super(position)
        if (positive_electrode instanceof Array) {
            this.positive_electrodes = positive_electrode
        }
        else {
            this.positive_electrodes = [positive_electrode]
        }
        if (negative_electrode instanceof Array) {
            this.negative_electrodes = negative_electrode
        }
        else {
            this.negative_electrodes = [negative_electrode]
        }

        this.positive_electrodes.map(e => e.color = 'maroon')

        this.get_electrodes().map(e => e.depth = this.depth - 1)
    }

    get_electrodes() {
        return [...this.positive_electrodes, ...this.negative_electrodes]
    }

    get_current_charge() {
        // -, same, or +?
        // records only parallel
    }

    render(): void {
        const pos = this.positive_electrodes[0].position
        const neg = this.negative_electrodes[0].position

        draw.set_color(this.color)
        draw.ctx.lineWidth = 5
        draw.line_vec(neg, pos)
    }

    // get_centroid() {
    //     return new CoreVec2()
    // }
}

/**
 * Group of cells/myocards.
 * Able to depolarize by being stimulated from a point.
 * When depol, positive ion rush into cells, makes it electro-negative.
 * Default: polarized resting state.
 * Action potential travels in direction.
 * In repol, positive ion comes out of the cells.
 * Impulse to spread
 * 
 * Decrease blood flow delays repol on endocardium when contracted, so epicar repol first
 * but still the overall direction is opposite depol
 */
class Cells extends CoreGameObject {
    // thickness: number = 1 // thin > small in magnitude on graph
    // mass
    // conductivity = decides impulse travel time // slow > longer duration / wider on graph
    // overall direction when gets stimulated
    constructor(position: CoreVec2) {
        super(position)
    }
}

class Dipole extends CoreGameObject {
    start_time: number = time.t
    end_time: number
    mag: CoreVec2

    constructor(
        starting_position: CoreVec2,
        public target: CoreVec2,
        public mass: number,
        public depol_duration: number,
        public repol_duration: number,
        public repol_delay: number = 0,
    ) {
        super(starting_position)
        this.end_time = this.start_time + depol_duration + repol_delay + repol_duration
        this.mag = this.target.clone().subtract(this.position)
    }

    post_update(): void {
        if (time.t > this.end_time) {
            obj.remove(this.id)
            obj.instantiate<Dipole>(G_BASE_OBJ.DIPOLE, new Dipole(
                this.position,
                this.target,
                this.mass,
                this.depol_duration,
                this.repol_duration,
                this.repol_delay,
            ))
        }
    }

    get_depol_progress() {
        return math.clamp((time.t - this.start_time) / this.depol_duration, 0, 1)
    }

    get_repol_progress() {
        return math.clamp((time.t - this.start_time - this.depol_duration - this.repol_delay) / this.repol_duration, 0, 1)
    }

    render(): void {
        draw.ctx.lineWidth = 2
        draw.ctx.setLineDash([10, 15])
        draw.ctx.lineDashOffset = time.t * -0.01
        draw.set_color('purple')
        draw.set_alpha(0.5)
        draw.line_vec(
            this.position.clone().add(CoreVec2.polar(300, this.mag.get_angle() - Math.PI)),
            this.target.clone().add(CoreVec2.polar(300, this.mag.get_angle())),
        )
        draw.set_alpha(1)
        draw.ctx.setLineDash([])
        draw.ctx.lineDashOffset = 0

        draw.set_alpha(0.2)
        draw.set_color(G_BASE_COLOR.ELECTRIC)
        draw.ctx.lineWidth = 500
        draw.line_vec(this.position, this.target)
        draw.set_alpha(1)

        draw.ctx.lineWidth = this.mass
        draw.set_color(G_BASE_COLOR.THEME)
        draw.line_vec(this.position, this.target)


        const b = CoreVec2.polar(this.mag.get_length() * this.get_depol_progress(), this.mag.get_angle()).add(this.position)
        draw.set_color(G_BASE_COLOR.ELECTRIC)
        draw.line_vec(this.position, b)

        const c = CoreVec2.polar(this.mag.get_length() * this.get_repol_progress(), this.mag.get_angle()).add(this.position)
        draw.set_color(G_BASE_COLOR.THEME)
        draw.line_vec(this.position, c)
    }
}
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
    draw.set_color(G_BASE_COLOR.THEME)
    draw.rect(0, stage.size.y - bar_h, scene_loading.props.load_progress * stage.size.x, bar_h)

    draw.set_hvalign('center', 'middle')

    if (loader.load_amount > 0) {
        draw.set_color('#fff')
        draw.text(scene_loading.props.load_progress * stage.size.x / 2, stage.size.y - bar_h * 0.475, loading_amount_text)
    }

    const loading_progress_text = `LOADING ${progress_percent}%`

    draw.set_font(font.m.bold())
    draw.set_color(G_BASE_COLOR.THEME)

    draw.text(stage.size.x / 2, stage.size.y / 2, loading_progress_text)

    if (loader.get_is_loaded() && progress_percent >= 100) {
        scene.change_scene(scene_playground)
    }
}
//#endregion

//#region Playground
interface ScenePlaygroundProps {
    mode: G_BASE_MODE
    is_dragging: boolean
    dragged_object: CoreGameObject | null
    dragging_offset: CoreVec2,
}

const scene_playground = new CoreScene<ScenePlaygroundProps>('Playground', {
    mode: G_BASE_MODE.TESTING,
    is_dragging: false,
    dragged_object: null,
    dragging_offset: new CoreVec2(),
})

scene_playground.start = () => {
    obj.instantiate<Dipole>(G_BASE_OBJ.DIPOLE, new Dipole(
        stage.size.half().add(CoreVec2.polar_deg(100, -120)),
        stage.size.half().add(CoreVec2.polar_deg(100, 60)),
        10,
        1000,
        1000,
        500,
    ))
    const e1 = obj.instantiate<Electrode>(G_BASE_OBJ.ELECTRODE, new Electrode(stage.size.half().add(CoreVec2.polar_deg(200, -150))))
    const e2 = obj.instantiate<Electrode>(G_BASE_OBJ.ELECTRODE, new Electrode(stage.size.half().add(CoreVec2.polar_deg(200, 45))))
    obj.instantiate<Lead>(G_BASE_OBJ.LEAD, new Lead(stage.size.half().add(CoreVec2.polar_deg(200, -90)), e2, e1))
}

scene_playground.update = (p) => {
    if (p.is_dragging) {
        if (p.dragged_object) {
            p.dragged_object.position.set(input.pointer_position).add(p.dragging_offset)
        }

        if (input.pointer_up()) {
            p.is_dragging = false
        }
    }
    else {
        if (input.pointer_down()) {
            const n = obj.nearest<Electrode>(G_BASE_OBJ.ELECTRODE, input.pointer_position.x, input.pointer_position.y)
            if (n) {
                if (CoreVec2.distance(input.pointer_position, n.position) < G_BASE_ELECTRODE_HOVER_RANGE) {
                    p.dragging_offset.set(n.position).subtract(input.pointer_position)
                    p.dragged_object = n
                    p.is_dragging = true
                }
            }
        }
    }
}

scene_playground.render = () => {
}

scene_playground.render_ui = () => {
    debug.draw_fps(0, stage.size.y - font.s.size)
}
//#endregion

//#region Main Stage
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
//#endregion

//#region Load
//#endregion

//#region Entrypoint
document.addEventListener('DOMContentLoaded', async () => {
    stage.canvas.style.backgroundColor = G_BASE_COLOR.BG
    window.addEventListener('contextmenu', ev => ev.preventDefault())
    domc.add_class(core.stage.canvas, 'main-stage')
    core.events.on('core_stage_before_resize', () => {
        const wrapper = domc.q<HTMLDivElement>('.main-wrapper')!
        wrapper.style.height = `${window.innerHeight}px`
        wrapper.style.width = `${Math.min(window.innerWidth, window.innerHeight * 0.8)}px`
    })
    await core.init(domc.q('.main-container')!)
    // core.start(scene_login)
    core.start(scene_playground)
})
//#endregion
