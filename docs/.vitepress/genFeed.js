import path from 'path'
import fs from 'fs'
import { Feed } from 'feed'
import { fileURLToPath } from 'url'
import { SITE } from './theme/constants.ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const docsDir = path.resolve(__dirname, '..')

export async function genFeed(config) {
    const feed = new Feed({
        title: SITE.title,
        description: SITE.summary,
        id: SITE.hostname,
        link: SITE.hostname,
        language: "zh-TW",
        image: `${SITE.hostname}${SITE.logo}`,
        favicon: `${SITE.hostname}/favicon.ico`,
        copyright: SITE.copyright(2024),
        author: {
            name: SITE.author,
            email: "cloudywing@example.com",
            link: SITE.hostname
        }
    })

    // Filter for category directories
    const isContentDir = (f) => {
        const p = path.join(docsDir, f)
        if (!fs.existsSync(p)) return false
        const stats = fs.statSync(p)
        return stats.isDirectory() && !SITE.ignoreDirs.includes(f)
    }

    const categories = fs.readdirSync(docsDir).filter(isContentDir)
    const posts = []

    for (const category of categories) {
        const categoryDir = path.join(docsDir, category)
        const files = fs.readdirSync(categoryDir).filter(f => f.endsWith('.md') && f !== 'index.md')

        for (const file of files) {
            const filePath = path.join(categoryDir, file)
            const content = fs.readFileSync(filePath, 'utf-8')
            const frontmatter = parseFrontmatter(content)
            const url = `${SITE.hostname}/${category}/${file.replace(/\.md$/, '')}`

            // Skip if no date or draft
            if (!frontmatter.date) continue

            posts.push({
                title: frontmatter.title,
                id: url,
                link: url,
                description: frontmatter.description,
                content: frontmatter.description,
                author: [
                    {
                        name: SITE.author,
                        link: SITE.hostname
                    }
                ],
                date: new Date(frontmatter.date),
                image: frontmatter.image ? `${SITE.hostname}${frontmatter.image}` : undefined
            })
        }
    }

    // Sort by date desc
    posts.sort((a, b) => b.date - a.date)

    posts.forEach(post => {
        feed.addItem(post)
    })

    const distDir = config.outDir
    fs.writeFileSync(path.join(distDir, 'feed.xml'), feed.rss2())
    // fs.writeFileSync(path.join(distDir, 'feed.json'), feed.json1()) 
}

function parseFrontmatter(content) {
    const frontmatter = {}

    // Simple regex for yaml frontmatter
    const match = content.match(/^---\n([\s\S]+?)\n---/)
    if (match) {
        const lines = match[1].split('\n')
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

                frontmatter[key] = value
            }
        })
    }
    return frontmatter
}
