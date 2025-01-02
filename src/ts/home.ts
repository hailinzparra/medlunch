(() => {
    const game_list = dom.q<'div'>('#game-list')!

    enum BadgeText {
        EDUCATIONAL = 'Educational',
        CASUAL = 'Casual',
    }

    const BadgeColor = {
        [BadgeText.EDUCATIONAL]: 'success',
        [BadgeText.CASUAL]: 'danger',
    }

    const add_item = (title: string, page: string, description: string, badge_text: BadgeText) => {
        const col = dom.c('div', {
            classes: ['col-12', 'col-sm-6', 'col-md-4', 'mb-3'],
            children: [
                dom.c('div', {
                    classes: ['card', 'h-100'],
                    children: [
                        dom.c('div', {
                            classes: ['card-body'],
                            children: [
                                dom.c('h5', {
                                    classes: ['card-title', 'mb-1'],
                                    children: [
                                        dom.c('a', {
                                            classes: ['text-black'],
                                            attributes: { 'href': `/${page}/` },
                                            text: title,
                                        })
                                    ],
                                }),
                                dom.c('span', {
                                    classes: ['badge', `text-bg-${BadgeColor[badge_text]}`, 'mb-1', 'text-wrap', 'text-break'],
                                    text: badge_text,
                                }),
                                dom.c('p', {
                                    classes: ['card-text'],
                                    text: description,
                                }),
                            ],
                        })
                    ],
                }),
            ],
        })

        game_list.appendChild(col)
    }

    game_list.innerHTML = ''
    add_item('EKG Sim', 'ekg-sim', 'Interactive EKG learning. Visualize a standard 12-lead EKG report.', BadgeText.EDUCATIONAL)
    add_item('Marble Shoot', 'marble-shoot', 'Turn-based marble battles. Knock out rivals and claim victory!', BadgeText.CASUAL)
    add_item('Happy Capy', 'happy-capy', 'Turn-based marble battles. Knock out rivals and claim victory!', BadgeText.CASUAL)
})()
