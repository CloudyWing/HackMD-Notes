import { test, expect } from '@playwright/test';

test.describe('分類頁面測試', () => {
    test('應該正確顯示Backend分類文章', async ({ page }) => {
        await page.goto('/backend/');

        // 檢查標題
        await expect(page.locator('h1')).toContainText('後端開發');

        // 檢查文章列表存在
        const articleList = page.locator('.article-list');
        await expect(articleList).toBeVisible();

        // 檢查至少有一篇文章
        const articles = page.locator('.article-item');
        const count = await articles.count();
        expect(count).toBeGreaterThan(0);

        // 檢查排序控制存在
        await expect(page.locator('.sort-control')).toBeVisible();
    });

    test('排序功能應該正常運作', async ({ page }) => {
        await page.goto('/backend/');

        // 點擊排序切換按鈕
        const sortToggle = page.locator('.sort-order-toggle');
        await sortToggle.click();

        // 驗證圖標改變
        const icon = sortToggle.locator('i');
        await expect(icon).toHaveClass(/fa-arrow-up-short-wide/);

        // 再點擊一次切換回來
        await sortToggle.click();
        await expect(icon).toHaveClass(/fa-arrow-down-wide-short/);
    });

    test('分頁功能正常（如果有超過20篇文章）', async ({ page }) => {
        await page.goto('/backend/');

        const articles = page.locator('.article-item');
        const count = await articles.count();

        if (count === 20) {
            // 檢查分頁控制存在
            await expect(page.locator('.pagination-controls')).toBeVisible();

            // 檢查上一頁按鈕被禁用（在第一頁）
            const prevButton = page.locator('.pagination-button').first();
            await expect(prevButton).toBeDisabled();

            // 檢查下一頁按鈕可用
            const nextButton = page.locator('.pagination-button').last();
            await expect(nextButton).toBeEnabled();

            // 點擊下一頁
            await nextButton.click();

            // 等待頁面更新
            await page.waitForTimeout(300);

            // 檢查上一頁按鈕現在可用
            await expect(prevButton).toBeEnabled();
        }
    });

    test('文章點擊應該導航到正確頁面', async ({ page }) => {
        await page.goto('/backend/');

        const firstArticle = page.locator('.article-item').first();
        const articleTitle = await firstArticle.locator('.article-title').textContent();

        await firstArticle.locator('.article-link').click();

        // 等待頁面載入
        await page.waitForLoadState('networkidle');

        // 驗證導航成功（標題應該匹配）
        const h1 = page.locator('h1').first();
        const h1Text = await h1.textContent();
        expect(h1Text?.trim()).toBe(articleTitle?.trim());
    });

    test('標籤連結應該導航到標籤頁面', async ({ page }) => {
        await page.goto('/backend/');

        // 找第一個標籤
        const firstTag = page.locator('.tag-base').first();
        if (await firstTag.count() > 0) {
            const tagText = await firstTag.textContent();
            await firstTag.click();

            // 等待導航
            await page.waitForLoadState('networkidle');

            // 應該在標籤頁面
            await expect(page).toHaveURL(/\/tags\?search=/);

            // 檢查標籤被選中
            await expect(page.locator('.selected-tag-chip')).toContainText(tagText || '');
        }
    });
});
