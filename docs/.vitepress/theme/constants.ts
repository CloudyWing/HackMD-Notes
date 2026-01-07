export const AUTHOR = {
    name: 'Wing Chou (CloudyWing)',
    email: 'noreply@cloudywing.github.io',
    emailObfuscated: 'yearningwing [at] gmail [dot] com',
    github: 'https://github.com/CloudyWing',
    homepage: 'https://cloudywing.github.io'
}

export const SITE = {
    title: "CloudyWing's Log",
    navTitle: "雲翼的技術隨筆",
    summary: '開發筆記、踩坑紀錄與架構思考',
    hostname: 'https://cloudywing.github.io',
    logo: '/images/logo.png',
    repo: 'https://github.com/CloudyWing/cloudywing.github.io',
    keywords: '.NET, C#, ASP.NET Core, Database, SQL Server, AI, DevOps, Git, Frontend, 技術筆記',
    ignoreDirs: ['.vitepress', 'public', 'images'],
    copyright() {
        const currentYear = new Date().getFullYear()
        const startYear = 2022
        const yearRange = startYear === currentYear ? currentYear : `${startYear}-${currentYear}`
        return `Copyright © ${yearRange} ${AUTHOR.name}. All Rights Reserved.`
    }
}

// Application configuration constants
export const APP_CONFIG = {
    ITEMS_PER_PAGE: 20,
    NEW_POST_DAYS: 7,
    TAG_DISPLAY_LIMIT: 10,
}
