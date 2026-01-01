/**
 * URL 處理工具函數
 */
export function useUrlUtils() {
    /**
     * 正規化 URL (解碼、移除尾部斜線和 .html 後綴)
     * @param {string} url - 原始 URL
     * @returns {string} 正規化後的 URL
     */
    const normalizeUrl = (url) => {
        try {
            return decodeURIComponent(url)
                .replace(/\/+$/, '')
                .replace(/\.html$/, '')
                .toLowerCase()
        } catch (e) {
            // 解碼失敗時使用原始 URL
            return url.replace(/\/+$/, '').replace(/\.html$/, '').toLowerCase()
        }
    }

    /**
     * 從 URL 路徑提取分類 (第一層目錄)
     * @param {string} url - URL 路徑 (例如: /backend/article)
     * @returns {string} 分類名稱 (例如: backend)
     */
    const getCategoryFromUrl = (url) => {
        const parts = url.split('/').filter(p => p)
        return parts[0] || ''
    }

    return { normalizeUrl, getCategoryFromUrl }
}
