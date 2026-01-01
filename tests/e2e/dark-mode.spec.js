import { test, expect } from '@playwright/test';

test.describe('深色模式測試', () => {
    test('應該能切換到深色模式', async ({ page }) => {
        await page.goto('/');

        // 找深色模式切換按鈕
        const darkModeButton = page.locator('button.VPSwitch, button[title*="主題"], button[aria-label*="主題"]');

        if (await darkModeButton.count() > 0) {
            // 點擊切換
            await darkModeButton.click();
            await page.waitForTimeout(500);

            // 檢查 dark class 被添加
            const htmlElement = page.locator('html');
            const isDark = await htmlElement.evaluate(el => el.classList.contains('dark'));

            expect(isDark).toBeTruthy();
        }
    });

    test('深色模式下顏色應該正確', async ({ page }) => {
        await page.goto('/');

        const darkModeButton = page.locator('button.VPSwitch, button[title*="主題"], button[aria-label*="主題"]');

        if (await darkModeButton.count() > 0) {
            await darkModeButton.click();
            await page.waitForTimeout(500);

            // 檢查背景顏色（深色模式應該是深色背景）
            const body = page.locator('body');
            const bgColor = await body.evaluate(el => {
                return window.getComputedStyle(el).backgroundColor;
            });

            // 深色模式的背景應該偏暗（這裡簡單檢查不是白色）
            expect(bgColor).not.toBe('rgb(255, 255, 255)');
        }
    });

    test('深色模式切換應該保持狀態', async ({ page }) => {
        await page.goto('/');

        const darkModeButton = page.locator('button.VPSwitch, button[title*="主題"], button[aria-label*="主題"]');

        if (await darkModeButton.count() > 0) {
            // 切換到深色模式
            await darkModeButton.click();
            await page.waitForTimeout(500);

            // 導航到另一個頁面
            await page.goto('/backend/');
            await page.waitForLoadState('networkidle');

            // 檢查深色模式是否保持
            const htmlElement = page.locator('html');
            const isDark = await htmlElement.evaluate(el => el.classList.contains('dark'));

            expect(isDark).toBeTruthy();
        }
    });

    test('深色模式下文章應該正確顯示', async ({ page }) => {
        await page.goto('/backend/');

        const darkModeButton = page.locator('button.VPSwitch, button[title*="主題"], button[aria-label*="主題"]');

        if (await darkModeButton.count() > 0) {
            await darkModeButton.click();
            await page.waitForTimeout(500);

            // 點擊進入文章
            const firstArticle = page.locator('.article-item').first();
            await firstArticle.locator('.article-link').click();
            await page.waitForLoadState('networkidle');

            // 檢查代碼區塊在深色模式下可見
            const codeBlocks = page.locator('pre[class*="language-"]');
            if (await codeBlocks.count() > 0) {
                await expect(codeBlocks.first()).toBeVisible();
            }
        }
    });

    test('應該能從深色模式切回淺色模式', async ({ page }) => {
        await page.goto('/');

        const darkModeButton = page.locator('button.VPSwitch, button[title*="主題"], button[aria-label*="主題"]');

        if (await darkModeButton.count() > 0) {
            // 切換到深色
            await darkModeButton.click();
            await page.waitForTimeout(500);

            let htmlElement = page.locator('html');
            let isDark = await htmlElement.evaluate(el => el.classList.contains('dark'));
            expect(isDark).toBeTruthy();

            // 切換回淺色
            await darkModeButton.click();
            await page.waitForTimeout(500);

            isDark = await htmlElement.evaluate(el => el.classList.contains('dark'));
            expect(isDark).toBeFalsy();
        }
    });
});
