/**
 * SEO 和 Meta 標籤管理
 */
import { useHead } from '@vueuse/head'
import { computed } from 'vue'

export function useSEO(options) {
    const {
        title,
        description,
        keywords,
        image,
        url,
        type = 'website',
        author = 'Wing Chou (CloudyWing)'
    } = options

    useHead({
        title: computed(() => title.value || title),
        meta: [
            // 基本 Meta
            {
                name: 'description',
                content: computed(() => description.value || description)
            },
            {
                name: 'keywords',
                content: computed(() => keywords?.value || keywords || '')
            },
            {
                name: 'author',
                content: author
            },

            // Open Graph
            {
                property: 'og:type',
                content: type
            },
            {
                property: 'og:title',
                content: computed(() => title.value || title)
            },
            {
                property: 'og:description',
                content: computed(() => description.value || description)
            },
            {
                property: 'og:image',
                content: computed(() => image?.value || image || '')
            },
            {
                property: 'og:url',
                content: computed(() => url?.value || url || '')
            },

            // Twitter Card
            {
                name: 'twitter:card',
                content: 'summary'
            },
            {
                name: 'twitter:title',
                content: computed(() => title.value || title)
            },
            {
                name: 'twitter:description',
                content: computed(() => description.value || description)
            },
            {
                name: 'twitter:image',
                content: computed(() => image?.value || image || '')
            }
        ]
    })
}
