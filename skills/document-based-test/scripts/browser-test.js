#!/usr/bin/env node
/**
 * browser-test.js
 * 前端页面测试脚本 - 获取页面信息、元素状态和截图
 *
 * Usage:
 *     node browser-test.js <url> [selectors...]
 *     node browser-test.js http://localhost:3000 "#app" ".container"
 *
 * Options:
 *     --screenshot <path>          Save screenshot to file (default: browser-test.png)
 *     --console-errors             Capture console errors
 *     --console-warnings           Capture console warnings
 *     --error-pattern <regex>      Filter console errors by pattern
 *     --wait <ms>                  Wait before capturing (e.g. 2000)
 *     --viewport <width>x<height>  Set viewport (e.g. 1280x720)
 */

const { chromium } = require('playwright');

async function runTests() {
  const args = process.argv.slice(2);

  const options = {};
  const positionalArgs = [];

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--screenshot':
        options.screenshot = args[++i];
        break;
      case '--console-errors':
        options.captureConsoleErrors = true;
        break;
      case '--console-warnings':
        options.captureConsoleWarnings = true;
        break;
      case '--error-pattern':
        options.errorPattern = new RegExp(args[++i]);
        break;
      case '--wait':
        options.waitMs = parseInt(args[++i], 10);
        break;
      case '--viewport':
        const [width, height] = args[++i].split('x').map(Number);
        options.viewport = { width, height };
        break;
      default:
        positionalArgs.push(args[i]);
    }
  }

  const url = positionalArgs[0] || 'http://localhost:3000';
  const selectors = positionalArgs.slice(1);

  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    const viewport = options.viewport || { width: 1280, height: 720 };
    await page.setViewportSize(viewport);

    const consoleMessages = [];
    const consoleErrors = [];
    const consoleWarnings = [];

    page.on('console', msg => {
      const text = msg.text();
      consoleMessages.push({ type: msg.type(), text });

      if (msg.type() === 'error') {
        if (options.errorPattern && !options.errorPattern.test(text)) {
          return;
        }
        consoleErrors.push(text);
      } else if (msg.type() === 'warning') {
        consoleWarnings.push(text);
      }
    });

    page.on('pageerror', err => {
      consoleErrors.push(`PageError: ${err.message}`);
    });

    console.log(`[browser-test] Navigating to: ${url}`);
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

    if (options.waitMs) {
      await page.waitForTimeout(options.waitMs);
    }

    const title = await page.title();
    const pageUrl = page.url();
    console.log('[browser-test] Page info:');
    console.log(`  Title: ${title}`);
    console.log(`  URL: ${pageUrl}`);
    console.log(`  Viewport: ${viewport.width}x${viewport.height}`);

    if (selectors.length > 0) {
      console.log('[browser-test] Element checks:');
      for (const selector of selectors) {
        try {
          const count = await page.locator(selector).count();
          const isVisible = count > 0 ? await page.locator(selector).first().isVisible() : false;
          const box = count > 0 ? await page.locator(selector).first().boundingBox() : null;
          console.log(`  ${selector}:`);
          console.log(`    - visible: ${isVisible}`);
          console.log(`    - count: ${count}`);
          if (box) {
            console.log(`    - box: ${box.width.toFixed(0)}x${box.height.toFixed(0)} at (${box.x}, ${box.y})`);
          }
        } catch (err) {
          console.log(`  ${selector}: not found (${err.message})`);
        }
      }
    }

    const bodyText = await page.textContent('body');
    const preview = bodyText.slice(0, 500).replace(/\s+/g, ' ').trim();
    console.log(`[browser-test] Content preview:\n  ${preview}...`);

    const screenshotPath = options.screenshot || 'browser-test.png';
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`[browser-test] Screenshot saved: ${screenshotPath}`);

    console.log('\n[browser-test] Console messages:');
    console.log(`  Total: ${consoleMessages.length}`);
    console.log(`  Errors: ${consoleErrors.length}`);
    console.log(`  Warnings: ${consoleWarnings.length}`);

    if (consoleErrors.length > 0) {
      console.log('\n[browser-test] Console errors:');
      consoleErrors.forEach(err => console.log(`  - ${err}`));
    }

    if (options.captureConsoleWarnings && consoleWarnings.length > 0) {
      console.log('\n[browser-test] Console warnings:');
      consoleWarnings.forEach(warn => console.log(`  - ${warn}`));
    }

    if (consoleErrors.length === 0) {
      console.log('\n[browser-test] No console errors detected');
    }

    console.log('\n[browser-test] Done');

  } catch (error) {
    console.error(`[browser-test] Error: ${error.message}`);
    process.exit(1);
  } finally {
    if (browser) await browser.close();
  }
}

runTests();
