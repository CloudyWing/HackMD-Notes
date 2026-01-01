import { test, expect } from '@playwright/test';

test.describe('文章頁面測試', () => {
    // 先導航到一篇文章
    test.beforeEach(async ({ page }) => {
        await page.goto('/backend/');
        const firstArticle = page.locator('.article-item').first();
        await firstArticle.locator('.article-link').click();
        await page.waitForLoadState('networkidle');
    });

    test('文章頁面應該正確顯示', async ({ page }) => {
        // 檢查標題
        await expect(page.locator('.vp-doc h1')).toBeVisible();

        // 檢查內容容器
        await expect(page.locator('.vp-doc')).toBeVisible();
    });

    test('文章元數據應該正確顯示', async ({ page }) => {
        // 檢查文章元數據組件
        const metadata = page.locator('.article-metadata');
        if (await metadata.count() > 0) {
            await expect(metadata).toBeVisible();
        }
    });

    test('文章標籤應該正確顯示並可點擊', async ({ page }) => {
        // 檢查文章標籤區域
        const tagsSection = page.locator('.article-tags-section');

        if (await tagsSection.count() > 0) {
            await expect(tagsSection).toBeVisible();

            // 點擊第一個標籤
            const firstTag = tagsSection.locator('.tag-link').first();
            if (await firstTag.count() > 0) {
                const tagText = await firstTag.textContent();
                await firstTag.click();
                await page.waitForLoadState('networkidle');

                // 應該導航到標籤頁面
                await expect(page).toHaveURL(/\/tags\?search=/);
            }
        }
    });

    test('相關文章應該正確顯示', async ({ page }) => {
        // 檢查相關文章組件
        const relatedArticles = page.locator('.related-articles');

        if (await relatedArticles.count() > 0) {
            await expect(relatedArticles).toBeVisible();

            // 檢查至少有相關文章標題
            const relatedTitle = relatedArticles.locator('h2, h3');
            await expect(relatedTitle).toBeVisible();
        }
    });

    test('閱讀進度條應該正常運作', async ({ page }) => {
        // 檢查閱讀進度條
        const progressBar = page.locator('.reading-progress');

        if (await progressBar.count() > 0) {
            await expect(progressBar).toBeVisible();

            // 滾動頁面
            await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
            await page.waitForTimeout(500);

            // 進度條應該有寬度變化
            const width = await progressBar.evaluate(el => el.style.width || '0%');
            expect(width).not.toBe('0%');
        }
    });

    test('圖片應該可以縮放（Medium Zoom）', async ({ page }) => {
        // 檢查是否有圖片
        const images = page.locator('.vp-doc img');

        if (await images.count() > 0) {
            const firstImage = images.first();

            // 點擊圖片
            await firstImage.click();
            await page.waitForTimeout(500);

            // 檢查縮放效果（Medium Zoom overlay）
            const overlay = page.locator('.medium-zoom-overlay');
            if (await overlay.count() > 0) {
                await expect(overlay).toBeVisible();

                // 點擊關閉
                await overlay.click();
            }
        }
    });

    test('代碼區塊應該正確顯示', async ({ page }) => {
        // 檢查代碼區塊
        const codeBlocks = page.locator('pre[class*="language-"]');

        if (await codeBlocks.count() > 0) {
            const firstCodeBlock = codeBlocks.first();
            await expect(firstCodeBlock).toBeVisible();

            // 檢查語法高亮
            await expect(firstCodeBlock).toHaveAttribute('class', /language-/);
        }
    });
});
