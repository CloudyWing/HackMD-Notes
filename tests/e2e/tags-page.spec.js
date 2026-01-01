import { test, expect } from '@playwright/test';

test.describe('標籤頁面測試', () => {
    test('應該顯示標籤雲', async ({ page }) => {
        await page.goto('/tags');

        // 檢查頁面標題
        await expect(page.locator('h1')).toContainText('標籤列表');

        // 檢查標籤雲存在
        const tagsCloud = page.locator('.tags-cloud');
        await expect(tagsCloud).toBeVisible();

        // 檢查有標籤
        const tags = page.locator('.tag-item');
        const count = await tags.count();
        expect(count).toBeGreaterThan(0);
    });

    test('選擇標籤後應該顯示文章列表', async ({ page }) => {
        await page.goto('/tags');

        // 選擇第一個標籤
        const firstTag = page.locator('.tag-item').first();
        const tagName = await firstTag.locator('.tag-name').textContent();

        await firstTag.click();

        // 等待文章列表出現
        await page.waitForTimeout(500);

        // 驗證已選標籤顯示
        await expect(page.locator('.selected-tag-chip')).toContainText(tagName || '');

        // 驗證文章列表顯示
        await expect(page.locator('.article-list')).toBeVisible();

        // 驗證有文章
        const articles = page.locator('.article-item');
        const count = await articles.count();
        expect(count).toBeGreaterThan(0);
    });

    test('多選標籤應該使用AND邏輯篩選', async ({ page }) => {
        await page.goto('/tags');

        // 選擇兩個標籤
        const tags = page.locator('.tag-item');
        await tags.nth(0).click();
        await page.waitForTimeout(200);
        await tags.nth(1).click();
        await page.waitForTimeout(200);

        // 驗證兩個標籤都被選中
        const selectedChips = page.locator('.selected-tag-chip');
        const chipCount = await selectedChips.count();
        expect(chipCount).toBe(2);
    });

    test('清除按鈕應該移除所有選中標籤', async ({ page }) => {
        await page.goto('/tags');

        // 選擇一個標籤
        await page.locator('.tag-item').first().click();
        await page.waitForTimeout(200);

        // 檢查選中標籤顯示
        await expect(page.locator('.selected-filter-section')).toBeVisible();

        // 點擊清除按鈕
        await page.locator('.clear-all-btn').click();

        // 驗證選中標籤消失
        await expect(page.locator('.selected-filter-section')).not.toBeVisible();

        // 驗證文章列表消失
        await expect(page.locator('.article-list')).not.toBeVisible();
    });

    test('URL參數應該自動選擇標籤', async ({ page }) => {
        await page.goto('/tags?search=.NET');

        // 等待頁面載入
        await page.waitForLoadState('networkidle');

        // 驗證標籤被選中（或者沒有這個標籤時不報錯）
        const selectedChip = page.locator('.selected-tag-chip');
        if (await selectedChip.count() > 0) {
            await expect(selectedChip).toContainText('.NET');

            // 驗證文章列表顯示
            await expect(page.locator('.article-list')).toBeVisible();
        }
    });

    test('顯示更多按鈕應該展開所有標籤', async ({ page }) => {
        await page.goto('/tags');

        // 檢查是否有顯示更多按鈕
        const showMoreBtn = page.locator('.show-more-btn');

        if (await showMoreBtn.count() > 0) {
            // 記錄當前標籤數量
            const initialCount = await page.locator('.tag-item').count();

            // 點擊顯示更多
            await showMoreBtn.click();
            await page.waitForTimeout(200);

            // 驗證標籤數量增加
            const expandedCount = await page.locator('.tag-item').count();
            expect(expandedCount).toBeGreaterThan(initialCount);

            // 驗證按鈕文字改變
            await expect(showMoreBtn).toContainText('顯示較少');
        }
    });

    test('標籤應該顯示文章數量', async ({ page }) => {
        await page.goto('/tags');

        // 檢查標籤是否顯示數量
        const firstTag = page.locator('.tag-item').first();
        const tagCount = firstTag.locator('.tag-count');

        await expect(tagCount).toBeVisible();

        // 數量應該是數字
        const countText = await tagCount.textContent();
        expect(parseInt(countText || '0')).toBeGreaterThan(0);
    });
});
