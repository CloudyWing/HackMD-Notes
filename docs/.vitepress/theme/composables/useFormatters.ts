/**
 * 格式化工具函數
 */
export function useFormatters() {
    /**
     * 格式化日期為 YYYY-MM-DD 格式
     * @param {string} dateString - ISO 日期字串
     * @returns {string} 格式化後的日期
     */
    const formatDate = (dateString) => {
        if (!dateString) return ''
        return new Date(dateString).toISOString().split('T')[0]
    }

    /**
     * 格式化閱讀時間
     * @param {number} minutes - 閱讀分鐘數
     * @returns {string} 格式化後的閱讀時間文字
     */
    const formatReadingTime = (minutes) => {
        if (!minutes) return ''
        return `${minutes} 分鐘閱讀`
    }

    return { formatDate, formatReadingTime }
}
