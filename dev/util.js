import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const path_resolve = (...paths) => path.resolve(__dirname, ...paths)
const path_relative = (...paths) => path.relative(path_resolve('../'), ...paths)
const public_path = path_resolve('../public')

const is_prod = process.argv.includes('--prod')

const log = (color_code, pre, content, ...misc) => console.log(`\x1b[${color_code}m%s\x1b[0m %s`, pre, content, ...misc)

const mkdir = (p, log_pre) => {
    if (!fs.existsSync(p)) {
        fs.mkdirSync(p, { recursive: true })
        if (log_pre) {
            log(32, log_pre, path_relative(p))
        }
    }
}

const write = (p, data = '', log_pre) => {
    if (!fs.existsSync(p)) {
        fs.writeFileSync(p, data)
        if (log_pre) {
            log(32, log_pre, path_relative(p))
        }
    }
}

const rebounce_time = 100
const watch = (path, filter, callback) => {
    let can_rebuild = true // for rebounce
    const reset = () => (can_rebuild = true)
    fs.watch(path, { recursive: true }, async (ev, name) => {
        if (can_rebuild && name && filter(name)) {
            can_rebuild = false
            setTimeout(reset, rebounce_time)
            await callback(ev, name)
        }
    })
}

export {
    path_resolve,
    path_relative,
    public_path,
    is_prod,
    log,
    mkdir,
    write,
    watch,
}
