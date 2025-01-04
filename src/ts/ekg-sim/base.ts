//#region Alias
const {
    events,
    math,
    common,
    domu,
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
//#endregion

//#region Objects

//#endregion

//#region Scenes
//#region Login
interface SceneLoginProps {
    login_button: HTMLDivElement
    view_all_button: HTMLDivElement
}

const scene_login = new CoreScene<SceneLoginProps>('Login', {
    login_button: domu.q('.login-button')!,
    view_all_button: domu.q('.view-all-button')!,
})

scene_login.props.login_button.onclick = () => {
    scene.change_scene(scene_loading)
}

scene_login.props.view_all_button.onclick = () => {
    window.location.href = '/'
}
//#endregion

// Loading
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
    draw.rect(0, stage.size.y - bar_h, stage.size.x, bar_h)
    draw.set_color('#198754')
    draw.rect(0, stage.size.y - bar_h, scene_loading.props.load_progress * stage.size.x, bar_h)

    draw.set_hvalign('center', 'middle')

    if (loader.load_amount > 0) {
        draw.set_color('#fff')
        draw.text(scene_loading.props.load_progress * stage.size.x / 2, stage.size.y - bar_h * 0.475, loading_amount_text)
    }

    const loading_progress_text = `LOADING ${progress_percent}%`

    draw.set_font(font.m.bold())
    draw.set_color('#198754')

    draw.text(stage.size.x / 2, stage.size.y / 2, loading_progress_text)

    if (loader.get_is_loaded() && progress_percent >= 100) {
        scene.change_scene(scene_playground)
    }
}

// Playground
interface ScenePlaygroundProps { }

const scene_playground = new CoreScene<ScenePlaygroundProps>('Playground', {})

scene_playground.start = () => {
}

scene_playground.update = () => {
}

scene_playground.render = () => {
}

scene_playground.render_ui = () => {
    debug.draw_fps(0, 0)
}

const main_stage = {
    get_list() {
        return domu.qa('.main-stage')
    },
    unhide(el: Element) {
        domu.remove_class(el, 'hidden')
    },
    hide_all() {
        this.get_list().forEach(el => domu.add_class(el, 'hidden'))
    },
    change(el: Element) {
        this.hide_all()
        this.unhide(el)
    }
}

events.on('core_scene_change_scene', ev => {
    switch (ev.current_scene) {
        case scene_login:
            main_stage.change(domu.q('.main-stage#stage-login')!)
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
    window.addEventListener('contextmenu', ev => ev.preventDefault())
    domu.add_class(core.stage.canvas, 'main-stage')
    await core.init(domu.q('.main-container')!)
    core.start(scene_login)
    // core.start(scene_playground)
})
//#endregion
