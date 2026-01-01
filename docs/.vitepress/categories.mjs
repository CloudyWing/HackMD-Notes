export const categoryConfig = {
    'backend': {
        name: 'Backend Development',
        icon: 'fa-solid fa-server',
        className: 'cat-backend'
    },
    'frontend': {
        name: 'Frontend Development',
        icon: 'fa-solid fa-laptop-code',
        className: 'cat-frontend'
    },
    'data': {
        name: 'Data & Database',
        icon: 'fa-solid fa-database',
        className: 'cat-data'
    },
    'devops': {
        name: 'DevOps & Infrastructure',
        icon: 'fa-solid fa-cubes',
        className: 'cat-devops'
    },
    'ai': {
        name: 'AI & Machine Learning',
        icon: 'fa-solid fa-robot',
        className: 'cat-ai'
    }
}

export function getSortedCategories(dirs) {
    // Derive order from the config keys
    const categoryOrder = Object.keys(categoryConfig)

    return dirs.sort((a, b) => {
        const idxA = categoryOrder.indexOf(a)
        const idxB = categoryOrder.indexOf(b)

        if (idxA !== -1 && idxB !== -1) return idxA - idxB
        if (idxA !== -1) return -1
        if (idxB !== -1) return 1
        return a.localeCompare(b)
    })
}

export function getCategoryDisplayName(dir) {
    return categoryConfig[dir]?.name || dir.toUpperCase()
}

export function getCategoryIcon(dir) {
    return categoryConfig[dir]?.icon || 'fa-solid fa-folder'
}

export function getCategoryClass(dir) {
    return categoryConfig[dir]?.className || ''
}
