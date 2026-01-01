import DefaultTheme from 'vitepress/theme'
import ArticleIndex from './components/ArticleIndex.vue'
import './style.css'

export default {
    extends: DefaultTheme,
    enhanceApp({ app }) {
        app.component('ArticleIndex', ArticleIndex)
    }
}
