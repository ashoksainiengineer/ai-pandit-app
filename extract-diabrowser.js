const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  console.log('Navigating to diabrowser.com...');
  await page.goto('https://www.diabrowser.com/', { waitUntil: 'networkidle', timeout: 60000 });
  
  // Wait a bit more for any lazy-loaded content
  await page.waitForTimeout(3000);

  const outputDir = '/tmp/opencode/diabrowser-data';
  const screenshotDir = '/tmp/opencode/diabrowser-screenshots';

  // 1. Take screenshots at different scroll positions
  const scrollPositions = [0, 800, 1600, 2400, 3200, 4000, 4800];
  console.log('Taking screenshots...');
  for (const scrollY of scrollPositions) {
    await page.evaluate((y) => window.scrollTo(0, y), scrollY);
    await page.waitForTimeout(500);
    const ssPath = path.join(screenshotDir, `screenshot-${scrollY}px.png`);
    await page.screenshot({ path: ssPath, fullPage: false });
    console.log(`Screenshot saved: ${ssPath}`);
  }

  // Also take a full-page screenshot
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(screenshotDir, 'screenshot-fullpage.png'), fullPage: true });
  console.log('Full-page screenshot saved');

  // 2. Extract computed styles for key elements
  console.log('Extracting computed styles...');
  const selectors = [
    'html',
    'body',
    'h1', 'h2', 'h3',
    'p',
    'a',
    'button',
    'nav', 'header',
    'footer',
    '[class*="card"]', '[class*="Card"]',
    '[class*="badge"]', '[class*="Badge"]', '[class*="pill"]', '[class*="Pill"]',
    '[class*="btn"]', '[class*="Btn"]', '[class*="button"]', '[class*="Button"]',
    '[class*="cta"]', '[class*="CTA"]',
    'section',
    'div[class*="hero"]', 'div[class*="Hero"]',
    'div[class*="feature"]', 'div[class*="Feature"]'
  ];

  const computedStyles = {};
  const propertiesToExtract = [
    'font-family', 'font-size', 'font-weight', 'line-height', 'letter-spacing',
    'color', 'background-color', 'background-image',
    'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
    'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
    'border-radius', 'border-top-left-radius', 'border-top-right-radius',
    'border-bottom-left-radius', 'border-bottom-right-radius',
    'border', 'border-top', 'border-right', 'border-bottom', 'border-left',
    'border-color', 'border-width', 'border-style',
    'box-shadow', 'text-shadow',
    'display', 'position', 'top', 'right', 'bottom', 'left',
    'width', 'height', 'max-width', 'min-width',
    'gap', 'grid-gap', 'column-gap', 'row-gap',
    'flex-direction', 'align-items', 'justify-content',
    'text-align', 'text-transform', 'text-decoration',
    'opacity', 'transform', 'transition',
    'z-index', 'overflow'
  ];

  for (const selector of selectors) {
    try {
      const elements = await page.locator(selector).all();
      if (elements.length > 0) {
        computedStyles[selector] = [];
        // Limit to first 5 elements per selector to avoid huge output
        for (let i = 0; i < Math.min(elements.length, 5); i++) {
          const el = elements[i];
          const styles = await el.evaluate((node, props) => {
            const cs = window.getComputedStyle(node);
            const result = {};
            props.forEach(prop => {
              const val = cs.getPropertyValue(prop);
              if (val && val !== 'none' && val !== 'auto' && val !== '0px' && val !== 'normal' && val !== 'rgba(0, 0, 0, 0)') {
                result[prop] = val;
              }
            });
            // Also get class names and tag name
            result._tagName = node.tagName.toLowerCase();
            result._className = node.className;
            result._id = node.id;
            return result;
          }, propertiesToExtract);
          computedStyles[selector].push(styles);
        }
      }
    } catch (e) {
      console.log(`Error with selector ${selector}: ${e.message}`);
    }
  }

  fs.writeFileSync(path.join(outputDir, 'computed-styles.json'), JSON.stringify(computedStyles, null, 2));

  // 3. Extract ALL stylesheet contents
  console.log('Extracting stylesheets...');
  const stylesheetData = await page.evaluate(() => {
    const result = {
      inlineStyles: [],
      externalStylesheets: [],
      fontFaces: [],
      keyframes: [],
      googleFonts: [],
      allColors: new Set(),
      allFontFamilies: new Set(),
      allBorderRadius: new Set(),
      allBoxShadows: new Set(),
      allTransitions: new Set(),
      allAnimations: new Set()
    };

    // Check for Google Fonts or other font links
    document.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
      const href = link.getAttribute('href') || '';
      if (href.includes('fonts.googleapis') || href.includes('fonts.gstatic') || href.includes('font')) {
        result.googleFonts.push(href);
      }
      result.externalStylesheets.push(href);
    });

    // Check for preconnect hints (often used with Google Fonts)
    document.querySelectorAll('link[rel="preconnect"]').forEach(link => {
      result.externalStylesheets.push(`preconnect: ${link.getAttribute('href')}`);
    });

    // Check for font script tags
    document.querySelectorAll('script').forEach(script => {
      const src = script.getAttribute('src') || '';
      if (src.includes('font') || src.includes('webfont')) {
        result.googleFonts.push(`script: ${src}`);
      }
    });

    // Get inline style tags
    document.querySelectorAll('style').forEach(style => {
      result.inlineStyles.push(style.textContent);
    });

    // Parse all CSS rules from document.stylesheets
    try {
      for (const sheet of document.styleSheets) {
        try {
          const rules = sheet.cssRules || sheet.rules;
          for (const rule of rules) {
            const cssText = rule.cssText;
            
            // Extract @font-face
            if (rule.type === CSSRule.FONT_FACE_RULE) {
              result.fontFaces.push(cssText);
            }
            
            // Extract @keyframes
            if (rule.type === CSSRule.KEYFRAMES_RULE || rule.type === CSSRule.KEYFRAME_RULE) {
              result.keyframes.push(cssText);
            }

            // Extract colors using regex
            const colorMatches = cssText.match(/(#[0-9a-fA-F]{3,8}|rgb[a]?\([^)]+\)|hsl[a]?\([^)]+\))/g);
            if (colorMatches) {
              colorMatches.forEach(c => result.allColors.add(c));
            }

            // Extract font families
            const fontMatches = cssText.match(/font-family\s*:\s*([^;]+)/gi);
            if (fontMatches) {
              fontMatches.forEach(f => result.allFontFamilies.add(f));
            }

            // Extract border-radius
            const radiusMatches = cssText.match(/border-radius\s*:\s*([^;]+)/gi);
            if (radiusMatches) {
              radiusMatches.forEach(r => result.allBorderRadius.add(r));
            }

            // Extract box-shadow
            const shadowMatches = cssText.match(/box-shadow\s*:\s*([^;]+)/gi);
            if (shadowMatches) {
              shadowMatches.forEach(s => result.allBoxShadows.add(s));
            }

            // Extract transitions
            const transMatches = cssText.match(/transition\s*:\s*([^;]+)/gi);
            if (transMatches) {
              transMatches.forEach(t => result.allTransitions.add(t));
            }

            // Extract animations
            const animMatches = cssText.match(/animation\s*:\s*([^;]+)/gi);
            if (animMatches) {
              animMatches.forEach(a => result.allAnimations.add(a));
            }
          }
        } catch (e) {
          // Cross-origin stylesheet - can't access rules
          result.externalStylesheets.push(`CROSS_ORIGIN: ${sheet.href}`);
        }
      }
    } catch (e) {
      console.error('Error parsing stylesheets:', e);
    }

    // Also scan all elements for computed colors and fonts
    const allElements = document.querySelectorAll('*');
    allElements.forEach(el => {
      const cs = window.getComputedStyle(el);
      const color = cs.color;
      const bgColor = cs.backgroundColor;
      const fontFamily = cs.fontFamily;
      
      if (color && color !== 'rgba(0, 0, 0, 0)') result.allColors.add(`computed-color: ${color}`);
      if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)') result.allColors.add(`computed-bg: ${bgColor}`);
      if (fontFamily) result.allFontFamilies.add(`computed: ${fontFamily}`);
    });

    // Convert Sets to Arrays for JSON serialization
    return {
      ...result,
      allColors: Array.from(result.allColors),
      allFontFamilies: Array.from(result.allFontFamilies),
      allBorderRadius: Array.from(result.allBorderRadius),
      allBoxShadows: Array.from(result.allBoxShadows),
      allTransitions: Array.from(result.allTransitions),
      allAnimations: Array.from(result.allAnimations)
    };
  });

  fs.writeFileSync(path.join(outputDir, 'stylesheet-data.json'), JSON.stringify(stylesheetData, null, 2));

  // 4. Extract specific element types by scanning the page structure
  console.log('Extracting page structure...');
  const pageStructure = await page.evaluate(() => {
    const structure = {
      sections: [],
      buttons: [],
      cards: [],
      navItems: [],
      headings: [],
      paragraphs: []
    };

    // Get all sections with their classes
    document.querySelectorAll('section').forEach((sec, i) => {
      const rect = sec.getBoundingClientRect();
      const cs = window.getComputedStyle(sec);
      structure.sections.push({
        index: i,
        tagName: sec.tagName,
        className: sec.className,
        id: sec.id,
        rect: { width: rect.width, height: rect.height, top: rect.top + window.scrollY },
        backgroundColor: cs.backgroundColor,
        backgroundImage: cs.backgroundImage,
        padding: cs.padding,
        margin: cs.margin
      });
    });

    // Get buttons
    document.querySelectorAll('button, a[class*="btn"], a[class*="button"], [role="button"]').forEach((btn, i) => {
      const cs = window.getComputedStyle(btn);
      structure.buttons.push({
        index: i,
        text: btn.textContent.trim().substring(0, 50),
        className: btn.className,
        tagName: btn.tagName,
        backgroundColor: cs.backgroundColor,
        color: cs.color,
        padding: cs.padding,
        borderRadius: cs.borderRadius,
        fontSize: cs.fontSize,
        fontWeight: cs.fontWeight,
        boxShadow: cs.boxShadow,
        border: cs.border
      });
    });

    // Get cards (divs with card-like classes)
    document.querySelectorAll('[class*="card"], [class*="Card"]').forEach((card, i) => {
      const cs = window.getComputedStyle(card);
      structure.cards.push({
        index: i,
        className: card.className,
        backgroundColor: cs.backgroundColor,
        color: cs.color,
        padding: cs.padding,
        borderRadius: cs.borderRadius,
        boxShadow: cs.boxShadow,
        border: cs.border,
        width: cs.width,
        height: cs.height
      });
    });

    // Get nav items
    document.querySelectorAll('nav a, header a, [class*="nav"] a').forEach((item, i) => {
      const cs = window.getComputedStyle(item);
      structure.navItems.push({
        index: i,
        text: item.textContent.trim(),
        className: item.className,
        color: cs.color,
        fontSize: cs.fontSize,
        fontWeight: cs.fontWeight,
        textDecoration: cs.textDecoration
      });
    });

    // Get headings
    document.querySelectorAll('h1, h2, h3').forEach((h, i) => {
      const cs = window.getComputedStyle(h);
      structure.headings.push({
        index: i,
        tagName: h.tagName,
        text: h.textContent.trim().substring(0, 100),
        className: h.className,
        color: cs.color,
        fontSize: cs.fontSize,
        fontWeight: cs.fontWeight,
        lineHeight: cs.lineHeight,
        letterSpacing: cs.letterSpacing,
        margin: cs.margin,
        fontFamily: cs.fontFamily
      });
    });

    // Get paragraphs
    document.querySelectorAll('p').forEach((p, i) => {
      if (i < 20) { // limit to first 20
        const cs = window.getComputedStyle(p);
        structure.paragraphs.push({
          index: i,
          text: p.textContent.trim().substring(0, 150),
          className: p.className,
          color: cs.color,
          fontSize: cs.fontSize,
          lineHeight: cs.lineHeight,
          fontFamily: cs.fontFamily,
          margin: cs.margin
        });
      }
    });

    return structure;
  });

  fs.writeFileSync(path.join(outputDir, 'page-structure.json'), JSON.stringify(pageStructure, null, 2));

  // 5. Extract spacing tokens by analyzing common values
  console.log('Extracting spacing and layout values...');
  const spacingData = await page.evaluate(() => {
    const spacing = {
      margins: new Set(),
      paddings: new Set(),
      gaps: new Set(),
      widths: new Set(),
      heights: new Set(),
      fontSizes: new Set(),
      borderRadius: new Set()
    };

    document.querySelectorAll('*').forEach(el => {
      const cs = window.getComputedStyle(el);
      if (cs.margin) spacing.margins.add(cs.margin);
      if (cs.padding) spacing.paddings.add(cs.padding);
      if (cs.gap) spacing.gaps.add(cs.gap);
      if (cs.width && cs.width !== 'auto' && cs.width !== '0px') spacing.widths.add(cs.width);
      if (cs.height && cs.height !== 'auto' && cs.height !== '0px') spacing.heights.add(cs.height);
      if (cs.fontSize) spacing.fontSizes.add(cs.fontSize);
      if (cs.borderRadius) spacing.borderRadius.add(cs.borderRadius);
    });

    return {
      margins: Array.from(spacing.margins).slice(0, 50),
      paddings: Array.from(spacing.paddings).slice(0, 50),
      gaps: Array.from(spacing.gaps).slice(0, 30),
      widths: Array.from(spacing.widths).slice(0, 30),
      heights: Array.from(spacing.heights).slice(0, 30),
      fontSizes: Array.from(spacing.fontSizes).slice(0, 30),
      borderRadius: Array.from(spacing.borderRadius).slice(0, 30)
    };
  });

  fs.writeFileSync(path.join(outputDir, 'spacing-data.json'), JSON.stringify(spacingData, null, 2));

  await browser.close();
  console.log('Extraction complete!');
  console.log(`Screenshots: ${screenshotDir}`);
  console.log(`Data: ${outputDir}`);
})();
