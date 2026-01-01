import { h } from 'vue'
import DefaultTheme from 'vitepress/theme'
import mediumZoom from 'medium-zoom'
import { onMounted, watch, nextTick } from 'vue'
import { useRoute } from 'vitepress'
import ArticleIndex from './components/ArticleIndex.vue'
import TagsIndex from './components/TagsIndex.vue'
import Footer from './components/Footer.vue'
import ReadingProgress from './components/ReadingProgress.vue'
import Breadcrumb from './components/Breadcrumb.vue'
import RelatedArticles from './components/RelatedArticles.vue'
import ArticleTags from './components/ArticleTags.vue'
import ArticleMetadata from './components/ArticleMetadata.vue'
import ArticleFooterMeta from './components/ArticleFooterMeta.vue'
import ThemePersistence from './components/ThemePersistence.vue'
import SidebarToggle from './components/SidebarToggle.vue'
import NotFound from './NotFound.vue'
import './style.css'
import './styles/components.css'
import './styles/utilities.css'

import './external-links.css'

export default {
    extends: DefaultTheme,
    setup() {
        const route = useRoute()
        const initZoom = () => {
            mediumZoom('.main img', {
                background: 'rgba(0, 0, 0, 0.8)',
                margin: 24,
                scrollOffset: 0
            })
        }

        onMounted(() => {
            initZoom()

            // Set z-index for lightbox above sidebar
            const style = document.createElement('style')
            style.textContent = `
                .medium-zoom-overlay,
                .medium-zoom-image--opened {
                    z-index: 10000 !important;
                }
            `
            document.head.appendChild(style)
        })

        watch(
            () => route.path,
            () => nextTick(() => initZoom())
        )
    },
    enhanceApp({ app }) {
        app.component('ArticleIndex', ArticleIndex)
        app.component('TagsIndex', TagsIndex)
        app.component('ThemePersistence', ThemePersistence)
    },
    Layout: () => {
        return h(DefaultTheme.Layout, null, {
            'layout-top': () => [
                h('a', {
                    href: '#VPContent',
                    class: 'skip-link',
                    innerHTML: '跳到主要內容'
                }),
                h(ThemePersistence),
                h(ReadingProgress),
                h(SidebarToggle)
            ],
            'doc-before': () => [h(Breadcrumb), h(ArticleMetadata)],
            'doc-after': () => [h(ArticleTags), h(RelatedArticles)],
            'doc-footer-before': () => h(ArticleFooterMeta),
            'layout-bottom': () => h(Footer)
        })
    },
    NotFound
}