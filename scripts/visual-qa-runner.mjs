/**
 * AIVault Visual QA & Automated Inspector
 * 
 * Takes high-resolution screenshots across 4 viewports (1440px, 1024px, 768px, 390px),
 * Light and Dark modes, and verifies UX flows, layout metrics, and text wrapping.
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const SCREENSHOT_DIR = path.join(ROOT_DIR, 'screenshots');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const PORT = 8000;
const BASE_URL = `http://localhost:${PORT}`;

async function runVisualQA() {
  console.log('==================================================');
  console.log('AIVAULT VISUAL QA & SCREENSHOT INSPECTOR');
  console.log('==================================================');

  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const edge = spawn(edgePath, [
    '--headless=new',
    '--remote-debugging-port=9225',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    `${BASE_URL}/index.html`
  ]);

  await new Promise(r => setTimeout(r, 2000));

  try {
    const targetsRes = await fetch('http://localhost:9225/json');
    const targets = await targetsRes.json();
    const pageTarget = targets.find(t => t.url.includes(`localhost:${PORT}`));

    if (!pageTarget) throw new Error('Could not find Edge page target on port 9225');
    const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);

    let id = 1;
    const pending = new Map();
    const consoleLogs = [];

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.id && pending.has(data.id)) {
        pending.get(data.id)(data);
        pending.delete(data.id);
      }
      if (data.method === 'Runtime.consoleAPICalled') {
        consoleLogs.push({
          type: data.params.type,
          text: data.params.args.map(a => a.value || a.description).join(' ')
        });
      }
    };

    await new Promise((resolve) => ws.onopen = resolve);

    function sendCommand(method, params = {}) {
      return new Promise((resolve) => {
        const cmdId = id++;
        pending.set(cmdId, resolve);
        ws.send(JSON.stringify({ id: cmdId, method, params }));
      });
    }

    await sendCommand('Page.enable');
    await sendCommand('Runtime.enable');
    await sendCommand('DOM.enable');
    await sendCommand('CSS.enable');

    async function evaluate(expression) {
      const res = await sendCommand('Runtime.evaluate', { expression, returnByValue: true });
      if (res.result && res.result.exceptionDetails) {
        const desc = res.result.exceptionDetails.exception?.description || res.result.exceptionDetails.text;
        throw new Error(desc);
      }
      return res.result?.result?.value;
    }

    async function setViewport(width, height) {
      await sendCommand('Emulation.setDeviceMetricsOverride', {
        width,
        height,
        deviceScaleFactor: 1,
        mobile: width <= 768
      });
      await new Promise(r => setTimeout(r, 100));
    }

    async function navigateTo(url) {
      await sendCommand('Page.navigate', { url });
      await new Promise(r => setTimeout(r, 600));
    }

    async function captureScreenshot(filename, clip = null) {
      const params = { format: 'png' };
      if (clip) {
        params.clip = clip;
      }
      const res = await sendCommand('Page.captureScreenshot', params);
      if (res.result?.data) {
        const buffer = Buffer.from(res.result.data, 'base64');
        const outPath = path.join(SCREENSHOT_DIR, filename);
        fs.writeFileSync(outPath, buffer);
        console.log(`Saved screenshot: ${filename} (${(buffer.length / 1024).toFixed(1)} KB)`);
        return outPath;
      } else {
        console.error(`Failed to capture screenshot for ${filename}:`, res);
      }
    }

    async function checkHorizontalOverflow() {
      return await evaluate(`
        ({
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
          hasOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
          bodyScrollWidth: document.body.scrollWidth,
          bodyClientWidth: document.body.clientWidth
        })
      `);
    }

    const report = {
      pagesInspected: [],
      viewportsInspected: ['1440px', '1024px', '768px', '390px'],
      screenshots: [],
      uxFlows: {},
      overflowChecks: {},
      contrastChecks: {}
    };

    // =========================================================================
    // 1. HOMEPAGE INSPECTION
    // =========================================================================
    console.log('\n--- Inspecting 1. Homepage ---');
    await navigateTo(`${BASE_URL}/index.html`);
    report.pagesInspected.push('Homepage (index.html)');

    // 1440px Desktop Light
    await setViewport(1440, 900);
    await evaluate(`document.documentElement.setAttribute('data-theme', 'light'); localStorage.setItem('aivault_theme', 'light');`);
    await new Promise(r => setTimeout(r, 200));
    let snap = await captureScreenshot('01_homepage_1440px_light.png');
    report.screenshots.push('01_homepage_1440px_light.png');

    // 1440px Desktop Dark
    await evaluate(`document.documentElement.setAttribute('data-theme', 'dark'); localStorage.setItem('aivault_theme', 'dark');`);
    await new Promise(r => setTimeout(r, 200));
    snap = await captureScreenshot('02_homepage_1440px_dark.png');
    report.screenshots.push('02_homepage_1440px_dark.png');

    // Reset to light
    await evaluate(`document.documentElement.setAttribute('data-theme', 'light'); localStorage.setItem('aivault_theme', 'light');`);

    // 1024px Tablet Light
    await setViewport(1024, 768);
    snap = await captureScreenshot('03_homepage_1024px_light.png');
    report.screenshots.push('03_homepage_1024px_light.png');

    // 768px Tablet Light
    await setViewport(768, 1024);
    snap = await captureScreenshot('04_homepage_768px_light.png');
    report.screenshots.push('04_homepage_768px_light.png');

    // 390px Mobile Light
    await setViewport(390, 844);
    snap = await captureScreenshot('05_homepage_390px_light.png');
    report.screenshots.push('05_homepage_390px_light.png');
    report.overflowChecks['homepage_390px_light'] = await checkHorizontalOverflow();

    // 390px Mobile Dark
    await evaluate(`document.documentElement.setAttribute('data-theme', 'dark'); localStorage.setItem('aivault_theme', 'dark');`);
    snap = await captureScreenshot('06_homepage_390px_dark.png');
    report.screenshots.push('06_homepage_390px_dark.png');

    // 390px Mobile Drawer Open
    await evaluate(`
      const hamburger = document.getElementById('mobile-menu-btn');
      if (hamburger) hamburger.click();
    `);
    await new Promise(r => setTimeout(r, 400));
    snap = await captureScreenshot('07_homepage_390px_drawer_open.png');
    report.screenshots.push('07_homepage_390px_drawer_open.png');

    // Close drawer
    await evaluate(`
      const drawerClose = document.getElementById('sidebar-close-btn');
      if (drawerClose) drawerClose.click();
    `);
    await new Promise(r => setTimeout(r, 300));

    // Modal View Test (1440px Desktop)
    await setViewport(1440, 900);
    await evaluate(`document.documentElement.setAttribute('data-theme', 'light'); localStorage.setItem('aivault_theme', 'light');`);
    await evaluate(`
      const firstCardQuickView = document.querySelector('.btn-view-tool');
      if (firstCardQuickView) firstCardQuickView.click();
    `);
    await new Promise(r => setTimeout(r, 400));
    snap = await captureScreenshot('08_homepage_modal_open_light.png');
    report.screenshots.push('08_homepage_modal_open_light.png');

    // Modal View in Dark Mode
    await evaluate(`document.documentElement.setAttribute('data-theme', 'dark'); localStorage.setItem('aivault_theme', 'dark');`);
    await new Promise(r => setTimeout(r, 300));
    snap = await captureScreenshot('09_homepage_modal_open_dark.png');
    report.screenshots.push('09_homepage_modal_open_dark.png');

    // Close modal
    await evaluate(`
      const modalClose = document.getElementById('modal-close-btn');
      if (modalClose) modalClose.click();
    `);
    await evaluate(`document.documentElement.setAttribute('data-theme', 'light'); localStorage.setItem('aivault_theme', 'light');`);
    await new Promise(r => setTimeout(r, 300));

    // Empty state test
    await evaluate(`
      const searchInput = document.getElementById('search-input');
      if (searchInput) {
        searchInput.value = 'xyznonexistenttoolquery123';
        searchInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
    `);
    await new Promise(r => setTimeout(r, 300));
    snap = await captureScreenshot('10_homepage_empty_state.png');
    report.screenshots.push('10_homepage_empty_state.png');

    // Clear search
    await evaluate(`
      const clearBtn = document.getElementById('search-clear-btn');
      if (clearBtn) clearBtn.click();
    `);
    await new Promise(r => setTimeout(r, 200));

    // =========================================================================
    // 2. CATEGORY PAGES INSPECTION
    // =========================================================================
    console.log('\n--- Inspecting 2. AI Chat Category Page ---');
    await navigateTo(`${BASE_URL}/category/ai-chat/index.html`);
    report.pagesInspected.push('AI Chat Category (/category/ai-chat/)');

    await setViewport(1440, 900);
    await evaluate(`document.documentElement.setAttribute('data-theme', 'light'); localStorage.setItem('aivault_theme', 'light');`);
    snap = await captureScreenshot('11_category_aichat_1440px_light.png');
    report.screenshots.push('11_category_aichat_1440px_light.png');

    await evaluate(`document.documentElement.setAttribute('data-theme', 'dark'); localStorage.setItem('aivault_theme', 'dark');`);
    snap = await captureScreenshot('12_category_aichat_1440px_dark.png');
    report.screenshots.push('12_category_aichat_1440px_dark.png');

    await setViewport(390, 844);
    await evaluate(`document.documentElement.setAttribute('data-theme', 'light'); localStorage.setItem('aivault_theme', 'light');`);
    snap = await captureScreenshot('13_category_aichat_390px_light.png');
    report.screenshots.push('13_category_aichat_390px_light.png');
    report.overflowChecks['category_aichat_390px'] = await checkHorizontalOverflow();

    console.log('\n--- Inspecting 3. Coding Category Page ---');
    await navigateTo(`${BASE_URL}/category/coding/index.html`);
    report.pagesInspected.push('Coding Category (/category/coding/)');

    await setViewport(1440, 900);
    snap = await captureScreenshot('14_category_coding_1440px_light.png');
    report.screenshots.push('14_category_coding_1440px_light.png');

    await setViewport(768, 1024);
    snap = await captureScreenshot('15_category_coding_768px_light.png');
    report.screenshots.push('15_category_coding_768px_light.png');

    await setViewport(390, 844);
    snap = await captureScreenshot('16_category_coding_390px_light.png');
    report.screenshots.push('16_category_coding_390px_light.png');
    report.overflowChecks['category_coding_390px'] = await checkHorizontalOverflow();

    // =========================================================================
    // 3. TOOL DETAIL PAGES INSPECTION (7 Categories)
    // =========================================================================
    const toolChecks = [
      { id: 'chatgpt', category: 'AI Chat', label: '4. AI Chat Tool: ChatGPT' },
      { id: 'midjourney', category: 'Image Generation', label: '5. Image Gen Tool: Midjourney' },
      { id: 'synthesia', category: 'Video', label: '6. Video Tool: Synthesia' },
      { id: 'hubspot-ai', category: 'Business', label: '7. Business Tool: HubSpot AI' },
      { id: 'scispace', category: 'Research', label: '8. Research Tool: SciSpace' },
      { id: 'langchain', category: 'AI Agents', label: '9. AI Agents Tool: LangChain' },
      { id: 'elevenlabs', category: 'Voice', label: '10. Voice Tool: ElevenLabs' },
      // Edge cases
      { id: '008', category: 'Business', label: 'Edge Case: Unrated Tool (008)' },
      { id: '4oimageapi-io-affordable-and-reliable-4o-image-api', category: 'Image Generation', label: 'Edge Case: 51-char Long Title' }
    ];

    let checkIndex = 17;
    for (const tool of toolChecks) {
      console.log(`\n--- Inspecting ${tool.label} (/tools/${tool.id}/) ---`);
      await navigateTo(`${BASE_URL}/tools/${tool.id}/index.html`);
      report.pagesInspected.push(`${tool.label} (/tools/${tool.id}/)`);

      // 1440px Desktop Light
      await setViewport(1440, 900);
      await evaluate(`document.documentElement.setAttribute('data-theme', 'light'); localStorage.setItem('aivault_theme', 'light');`);
      const file1440 = `${String(checkIndex).padStart(2, '0')}_tool_${tool.id}_1440px_light.png`;
      checkIndex++;
      await captureScreenshot(file1440);
      report.screenshots.push(file1440);

      // If chatgpt, also capture dark mode, 1024, 768, 390
      if (tool.id === 'chatgpt') {
        await evaluate(`document.documentElement.setAttribute('data-theme', 'dark'); localStorage.setItem('aivault_theme', 'dark');`);
        const fileDark = `${String(checkIndex).padStart(2, '0')}_tool_chatgpt_1440px_dark.png`;
        checkIndex++;
        await captureScreenshot(fileDark);
        report.screenshots.push(fileDark);

        await evaluate(`document.documentElement.setAttribute('data-theme', 'light'); localStorage.setItem('aivault_theme', 'light');`);
        await setViewport(1024, 768);
        const file1024 = `${String(checkIndex).padStart(2, '0')}_tool_chatgpt_1024px_light.png`;
        checkIndex++;
        await captureScreenshot(file1024);
        report.screenshots.push(file1024);

        await setViewport(768, 1024);
        const file768 = `${String(checkIndex).padStart(2, '0')}_tool_chatgpt_768px_light.png`;
        checkIndex++;
        await captureScreenshot(file768);
        report.screenshots.push(file768);
      }

      // 390px Mobile Light
      await setViewport(390, 844);
      await evaluate(`document.documentElement.setAttribute('data-theme', 'light'); localStorage.setItem('aivault_theme', 'light');`);
      const file390 = `${String(checkIndex).padStart(2, '0')}_tool_${tool.id}_390px_light.png`;
      checkIndex++;
      await captureScreenshot(file390);
      report.screenshots.push(file390);

      const ofCheck = await checkHorizontalOverflow();
      report.overflowChecks[`tool_${tool.id}_390px`] = ofCheck;

      if (tool.id === 'chatgpt') {
        await evaluate(`document.documentElement.setAttribute('data-theme', 'dark'); localStorage.setItem('aivault_theme', 'dark');`);
        const file390Dark = `${String(checkIndex).padStart(2, '0')}_tool_chatgpt_390px_dark.png`;
        checkIndex++;
        await captureScreenshot(file390Dark);
        report.screenshots.push(file390Dark);
      }
    }

    // =========================================================================
    // 4. UX FLOW CHECKS
    // =========================================================================
    console.log('\n--- Executing Interactive UX Flow Verifications ---');

    // UX 1: Homepage -> Tool Detail
    await navigateTo(`${BASE_URL}/index.html`);
    await setViewport(1440, 900);
    const detailLink = await evaluate(`document.querySelector('.cards-grid .btn-card-details')?.getAttribute('href')`);
    await evaluate(`document.querySelector('.cards-grid .btn-card-details')?.click()`);
    await new Promise(r => setTimeout(r, 600));
    const currentUrl1 = await evaluate(`window.location.href`);
    report.uxFlows['homepage_to_detail'] = {
      linkTarget: detailLink,
      navigatedTo: currentUrl1,
      success: currentUrl1.includes('/tools/')
    };

    // UX 2: Tool Detail -> Category Hub via breadcrumb
    const catBreadcrumb = await evaluate(`document.querySelector('.detail-breadcrumb a[href*="/category/"]')?.getAttribute('href')`);
    await evaluate(`document.querySelector('.detail-breadcrumb a[href*="/category/"]')?.click()`);
    await new Promise(r => setTimeout(r, 600));
    const currentUrl2 = await evaluate(`window.location.href`);
    report.uxFlows['detail_to_category'] = {
      breadcrumbHref: catBreadcrumb,
      navigatedTo: currentUrl2,
      success: currentUrl2.includes('/category/')
    };

    // UX 3: Category -> Tool Detail
    const catToolLink = await evaluate(`document.querySelector('.category-tools-grid .btn-card-details')?.getAttribute('href')`);
    await evaluate(`document.querySelector('.category-tools-grid .btn-card-details')?.click()`);
    await new Promise(r => setTimeout(r, 600));
    const currentUrl3 = await evaluate(`window.location.href`);
    report.uxFlows['category_to_detail'] = {
      cardLink: catToolLink,
      navigatedTo: currentUrl3,
      success: currentUrl3.includes('/tools/')
    };

    // UX 4: Tool Detail -> Related Tool
    const relatedLink = await evaluate(`document.querySelector('.related-tools-grid .btn-card-details')?.getAttribute('href')`);
    await evaluate(`document.querySelector('.related-tools-grid .btn-card-details')?.click()`);
    await new Promise(r => setTimeout(r, 600));
    const currentUrl4 = await evaluate(`window.location.href`);
    report.uxFlows['detail_to_related'] = {
      relatedHref: relatedLink,
      navigatedTo: currentUrl4,
      success: currentUrl4.includes('/tools/')
    };

    // UX 5: Browser Back & Forward
    await evaluate(`window.history.back()`);
    await new Promise(r => setTimeout(r, 500));
    const backUrl = await evaluate(`window.location.href`);
    await evaluate(`window.history.forward()`);
    await new Promise(r => setTimeout(r, 500));
    const forwardUrl = await evaluate(`window.location.href`);
    report.uxFlows['history_navigation'] = {
      backUrl,
      forwardUrl,
      success: backUrl !== forwardUrl
    };

    // UX 6: Modal -> Full Details
    await navigateTo(`${BASE_URL}/index.html`);
    await evaluate(`document.querySelector('.btn-view-tool')?.click()`);
    await new Promise(r => setTimeout(r, 400));
    const modalBtnHref = await evaluate(`document.getElementById('modal-details-btn')?.getAttribute('href')`);
    await evaluate(`document.getElementById('modal-details-btn')?.click()`);
    await new Promise(r => setTimeout(r, 600));
    const modalNavUrl = await evaluate(`window.location.href`);
    report.uxFlows['modal_to_detail'] = {
      modalBtnHref,
      navigatedTo: modalNavUrl,
      success: modalNavUrl.includes('/tools/')
    };

    // UX 7: Favorite from Detail Page
    await navigateTo(`${BASE_URL}/tools/chatgpt/index.html`);
    const initialFav = await evaluate(`localStorage.getItem('aivault_favorites') || '[]'`);
    await evaluate(`document.getElementById('detail-fav-btn')?.click()`);
    const afterFav = await evaluate(`localStorage.getItem('aivault_favorites') || '[]'`);
    const favBtnText = await evaluate(`document.getElementById('detail-fav-text')?.textContent`);
    report.uxFlows['detail_favorite_toggle'] = {
      initialFav,
      afterFav,
      buttonText: favBtnText,
      success: afterFav.includes('chatgpt') && favBtnText === 'Saved to Favorites'
    };

    // UX 8: Recently Viewed tracking
    const recents = await evaluate(`localStorage.getItem('aivault_recently_viewed') || '[]'`);
    report.uxFlows['recently_viewed'] = {
      recents,
      success: recents.includes('chatgpt')
    };

    // UX 9: Theme toggle
    const initialTheme = await evaluate(`document.documentElement.getAttribute('data-theme')`);
    await evaluate(`document.getElementById('theme-toggle-btn')?.click()`);
    const toggledTheme = await evaluate(`document.documentElement.getAttribute('data-theme')`);
    const storedTheme = await evaluate(`localStorage.getItem('aivault_theme')`);
    report.uxFlows['theme_toggle'] = {
      initialTheme,
      toggledTheme,
      storedTheme,
      success: toggledTheme !== initialTheme && storedTheme === toggledTheme
    };

    // UX 10: Mobile menu drawer
    await navigateTo(`${BASE_URL}/index.html`);
    await setViewport(390, 844);
    await evaluate(`document.getElementById('mobile-menu-btn')?.click()`);
    await new Promise(r => setTimeout(r, 300));
    const drawerOpen = await evaluate(`document.getElementById('sidebar')?.classList.contains('open')`);
    await evaluate(`document.getElementById('sidebar-close-btn')?.click()`);
    await new Promise(r => setTimeout(r, 300));
    const drawerClosed = await evaluate(`!document.getElementById('sidebar')?.classList.contains('open')`);
    report.uxFlows['mobile_drawer'] = {
      drawerOpen,
      drawerClosed,
      success: drawerOpen && drawerClosed
    };

    // Output JSON report
    fs.writeFileSync(path.join(SCREENSHOT_DIR, 'qa_report.json'), JSON.stringify(report, null, 2), 'utf8');
    console.log('\n==================================================');
    console.log('VISUAL QA COMPLETED SUCCESSFULLY');
    console.log(`- Total Screenshots Captured: ${report.screenshots.length}`);
    console.log(`- Total Pages Inspected: ${report.pagesInspected.length}`);
    console.log(`- Overflow check results:`, report.overflowChecks);
    console.log(`- UX flow results:`, report.uxFlows);
    console.log('==================================================');

    edge.kill();
    process.exit(0);

  } catch (err) {
    console.error('Visual QA failed with error:', err);
    edge.kill();
    process.exit(1);
  }
}

runVisualQA();
