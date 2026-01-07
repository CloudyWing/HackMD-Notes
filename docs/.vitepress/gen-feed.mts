import path from 'path'
import fs from 'fs'
import { Feed } from 'feed'
import { fileURLToPath } from 'url'
import { SITE, AUTHOR } from './theme/constants.ts'
import type { SiteConfig } from 'vitepress'

// ESM 環境需要手動建立 __dirname（同 config.mjs 的原因）
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const docsDir = path.resolve(__dirname, '..')

interface Frontmatter {
    title?: string
    description?: string
    date?: string
    image?: string
}

export async function genFeed(config: SiteConfig) {
    const feed = new Feed({
        title: SITE.title,
        description: SITE.summary,
        id: SITE.hostname,
        link: SITE.hostname,
        language: "zh-TW",
        image: `${SITE.hostname}${SITE.logo}`,
        favicon: `${SITE.hostname}/favicon.ico`,
        copyright: SITE.copyright(),
        author: {
            name: AUTHOR.name,
            email: AUTHOR.email,
            link: AUTHOR.homepage
        }
    })

    const isContentDir = (f: string): boolean => {
        const p = path.join(docsDir, f)
        if (!fs.existsSync(p)) return false
        const stats = fs.statSync(p)
        return stats.isDirectory() && !SITE.ignoreDirs.includes(f)
    }

    const categories = fs.readdirSync(docsDir).filter(isContentDir)
    const posts: Array<{
        title: string
        id: string
        link: string
        description?: string
        content?: string
        author: Array<{ name: string; link: string }>
        date: Date
        image?: string
    }> = []

    for (const category of categories) {
        const categoryDir = path.join(docsDir, category)
        const files = fs.readdirSync(categoryDir).filter(f => f.endsWith('.md') && f !== 'index.md')

        for (const file of files) {
            const filePath = path.join(categoryDir, file)
            const content = fs.readFileSync(filePath, 'utf-8')
            const frontmatter = parseFrontmatter(content)
            const url = `${SITE.hostname}/${category}/${file.replace(/\.md$/, '')}`

            if (!frontmatter.date) {
                console.log(`[RSS Feed] Skipping ${file}: no date found. Title: ${frontmatter.title}`)
                continue
            }

            posts.push({
                title: frontmatter.title || '',
                id: url,
                link: url,
                description: frontmatter.description,
                content: frontmatter.description,
                author: [
                    {
                        name: AUTHOR.name,
                        link: AUTHOR.homepage
                    }
                ],
                date: new Date(frontmatter.date),
                image: frontmatter.image ? `${SITE.hostname}${frontmatter.image}` : undefined
            })
        }
    }

    posts.sort((a, b) => b.date.getTime() - a.date.getTime())

    posts.forEach(post => {
        feed.addItem(post)
    })

    const distDir = config.outDir
    fs.writeFileSync(path.join(distDir, 'feed.xml'), feed.rss2())
}

// VitePress buildEnd 階段沒有提供 frontmatter API，必須手動解析
function parseFrontmatter(content: string): Frontmatter {
    const frontmatter: Frontmatter = {}

    // 處理 Windows (CRLF) 和 Mac/Linux (LF) 的不同換行符號
    const match = content.match(/^---\r?\n([\s\S]+?)\r?\n---/)
    if (match) {
        const lines = match[1].replace(/\r\n/g, '\n').split('\n')
        lines.forEach(line => {
            const colonIndex = line.indexOf(':')
            if (colonIndex > 0) {
                const key = line.slice(0, colonIndex).trim()
                let value = line.slice(colonIndex + 1).trim()

                // Remove quotes
                if (value.startsWith('"') && value.endsWith('"')) {
                    value = value.slice(1, -1)
                }
                if (value.startsWith("'") && value.endsWith("'")) {
                    value = value.slice(1, -1)
                }
                // Handle array like [".NET", "C#"] - very basic
                if (value.startsWith('[') && value.endsWith(']')) {
                    // simplified: keep as string or just take first
                    // For feed, we might not strictly need array parsing unless managing tags
                }

                (frontmatter as any)[key] = value
            }
        })
    }
    return frontmatter
}
