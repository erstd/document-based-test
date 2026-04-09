#!/usr/bin/env node
/**
 * browser-actions.js
 * 前端交互测试脚本 - 支持点击、输入、悬停等操作
 *
 * Usage:
 *     node browser-actions.js <url> <action> [args...]
 *     node browser-actions.js http://localhost:3000 click "button#submit"
 *     node browser-actions.js http://localhost:3000 type "input[name=q]" "search text"
 *     node browser-actions.js http://localhost:3000 screenshot "my-screenshot.png"
 *
 * Actions:
 *     click <selector>              Click element
 *     type <selector> <text>        Fill input field
 *     hover <selector>              Hover over element
 *     wait <selector> [timeout]      Wait for element to appear (default timeout: 5000ms)
 *     screenshot [filename]          Take screenshot (default: action-result.png)
 *     evaluate <js>                 Execute JavaScript expression
 *     get <selector>                 Get element text content
 *     exists <selector>              Check if element exists
 *     assert <selector> <property> <expected>  Assert element property matches expected
 *     scroll <x> <y>                Scroll to position
 *     select <selector> <value>      Select option in dropdown
 */

const { chromium } = require('playwright');

async function runAction() {
  const args = process.argv.slice(2);
  const url = args[0];
  const action = args[1];

  if (!url || !action) {
    console.error('Usage: node browser-actions.js <url> <action> [args...]');
    console.error('Actions: click, type, hover, wait, screenshot, evaluate, get, exists, assert, scroll, select');
    process.exit(1);
  }

  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1280, height: 720 });

    console.log(`[browser-actions] Navigating to: ${url}`);
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

    const screenshotPath = 'action-result.png';

    const actionLower = action.toLowerCase();

    switch (actionLower) {
      case 'click': {
        const selector = args[2];
        await page.click(selector);
        console.log(`[browser-actions] Clicked: ${selector}`);
        break;
      }
      case 'type': {
        const selector = args[2];
        const text = args.slice(3).join(' ');
        await page.fill(selector, text);
        console.log(`[browser-actions] Typed "${text}" into: ${selector}`);
        break;
      }
      case 'hover': {
        const selector = args[2];
        await page.hover(selector);
        console.log(`[browser-actions] Hovered: ${selector}`);
        break;
      }
      case 'wait': {
        const selector = args[2];
        const timeout = args[3] ? parseInt(args[3], 10) : 5000;
        await page.waitForSelector(selector, { timeout });
        console.log(`[browser-actions] Element appeared: ${selector}`);
        break;
      }
      case 'screenshot': {
        const filename = args[2] || screenshotPath;
        await page.screenshot({ path: filename, fullPage: true });
        console.log(`[browser-actions] Screenshot saved: ${filename}`);
        break;
      }
      case 'evaluate': {
        const js = args.slice(2).join(' ');
        const result = await page.evaluate(js);
        console.log(`[browser-actions] Result: ${JSON.stringify(result)}`);
        return result;
      }
      case 'get': {
        const selector = args[2];
        const text = await page.textContent(selector);
        console.log(`[browser-actions] Text content: ${text}`);
        return text;
      }
      case 'exists': {
        const selector = args[2];
        const count = await page.locator(selector).count();
        const exists = count > 0;
        console.log(`[browser-actions] ${selector}: ${exists ? 'exists' : 'not found'} (${count})`);
        return exists;
      }
      case 'assert': {
        const selector = args[2];
        const property = args[3];
        const expected = args[4];
        const count = await page.locator(selector).count();

        if (count === 0) {
          throw new Error(`Assertion failed: element ${selector} not found`);
        }

        let actual;
        switch (property) {
          case 'text':
            actual = await page.textContent(selector);
            break;
          case 'value':
            actual = await page.inputValue(selector);
            break;
          case 'visible':
            actual = await page.locator(selector).first().isVisible();
            break;
          case 'hidden':
            actual = !(await page.locator(selector).first().isVisible());
            break;
          case 'checked':
            actual = await page.isChecked(selector);
            break;
          case 'enabled':
            actual = !(await page.locator(selector).first().isDisabled());
            break;
          case 'disabled':
            actual = await page.locator(selector).first().isDisabled();
            break;
          case 'count':
            actual = count;
            break;
          default:
            throw new Error(`Unknown property: ${property}`);
        }

        const actualStr = String(actual);
        const passed = actualStr === expected;

        console.log(`[browser-actions] Assert: ${selector}.${property}`);
        console.log(`  Expected: ${expected}`);
        console.log(`  Actual: ${actualStr}`);
        console.log(`  Result: ${passed ? 'PASSED' : 'FAILED'}`);

        if (!passed) {
          throw new Error(`Assertion failed: expected "${expected}" but got "${actualStr}"`);
        }
        break;
      }
      case 'scroll': {
        const x = parseInt(args[2], 10) || 0;
        const y = parseInt(args[3], 10) || 0;
        await page.evaluate(([x, y]) => window.scrollTo(x, y), [x, y]);
        console.log(`[browser-actions] Scrolled to: (${x}, ${y})`);
        break;
      }
      case 'select': {
        const selector = args[2];
        const value = args[3];
        await page.selectOption(selector, value);
        console.log(`[browser-actions] Selected "${value}" in: ${selector}`);
        break;
      }
      default:
        console.error(`Unknown action: ${action}`);
        console.error('Actions: click, type, hover, wait, screenshot, evaluate, get, exists, assert, scroll, select');
        process.exit(1);
    }

    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`[browser-actions] Screenshot saved: ${screenshotPath}`);

  } catch (error) {
    console.error(`[browser-actions] Error: ${error.message}`);
    process.exit(1);
  } finally {
    if (browser) await browser.close();
  }
}

runAction();
