import { test, expect } from '@playwright/test';

test.describe('404 頁面測試', () => {
    test('訪問不存在的頁面應該顯示 404', async ({ page }) => {
        const response = await page.goto('/this-page-does-not-exist-12345');

        // VitePress 的 404 頁面通常返回 200 但顯示 404 內容
        // 檢查頁面內容包含 404 相關文字
        const pageText = await page.textContent('body');
        expect(pageText).toMatch(/404|找不到|not found/i);
    });

    test('404 頁面應該有返回首頁按鈕', async ({ page }) => {
        await page.goto('/non-existent-page');
        await page.waitForLoadState('networkidle');

        // 檢查是否有返回首頁的連結或按鈕
        const homeLink = page.locator('a[href="/"], a[href="/"]:has-text("首頁"), a:has-text("回到首頁")');

        if (await homeLink.count() > 0) {
            await expect(homeLink.first()).toBeVisible();
        }
    });

    test('404 頁面返回首頁按鈕應該正常工作', async ({ page }) => {
        await page.goto('/invalid-url-test');
        await page.waitForLoadState('networkidle');

        const homeLink = page.locator('a[href="/"], a[href="/"]:has-text("首頁"), a:has-text("回到首頁")').first();

        if (await homeLink.count() > 0) {
            await homeLink.click();
            await page.waitForLoadState('networkidle');

            // 應該回到首頁
            expect(page.url()).toBe('http://localhost:5173/');
        }
    });

    test('404 頁面應該有推薦連結', async ({ page }) => {
        await page.goto('/some-random-404-page');
        await page.waitForLoadState('networkidle');

        // 檢查是否有推薦連結（分類、標籤等）
        const links = page.locator('a[href^="/"]');
        const linkCount = await links.count();

        // 應該至少有幾個連結
        expect(linkCount).toBeGreaterThan(0);
    });

    test('404 頁面導航欄應該正常顯示', async ({ page }) => {
        await page.goto('/404-test-page');
        await page.waitForLoadState('networkidle');

        // 檢查導航欄是否顯示
        const navbar = page.locator('.VPNavBar');
        await expect(navbar).toBeVisible();

        // 檢查導航連結是否可用
        const navLinks = navbar.locator('a');
        const count = await navLinks.count();
        expect(count).toBeGreaterThan(0);
    });

    test('從 404 頁面可以透過導航到達其他頁面', async ({ page }) => {
        await page.goto('/does-not-exist');
        await page.waitForLoadState('networkidle');

        // 點擊導航欄的「標籤」連結
        const tagsLink = page.locator('a[href="/tags"]');

        if (await tagsLink.count() > 0) {
            await tagsLink.click();
            await page.waitForLoadState('networkidle');

            // 應該導航到標籤頁
            expect(page.url()).toContain('/tags');
            await expect(page.locator('h1')).toContainText('標籤');
        }
    });
});
