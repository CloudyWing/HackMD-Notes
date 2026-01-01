import { test, expect, devices } from '@playwright/test';

test.describe('響應式設計測試', () => {
    test('桌面版應該正確顯示（1920x1080）', async ({ page }) => {
        await page.setViewportSize({ width: 1920, height: 1080 });
        await page.goto('/backend/');

        // 檢查側邊欄顯示
        await expect(page.locator('.VPSidebar')).toBeVisible();

        // 檢查 TOC 顯示（如果螢幕夠寬）
        const toc = page.locator('.VPDocAside');
        if (await toc.count() > 0) {
            await expect(toc).toBeVisible();
        }

        // 檢查文章列表寬度合理
        const articleList = page.locator('.article-list');
        await expect(articleList).toBeVisible();
    });

    test('平板版應該正確顯示（768x1024）', async ({ page }) => {
        await page.setViewportSize({ width: 768, height: 1024 });
        await page.goto('/backend/');

        // 檢查文章列表responsive
        const articleItems = page.locator('.article-item');
        await expect(articleItems.first()).toBeVisible();

        // 檢查排序控制responsive
        const sortControl = page.locator('.sort-control');
        await expect(sortControl).toBeVisible();
    });

    test('手機版應該正確顯示（375x667）', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 });
        await page.goto('/backend/');

        // 檢查文章列表在小螢幕正常顯示
        const articleList = page.locator('.article-list');
        await expect(articleList).toBeVisible();

        // 檢查文章卡片堆疊
        const articleItems = page.locator('.article-item');
        const firstItem = articleItems.first();
        await expect(firstItem).toBeVisible();
    });

    test('標籤頁面在手機版應該正確顯示', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 });
        await page.goto('/tags');

        // 檢查標籤雲responsive
        const tagsCloud = page.locator('.tags-cloud');
        await expect(tagsCloud).toBeVisible();

        // 選擇一個標籤
        await page.locator('.tag-item').first().click();
        await page.waitForTimeout(500);

        // 檢查文章列表responsive
        const articleList = page.locator('.article-list');
        await expect(articleList).toBeVisible();
    });

    test('導航欄在不同螢幕尺寸應該正確顯示', async ({ page }) => {
        // 測試桌面版
        await page.setViewportSize({ width: 1280, height: 800 });
        await page.goto('/');
        await expect(page.locator('.VPNavBar')).toBeVisible();

        // 測試手機版
        await page.setViewportSize({ width: 375, height: 667 });
        await expect(page.locator('.VPNavBar')).toBeVisible();
    });

    test('分頁控制在手機版應該正確顯示', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 });
        await page.goto('/backend/');

        // 如果有分頁
        const pagination = page.locator('.pagination-controls');
        if (await pagination.count() > 0) {
            await expect(pagination).toBeVisible();

            // 檢查按鈕在行動版的排列
            const buttons = pagination.locator('.pagination-button');
            await expect(buttons.first()).toBeVisible();
        }
    });

    test('圖片在不同尺寸應該正確縮放', async ({ page }) => {
        // 導航到有圖片的文章
        await page.goto('/backend/');
        const firstArticle = page.locator('.article-item').first();
        await firstArticle.locator('.article-link').click();
        await page.waitForLoadState('networkidle');

        // 桌面版
        await page.setViewportSize({ width: 1920, height: 1080 });
        const desktopImages = page.locator('.vp-doc img');
        if (await desktopImages.count() > 0) {
            await expect(desktopImages.first()).toBeVisible();
        }

        // 手機版
        await page.setViewportSize({ width: 375, height: 667 });
        const mobileImages = page.locator('.vp-doc img');
        if (await mobileImages.count() > 0) {
            await expect(mobileImages.first()).toBeVisible();
        }
    });

    // 使用Playwright的裝置模擬
    test.describe('裝置模擬測試', () => {
        test('iPhone 12 Pro', async ({ browser }) => {
            const context = await browser.newContext({
                ...devices['iPhone 12 Pro'],
            });
            const page = await context.newPage();

            await page.goto('/tags');
            await expect(page.locator('.tags-cloud')).toBeVisible();

            await context.close();
        });

        test('iPad Pro', async ({ browser }) => {
            const context = await browser.newContext({
                ...devices['iPad Pro'],
            });
            const page = await context.newPage();

            await page.goto('/backend/');
            await expect(page.locator('.article-list')).toBeVisible();

            await context.close();
        });
    });
});
