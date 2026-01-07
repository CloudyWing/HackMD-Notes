export interface CategoryConfig {
    name: string
    icon: string
    className: string
}

export const categoryConfig: Record<string, CategoryConfig> = {
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

// 分類排序：依 categoryConfig 鍵順序而非字母順序，維持導航列和側邊欄的一致性
export function getSortedCategories(dirs: string[]): string[] {
    const categoryOrder = Object.keys(categoryConfig)

    return dirs.sort((a, b) => {
        const idxA = categoryOrder.indexOf(a)
        const idxB = categoryOrder.indexOf(b)

        // 三段式排序邏輯：
        // 1. 都在配置 → 依配置順序
        // 2. 僅一個在配置 → 配置的優先
        // 3. 都不在配置 → 依字母順序
        if (idxA !== -1 && idxB !== -1) return idxA - idxB
        if (idxA !== -1) return -1
        if (idxB !== -1) return 1
        return a.localeCompare(b)
    })
}

// Fallback：新分類未更新配置時仍可運作
export function getCategoryDisplayName(dir: string): string {
    return categoryConfig[dir]?.name || dir.toUpperCase()
}

export function getCategoryIcon(dir: string): string {
    return categoryConfig[dir]?.icon || 'fa-solid fa-folder'
}

export function getCategoryClass(dir: string): string {
    return categoryConfig[dir]?.className || ''
}
