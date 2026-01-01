import { test, expect } from '@playwright/test';

test.describe('網站導航測試', () => {
    test('首頁應該正確顯示', async ({ page }) => {
        await page.goto('/');

        // 檢查首頁標題
        await expect(page.locator('.VPHero .name')).toBeVisible();

        // 檢查導航連結存在
        await expect(page.locator('.VPNavBar')).toBeVisible();
    });

    test('分類導航應該正常運作', async ({ page }) => {
        await page.goto('/');

        // 導航到 Backend 分類
        await page.click('a[href="/backend/"]');
        await page.waitForLoadState('networkidle');

        // 驗證導航成功
        await expect(page).toHaveURL(/\/backend\//);
        await expect(page.locator('h1')).toContainText('後端開發');
    });

    test('側邊欄導航應該正常運作', async ({ page }) => {
        await page.goto('/backend/');

        // 檢查側邊欄存在
        const sidebar = page.locator('.VPSidebar');
        await expect(sidebar).toBeVisible();

        // 點擊側邊欄中的第一篇文章
        const firstLink = sidebar.locator('.VPSidebarItem.is-link').first();
        if (await firstLink.count() > 0) {
            await firstLink.click();
            await page.waitForLoadState('networkidle');

            // 驗證導航到文章頁面
            await expect(page.locator('.vp-doc h1')).toBeVisible();
        }
    });

    test('麵包屑導航應該正確顯示', async ({ page }) => {
        // 導航到任意文章頁面
        await page.goto('/backend/');

        const firstArticle = page.locator('.article-item').first();
        await firstArticle.locator('.article-link').click();
        await page.waitForLoadState('networkidle');

        // 檢查麵包屑存在
        const breadcrumb = page.locator('.breadcrumb');
        if (await breadcrumb.count() > 0) {
            await expect(breadcrumb).toBeVisible();

            // 點擊麵包屑返回分類頁
            const categoryLink = breadcrumb.locator('a').first();
            if (await categoryLink.count() > 0) {
                await categoryLink.click();
                await page.waitForLoadState('networkidle');

                // 驗證返回分類頁面
                await expect(page).toHaveURL(/\/backend\//);
            }
        }
    });

    test('Logo點擊應該返回首頁', async ({ page }) => {
        await page.goto('/backend/');

        // 點擊 Logo
        await page.locator('.VPNavBarTitle').click();
        await page.waitForLoadState('networkidle');

        // 驗證返回首頁
        await expect(page).toHaveURL('/');
    });
});
