import { createContentLoader } from 'vitepress'
import { APP_CONFIG } from './.vitepress/theme/constants.ts'

/**
 * 文章數據加載器
 * 排除 index.md 且基於 constants 配置計算 isNew 狀態
 */
export default createContentLoader('**/*.md', {
    transform(rawData) {
        return rawData
            .filter(({ url, frontmatter }) => {
                // 排除目錄頁，只保留包含標題的實體文章
                return !url.includes('/index.md')
                    && !url.endsWith('/index')
                    && frontmatter.title
            })
            .map(({ url, frontmatter }) => {
                const articleDate = new Date(frontmatter.date || '1970-01-01')
                const now = new Date()
                // 讀取全域配置的新文章判定天數
                const daysAgo = new Date(now.getTime() - (APP_CONFIG.NEW_POST_DAYS * 24 * 60 * 60 * 1000))

                return {
                    title: frontmatter.title,
                    url,
                    date: frontmatter.date || '1970-01-01',
                    lastmod: frontmatter.lastmod || null,
                    tags: frontmatter.tags || [],
                    description: frontmatter.description || '',
                    // 如果文章發布日期在 N 天內，標記為 New
                    isNew: articleDate >= daysAgo
                }
            })
            // 按日期降序排列 (最新的在前面)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    }
})
