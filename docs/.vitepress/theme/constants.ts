// Site metadata constants - safe for browser import
export const SITE = {
    title: "CloudyWing's Log",
    navTitle: "雲翼的技術隨筆",
    summary: '開發筆記、踩坑紀錄與架構思考',
    hostname: 'https://cloudywing.github.io',
    logo: '/images/logo.png',
    repo: 'https://github.com/CloudyWing/cloudywing.github.io',
    author: 'Wing Chou (CloudyWing)',
    keywords: '.NET, C#, ASP.NET Core, Database, SQL Server, AI, DevOps, Git, Frontend, 技術筆記',
    ignoreDirs: ['.vitepress', 'public', 'images'],
    copyright() {
        const currentYear = new Date().getFullYear()
        const startYear = 2022
        const yearRange = startYear === currentYear ? currentYear : `${startYear}-${currentYear}`
        return `Copyright © ${yearRange} ${this.author}. All Rights Reserved.`
    }
}

// Application configuration constants
export const APP_CONFIG = {
    // 分頁設定
    ITEMS_PER_PAGE: 20,              // 每頁顯示文章數量

    // 文章設定
    NEW_POST_DAYS: 7,                // NEW 徽章顯示天數

    // 標籤設定
    TAG_DISPLAY_LIMIT: 10,           // 標籤頁面初始顯示數量
}
