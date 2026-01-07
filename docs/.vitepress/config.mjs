
import { defineConfig } from 'vitepress'
import { withMermaid } from 'vitepress-plugin-mermaid'

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { getSortedCategories, getCategoryDisplayName } from './categories.mts'
import { genFeed } from './gen-feed.mts'
import { SITE, AUTHOR } from './theme/constants.ts'

// ESM 不提供 __dirname，需從 import.meta.url 建立
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const docsDir = path.resolve(__dirname, '..')

// Re-export SITE for backward compatibility
export { SITE }

// Helper to check for ignored directories
const isContentDir = (f) => {
    const stats = fs.statSync(path.join(docsDir, f))
    return stats.isDirectory() && !SITE.ignoreDirs.includes(f)
}

function getTitle(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf-8')
        const match = content.match(/^title:\s*["']?(.*?)["']?$/m)
        if (match) return match[1]
    } catch (e) { }
    return path.basename(filePath, '.md')
}

function getNavCategories() {
    const dirs = fs.readdirSync(docsDir).filter(isContentDir)
    const sortedDirs = getSortedCategories(dirs)

    return sortedDirs.map(dir => ({
        text: getCategoryDisplayName(dir),
        link: `/${dir}/`,
        activeMatch: `/${dir}/`
    }))
}

// URL rewrites：舊分類→新結構（SEO 和向後相容）
function generateRewrites() {
    return {
        'dotnet/:slug*': 'backend/:slug*',
        'database/:slug*': 'data/:slug*',
        'git/:slug*': 'devops/:slug*'
    }
}

function getSidebar() {
    const sidebar = {}
    const dirs = fs.readdirSync(docsDir).filter(isContentDir)
    const sortedDirs = getSortedCategories(dirs)

    sortedDirs.forEach(cat => {
        const dir = path.join(docsDir, cat)
        if (fs.existsSync(dir)) {
            const files = fs.readdirSync(dir).filter(f => f.endsWith('.md') && f !== 'index.md')
            if (files.length > 0) {
                // 從檔案 frontmatter 讀取日期用於排序
                // VitePress 沒有提供直接取得 frontmatter 的 API，所以需要手動解析
                const fileData = files.map(file => {
                    const filePath = path.join(dir, file)
                    const content = fs.readFileSync(filePath, 'utf-8')
                    const frontmatterMatch = content.match(/^---\s*([\s\S]*?)\s*---/)
                    let date = '1970-01-01'  // 預設日期：沒有日期的文章會排在最後
                    if (frontmatterMatch) {
                        const dateMatch = frontmatterMatch[1].match(/^date:\s*(.+)$/m)
                        if (dateMatch) {
                            date = dateMatch[1].trim()
                        }
                    }
                    return { file, filePath, date }
                })

                // 依日期降冪排序：最新文章顯示在最上方
                fileData.sort((a, b) => new Date(b.date) - new Date(a.date))

                sidebar[`/${cat}/`] = [
                    {
                        text: getCategoryDisplayName(cat),
                        items: fileData.map(({ file, filePath }) => {
                            return {
                                text: getTitle(filePath),
                                link: `/${cat}/${file.replace(/\.md$/, '')}`
                            }
                        })
                    }
                ]
            }
        }
    })
    return sidebar
}

// 使用 withMermaid 包裝配置以啟用 Mermaid 圖表支援
// 必須在最外層包裝，這樣 Mermaid 插件才能正確攔截和處理 markdown 中的圖表語法
export default withMermaid(defineConfig({
    title: SITE.title,
    description: `${SITE.navTitle} - ${SITE.summary}`,
    // 允許失效連結：開發階段某些頁面可能尚未建立，避免 build 失敗
    ignoreDeadLinks: true,
    head: [
        ['link', { rel: 'icon', href: SITE.logo }],
        // Font preconnect for performance optimization
        ['link', { rel: 'preconnect', href: 'https://fonts.googleapis.com' }],
        ['link', { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' }],
        ['link', {
            rel: 'stylesheet',
            href: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css'
        }],
        // SEO: Meta tags
        ['meta', { name: 'keywords', content: SITE.keywords }],
        ['meta', { name: 'author', content: AUTHOR.name }],

        // Open Graph / Facebook
        ['meta', { property: 'og:type', content: 'website' }],
        ['meta', { property: 'og:site_name', content: SITE.title }],
        ['meta', { property: 'og:title', content: `${SITE.title} - ${SITE.navTitle}` }],
        ['meta', { property: 'og:description', content: SITE.summary }],
        ['meta', { property: 'og:image', content: `${SITE.hostname}${SITE.logo}` }],
        ['meta', { property: 'og:url', content: `${SITE.hostname}/` }],

        // Twitter Card
        ['meta', { name: 'twitter:card', content: 'summary' }],
        ['meta', { name: 'twitter:title', content: `${SITE.title} - ${SITE.navTitle}` }],
        ['meta', { name: 'twitter:description', content: SITE.summary }],
        ['meta', { name: 'twitter:image', content: `${SITE.hostname}${SITE.logo}` }],
        // RSS Feed
        ['link', { rel: 'alternate', type: 'application/rss+xml', title: 'RSS Feed', href: '/feed.xml' }],

        // View Counter Script
        ['script', {}, `
(function() {
    const workerBaseUrl = 'https://blog-view-counter.yearningwing.workers.dev/';
    const fetchedCounts = new Map();
    
    function isArticlePage() {
        const path = window.location.pathname;
        if (path === '/' || path === '/index.html') return false;
        if (path.includes('/tags')) return false;
        if (path === '/about.html' || path === '/about') return false;
    
        const segments = path.split('/').filter(Boolean);
        if (segments.length > 0 && segments[segments.length - 1] === 'index') return false;
        
        return segments.length >= 2;
    }
    
    async function fetchViewCount(articleId, readOnly = false) {
        if (!articleId) return 0;
        
        if (fetchedCounts.has(articleId)) {
            return fetchedCounts.get(articleId);
        }
        
        try {
            let targetUrl = workerBaseUrl + '?id=' + encodeURIComponent(articleId);
            
            if (readOnly) {
                targetUrl += '&readOnly=true';
            }
            
            const res = await fetch(targetUrl);
            const data = await res.json();
            const count = data.count || 0;
            
            fetchedCounts.set(articleId, count);
            return count;
        } catch (err) {
            console.error('[ViewCount] Error:', err);
            return 0;
        }
    }
    
    async function updateAllViewCounts() {
        const elements = document.querySelectorAll('.view-count-display');
        
        if (elements.length === 0) {
            return;
        }
        
        const updates = Array.from(elements).map(async (el) => {
            const articleId = el.getAttribute('data-article-id');
            if (!articleId) return;
            
            const isCurrent = el.getAttribute('data-is-current') === 'true';
            const count = await fetchViewCount(articleId, !isCurrent);
            el.textContent = count;
        });
        
        await Promise.all(updates);
    }
    
    function scheduleUpdate() {
        let attempts = 0;
        const maxAttempts = 10;
        
        const tryUpdate = () => {
            const elements = document.querySelectorAll('.view-count-display');
            if (elements.length > 0) {
                updateAllViewCounts();
            } else {
                attempts++;
                if (attempts < maxAttempts) {
                    setTimeout(tryUpdate, 200);
                } else {
                    console.warn('[ViewCount] No elements found after', maxAttempts, 'attempts');
                }
            }
        };
        
        tryUpdate();
    }
    
    // 頁面載入時執行
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => setTimeout(scheduleUpdate, 100));
    } else {
        setTimeout(scheduleUpdate, 100);
    }
    
    // 監聽 SPA 路由變化
    let lastUrl = location.href;
    const observer = new MutationObserver(() => {
        const url = location.href;
        if (url !== lastUrl) {
            lastUrl = url;
            setTimeout(scheduleUpdate, 300);
        }
    });
    
    if (typeof document !== 'undefined' && document.body) {
        observer.observe(document.body, { childList: true, subtree: true });
    }
})();
        `]
    ],
    lang: 'zh-TW',
    cleanUrls: true,
    markdown: {
        lineNumbers: true,
        config: (md) => {
            // Add loading='lazy' to all images for performance
            const defaultRender = md.renderer.rules.image || function (tokens, idx, options, env, self) {
                return self.renderToken(tokens, idx, options)
            }
            md.renderer.rules.image = function (tokens, idx, options, env, self) {
                const token = tokens[idx]
                const aIndex = token.attrIndex('loading')
                if (aIndex < 0) {
                    token.attrPush(['loading', 'lazy'])
                } else {
                    token.attrs[aIndex][1] = 'lazy'
                }
                return defaultRender(tokens, idx, options, env, self)
            }
        }
    },
    sitemap: {
        hostname: SITE.hostname
    },
    rewrites: generateRewrites(),
    themeConfig: {
        logo: SITE.logo,
        siteTitle: SITE.navTitle,
        nav: [
            { text: '首頁', link: '/' },
            {
                text: '技術分類',
                items: getNavCategories()
            },
            { text: '標籤', link: '/tags' },
            { text: '關於我', link: '/about' }
        ],
        sidebar: getSidebar(),
        socialLinks: [
            { icon: 'github', link: SITE.repo }
        ],
        search: {
            provider: 'local'
        },
        // 介面語言本地化
        darkModeSwitchLabel: '主題',
        sidebarMenuLabel: '選單',
        returnToTopLabel: '返回頂部',
        langMenuLabel: '語言',
        outline: {
            label: '本頁大綱',
            level: [2, 3]
        }
    },
    transformPageData(pageData) {
        // Whitelist approach: only enable TOC for article pages
        // An article page is defined as:
        // 1. Has a title in frontmatter
        // 2. NOT an index page (index.md)
        // 3. NOT a special page (tags.md, about.md, home page)
        // 4. IS in a category folder (backend/, frontend/, etc.)

        // Check if page is an index page (includes category index like frontend/index.md)
        const isIndexPage = pageData.relativePath.endsWith('index.md') || pageData.relativePath.endsWith('/')
        const isSpecialPage = ['tags.md', 'about.md'].some(p => pageData.relativePath.includes(p))
        const hasTitle = Boolean(pageData.frontmatter.title)
        const isInCategoryFolder = pageData.relativePath.includes('/') && !pageData.relativePath.startsWith('.vitepress/')

        // Article pages: have title, in category folder, not index or special pages
        const isArticlePage = hasTitle && isInCategoryFolder && !isIndexPage && !isSpecialPage

        // Enable outline only for article pages
        if (!isArticlePage) {
            pageData.frontmatter.outline = false
        }

        return pageData
    },
    transformHead: ({ pageData }) => {
        const head = []

        if (pageData.frontmatter?.date && pageData.relativePath !== 'index.md') {
            const jsonLd = {
                '@context': 'https://schema.org',
                '@type': 'BlogPosting',
                headline: pageData.title,
                datePublished: pageData.frontmatter.date,
                author: {
                    '@type': 'Person',
                    name: AUTHOR.name
                }
            }
            if (pageData.frontmatter.lastmod) {
                jsonLd.dateModified = pageData.frontmatter.lastmod
            }
            if (pageData.frontmatter.description) {
                jsonLd.description = pageData.frontmatter.description
            }

            head.push(['script', { type: 'application/ld+json' }, JSON.stringify(jsonLd, null, 4)])
        }

        return head
    },
    buildEnd: genFeed
}))
