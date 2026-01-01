import { createContentLoader } from 'vitepress'

export default createContentLoader('**/*.md', {
    transform(rawData) {
        return rawData.map(({ url, frontmatter }) => ({
            title: frontmatter.title || url.split('/').pop().replace(/\.md$/, ''),
            url
        }))
            .sort((a, b) => a.title.localeCompare(b.title))
    }
})
