
import { defineConfig } from 'vitepress'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const docsDir = path.resolve(__dirname, '..')

function getTitle(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf-8')
        const match = content.match(/^title:\s*["']?(.*?)["']?$/m)
        if (match) return match[1]
    } catch (e) { }
    return path.basename(filePath, '.md')
}

function getSidebar() {
    const sidebar = {}
    const categories = ['dotnet', 'database', 'frontend', 'devops', 'git', 'ai']

    categories.forEach(cat => {
        const dir = path.join(docsDir, cat)
        if (fs.existsSync(dir)) {
            const files = fs.readdirSync(dir).filter(f => f.endsWith('.md') && f !== 'index.md')
            if (files.length > 0) {
                sidebar[`/${cat}/`] = [
                    {
                        text: cat.toUpperCase(),
                        items: files.map(file => {
                            const filePath = path.join(dir, file)
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

export default defineConfig({
    title: "CloudWing's Log",
    description: "雲翼的技術隨筆 - 開發筆記、踩坑紀錄與架構思考",
    ignoreDeadLinks: true,
    themeConfig: {
        nav: [
            { text: 'Home', link: '/' },
            { text: '.NET', link: '/dotnet/' },
            { text: 'Database', link: '/database/' },
            { text: 'Frontend', link: '/frontend/' },
            { text: 'DevOps', link: '/devops/' },
            { text: 'Git', link: '/git/' },
            { text: 'AI', link: '/ai/' },
            { text: 'About', link: '/about' }
        ],
        sidebar: getSidebar(),
        socialLinks: [
            { icon: 'github', link: 'https://github.com/CloudyWing/cloudywing.github.io' }
        ],
        search: {
            provider: 'local'
        }
    }
})
