import fs from 'fs'
import ts from 'typescript'
import {
    path_resolve,
    path_relative,
    public_path,
    log,
    mkdir,
    watch,
} from './util.js'

const prerender_html = (lines, tag_name, tag_dir) => {
    const tags = []

    // extract tags
    for (let i = lines.length - 1; i >= 0; i--) {
        if (lines[i].indexOf(`<insert-${tag_name}`) > -1) {
            if (lines[i].indexOf('<!--') < 0) {
                tags.push({
                    i,
                    line: lines[i],
                })
            }
        }
    }

    tags.forEach(tag => {
        // replace tag with the requested content
        const file_name = tag.line
            .split(`<insert-${tag_name}-`)[1]
            .split(' />')[0]

        const file_path = path_resolve(
            `../src/${tag_dir}/`,
            `${file_name}.html`
        )

        if (fs.existsSync(file_path)) {
            const file_text = fs
                .readFileSync(file_path)
                .toString()

            lines.splice(tag.i, 1, ...file_text.split('\n'))
        }
    })
}

const build_html = async () => {
    const app_to_build = fs
        .readdirSync(path_resolve('../src/app'), { recursive: true })
        .filter(name => /\.html$/i.test(name))

    log(
        36,
        'i html:',
        `building ${app_to_build.length} file${app_to_build.length === 1 ? '' : 's'}`
    )

    app_to_build.forEach((app_filename) => {
        const p = path_resolve('../src/app/', app_filename)
        if (fs.existsSync(p)) {
            let app_text = fs.readFileSync(p).toString()
            let app_lines = app_text.split('\n')

            prerender_html(app_lines, 'content', 'content')
            prerender_html(app_lines, 'template', 'templates')
            prerender_html(app_lines, 'component', 'components')
            prerender_html(app_lines, 'component', 'components')
            prerender_html(app_lines, 'component', 'components')

            app_text = app_lines.join('')

            const build_path = path_resolve(public_path, app_filename)
            const dir_path = build_path.split('\\').filter(name => !name.includes('.html')).join('\\')

            mkdir(dir_path, '+ dir')

            fs.writeFileSync(build_path, app_text)
            log(32, '+ html:', path_relative(build_path))
        }
    })
}

log(36, 'i dev:', 'start development')

log(36, 'i ts:', 'start watching')
ts.createWatchProgram(
    ts.createWatchCompilerHost(
        ts.findConfigFile(path_resolve('../'), ts.sys.fileExists, 'tsconfig.json'),
        {},
        ts.sys,
        ts.createSemanticDiagnosticsBuilderProgram,
        diag => console.error('Error', diag.code, ':', ts.flattenDiagnosticMessageText(diag.messageText, ts.sys.newLine)),
        diag => console.info(ts.formatDiagnostic(diag, {
            getCanonicalFileName: path => path,
            getCurrentDirectory: ts.sys.getCurrentDirectory,
            getNewLine: () => ts.sys.newLine,
        }))
    )
)

log(36, 'i html:', 'building once')
await build_html()

watch(
    path_resolve('../src'),
    (name) => /\.html$/i.test(name),
    async () => {
        await build_html()
    }
)
