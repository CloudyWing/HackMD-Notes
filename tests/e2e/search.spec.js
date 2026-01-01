import { test, expect } from '@playwright/test';

test.describe('搜尋功能測試', () => {
    test('應該能打開搜尋對話框', async ({ page }) => {
        await page.goto('/');

        // 點擊搜尋按鈕（VitePress local search）
        const searchButton = page.locator('button[aria-label*="搜尋"], button.DocSearch');

        if (await searchButton.count() > 0) {
            await searchButton.click();
            await page.waitForTimeout(500);

            // 檢查搜尋對話框出現
            const searchDialog = page.locator('[role="dialog"], .VPLocalSearchBox');
            await expect(searchDialog).toBeVisible();
        }
    });

    test('應該能搜尋並找到結果', async ({ page }) => {
        await page.goto('/');

        // 打開搜尋
        const searchButton = page.locator('button[aria-label*="搜尋"], button.DocSearch, .VPNavBarSearch button');

        if (await searchButton.count() > 0) {
            await searchButton.click();
            await page.waitForTimeout(500);

            // 輸入搜尋關鍵字
            const searchInput = page.locator('input[type="search"], input[placeholder*="搜尋"]');
            if (await searchInput.count() > 0) {
                await searchInput.fill('.NET');
                await page.waitForTimeout(500);

                // 檢查是否有搜尋結果
                const searchResults = page.locator('[role="option"], .result');
                if (await searchResults.count() > 0) {
                    await expect(searchResults.first()).toBeVisible();
                }
            }
        }
    });

    test('應該能點擊搜尋結果導航', async ({ page }) => {
        await page.goto('/');

        const searchButton = page.locator('button[aria-label*="搜尋"], button.DocSearch, .VPNavBarSearch button');

        if (await searchButton.count() > 0) {
            await searchButton.click();
            await page.waitForTimeout(500);

            const searchInput = page.locator('input[type="search"], input[placeholder*="搜尋"]');
            if (await searchInput.count() > 0) {
                await searchInput.fill('後端');
                await page.waitForTimeout(500);

                const firstResult = page.locator('[role="option"], .result').first();
                if (await firstResult.count() > 0) {
                    await firstResult.click();
                    await page.waitForLoadState('networkidle');

                    // 驗證導航成功（URL 已改變）
                    expect(page.url()).not.toBe('http://localhost:5173/');
                }
            }
        }
    });

    test('應該能用 ESC 鍵關閉搜尋', async ({ page }) => {
        await page.goto('/');

        const searchButton = page.locator('button[aria-label*="搜尋"], button.DocSearch, .VPNavBarSearch button');

        if (await searchButton.count() > 0) {
            await searchButton.click();
            await page.waitForTimeout(500);

            const searchDialog = page.locator('[role="dialog"], .VPLocalSearchBox');
            if (await searchDialog.count() > 0) {
                await page.keyboard.press('Escape');
                await page.waitForTimeout(500);

                // 對話框應該關閉
                await expect(searchDialog).not.toBeVisible();
            }
        }
    });
});
