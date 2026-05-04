// ── AI ASSISTANT Content Script — pure DOM, no backend ───────

(function () {
  'use strict';

  // ── Listen for commands from popup ───────────────────────────
  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg.type !== 'AI_ASSISTANT_CMD') return;
    const result = runCommand(msg.text);
    sendResponse(result);
    showToast(result.result || result.error);
    return true;
  });

  // ── Command router ────────────────────────────────────────────
  function runCommand(text) {
    const t = text.toLowerCase().trim();

    // ── LOGIN FORM COMMANDS ──────────────────────────────────────
    // Enter email/mobile
    if (/enter email|type email|fill email/.test(t)) {
      const email = extractValue(text, ['enter email', 'type email', 'fill email', 'email']);
      return doEnterEmail(email);
    }
    
    if (/enter mobile|type mobile|enter phone|type phone|fill mobile|fill phone/.test(t)) {
      const mobile = extractValue(text, ['enter mobile', 'type mobile', 'enter phone', 'type phone', 'fill mobile', 'fill phone', 'mobile', 'phone']);
      return doEnterMobile(mobile);
    }

    // Enter password
    if (/enter password|type password|fill password/.test(t)) {
      const password = extractValue(text, ['enter password', 'type password', 'fill password', 'password']);
      return doEnterPassword(password);
    }

    // Click continue/login/sign in
    if (/click continue|press continue|continue button/.test(t)) return doClickContinue();
    if (/click login|click sign in|press login|press sign in/.test(t)) return doClickLogin();
    if (/submit form|submit/.test(t)) return doSubmitForm();

    // Focus on specific field
    if (/focus email|click email|select email/.test(t)) return doFocusField('email');
    if (/focus mobile|click mobile|focus phone|click phone/.test(t)) return doFocusField('mobile');
    if (/focus password|click password|select password/.test(t)) return doFocusField('password');

    // Clear field
    if (/clear email/.test(t)) return doClearField('email');
    if (/clear mobile|clear phone/.test(t)) return doClearField('mobile');
    if (/clear password/.test(t)) return doClearField('password');

    // ── EXISTING COMMANDS ─────────────────────────────────────────
    // Search
    if (/search|find|look for|show me/.test(t)) return doSearch(t, text);

    // Cart
    if (/add to cart|add to bag|buy now/.test(t)) return doAddCart();
    if (/remove from cart|delete from cart/.test(t)) return doRemoveCart();

    // Checkout
    if (/checkout|place order|proceed to pay/.test(t)) return doCheckout();

    // Scroll
    if (/scroll down|go down/.test(t)) return doScroll(600);
    if (/scroll up|go up/.test(t)) return doScroll(-600);
    if (/scroll top|top of page/.test(t)) { window.scrollTo({top:0,behavior:'smooth'}); return ok('⬆ Scrolled to top'); }
    if (/scroll bottom|bottom of page/.test(t)) { window.scrollTo({top:document.body.scrollHeight,behavior:'smooth'}); return ok('⬇ Scrolled to bottom'); }

    // Navigation
    if (/go back|go previous/.test(t)) { history.back(); return ok('🔙 Going back'); }
    if (/go forward/.test(t)) { history.forward(); return ok('🔜 Going forward'); }
    if (/refresh|reload/.test(t)) { location.reload(); return ok('🔄 Refreshing…'); }

    // Filter / Sort
    if (/filter by price|sort by price|price low|low to high/.test(t)) return doFilter('price_low');
    if (/high to low|sort expensive/.test(t)) return doFilter('price_high');
    if (/sort by rating|best rated|top rated/.test(t)) return doFilter('rating');
    if (/sort by newest|new arrival/.test(t)) return doFilter('newest');

    // Click specific elements
    if (/click (next|next page)/.test(t)) return doClickText(['Next','Next Page','>','›']);
    if (/click (prev|previous)/.test(t)) return doClickText(['Prev','Previous','<','‹']);
    if (/open (first|top) product/.test(t)) return doClickFirstProduct();
    if (/open cart|view cart/.test(t)) return doClickText(['Cart','View Cart','My Cart','Bag']);
    if (/open wishlist/.test(t)) return doClickText(['Wishlist','Wish List','Saved']);
    if (/open orders|my orders/.test(t)) return doClickText(['Orders','My Orders','Order History']);
    if (/open account|my account|profile/.test(t)) return doClickText(['Account','My Account','Profile','Login']);
    if (/open home|go home/.test(t)) { window.location.href = window.location.origin; return ok('🏠 Going home'); }

    // Quantity
    const qtyMatch = t.match(/(?:set quantity|quantity|change quantity|update quantity)\s+(?:to\s+)?(\d+)/);
    if (qtyMatch) return doSetQuantity(parseInt(qtyMatch[1]));

    // Pincode / Location
    const pinMatch = t.match(/(?:set|enter|change)\s+(?:pincode|pin code|location)\s+(?:to\s+)?(\d{6})/);
    if (pinMatch) return doPincode(pinMatch[1]);

    // Zoom
    if (/zoom in/.test(t)) { document.body.style.zoom = (parseFloat(document.body.style.zoom||1)+0.1)+''; return ok('🔍 Zoomed in'); }
    if (/zoom out/.test(t)) { document.body.style.zoom = (parseFloat(document.body.style.zoom||1)-0.1)+''; return ok('🔎 Zoomed out'); }

    return err(`❓ Command not recognised: "${text}"`);
  }

  // ── LOGIN FORM ACTIONS ────────────────────────────────────────

  function doEnterEmail(email) {
    if (!email) return err('📧 Please specify an email address');
    
    const selectors = [
      'input[type="email"]',
      'input[name*="email" i]',
      'input[id*="email" i]',
      'input[placeholder*="email" i]',
      'input[autocomplete="email"]',
      'input[name="username"]',
      'input[type="text"]',
    ];

    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && isVisible(el)) {
        el.focus();
        el.value = email;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        return ok(`📧 Email entered: ${email}`);
      }
    }
    return err('📧 Email field not found');
  }

  function doEnterMobile(mobile) {
    if (!mobile) return err('📱 Please specify a mobile number');
    
    const selectors = [
      'input[type="tel"]',
      'input[name*="mobile" i]',
      'input[name*="phone" i]',
      'input[id*="mobile" i]',
      'input[id*="phone" i]',
      'input[placeholder*="mobile" i]',
      'input[placeholder*="phone" i]',
      'input[autocomplete="tel"]',
      'input[type="text"]',
    ];

    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && isVisible(el)) {
        el.focus();
        el.value = mobile;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        return ok(`📱 Mobile entered: ${mobile}`);
      }
    }
    return err('📱 Mobile field not found');
  }

  function doEnterPassword(password) {
    if (!password) return err('🔒 Please specify a password');
    
    const selectors = [
      'input[type="password"]',
      'input[name*="password" i]',
      'input[id*="password" i]',
      'input[placeholder*="password" i]',
      'input[autocomplete="current-password"]',
    ];

    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && isVisible(el)) {
        el.focus();
        el.value = password;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        return ok(`🔒 Password entered`);
      }
    }
    return err('🔒 Password field not found');
  }

  function doClickContinue() {
    const btn = findByText(
      ['Continue', 'Next', 'Proceed', 'Submit'],
      'button, input[type="submit"], [role="button"], a'
    );
    if (btn) { btn.click(); return ok('✅ Clicked Continue'); }
    return err('❌ Continue button not found');
  }

  function doClickLogin() {
    const btn = findByText(
      ['Sign In', 'Login', 'Log In', 'Sign in', 'Submit'],
      'button, input[type="submit"], [role="button"], a'
    );
    if (btn) { btn.click(); return ok('✅ Clicked Login'); }
    return err('❌ Login button not found');
  }

  function doSubmitForm() {
    const form = document.querySelector('form');
    if (form) { 
      form.submit(); 
      return ok('✅ Form submitted'); 
    }
    return err('❌ No form found on page');
  }

  function doFocusField(type) {
    let selectors = [];
    if (type === 'email') {
      selectors = ['input[type="email"]', 'input[name*="email" i]', 'input[id*="email" i]'];
    } else if (type === 'mobile') {
      selectors = ['input[type="tel"]', 'input[name*="mobile" i]', 'input[name*="phone" i]'];
    } else if (type === 'password') {
      selectors = ['input[type="password"]'];
    }

    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && isVisible(el)) {
        el.focus();
        el.select();
        return ok(`📍 Focused on ${type} field`);
      }
    }
    return err(`📍 ${type} field not found`);
  }

  function doClearField(type) {
    let selectors = [];
    if (type === 'email') {
      selectors = ['input[type="email"]', 'input[name*="email" i]'];
    } else if (type === 'mobile') {
      selectors = ['input[type="tel"]', 'input[name*="mobile" i]', 'input[name*="phone" i]'];
    } else if (type === 'password') {
      selectors = ['input[type="password"]'];
    }

    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && isVisible(el)) {
        el.value = '';
        el.dispatchEvent(new Event('input', { bubbles: true }));
        return ok(`🗑 Cleared ${type} field`);
      }
    }
    return err(`🗑 ${type} field not found`);
  }

  // ── EXISTING ACTIONS ──────────────────────────────────────────

  function doSearch(lower, original) {
    const q = original
      .replace(/search for|find|look for|show me/gi, '')
      .replace(/^[\s,]+/, '').trim();

    const selectors = [
      'input[type="search"]',
      'input[name="q"]',
      'input[name="search"]',
      'input[id*="search" i]',
      'input[placeholder*="search" i]',
      'input[class*="search" i]',
      'input[type="text"]',
    ];

    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && el.offsetParent !== null) {
        el.focus();
        el.value = q;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        const form = el.closest('form');
        if (form) {
          setTimeout(() => form.submit(), 200);
        } else {
          el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', keyCode: 13, bubbles: true }));
          el.dispatchEvent(new KeyboardEvent('keypress', { key: 'Enter', keyCode: 13, bubbles: true }));
          el.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', keyCode: 13, bubbles: true }));
        }
        return ok(`🔍 Searching: "${q}"`);
      }
    }
    return err('🔍 No search box found on this page');
  }

  function doAddCart() {
    const patterns = [
      /add to cart/i, /add to bag/i, /buy now/i,
      /add to basket/i, /add now/i,
    ];
    const btns = [...document.querySelectorAll('button, [role="button"], input[type="submit"], a')];
    for (const pat of patterns) {
      const btn = btns.find(b => pat.test(b.textContent?.trim()) && isVisible(b));
      if (btn) { btn.click(); return ok('🛒 Added to cart!'); }
    }
    return err('🛒 No "Add to Cart" button found');
  }

  function doRemoveCart() {
    const btn = findByText(['Remove','Delete','×','✕'], 'button, a, [role="button"]');
    if (btn) { btn.click(); return ok('🗑 Removed from cart'); }
    return err('🗑 No remove button found');
  }

  function doCheckout() {
    const btn = findByText(
      ['Proceed to Checkout','Checkout','Place Order','Buy Now','Continue','Proceed to Pay'],
      'button, a, [role="button"]'
    );
    if (btn) { btn.click(); return ok('✅ Proceeding to checkout…'); }
    return err('✅ Checkout button not found on this page');
  }

  function doScroll(by) {
    window.scrollBy({ top: by, behavior: 'smooth' });
    return ok(by > 0 ? '⬇ Scrolled down' : '⬆ Scrolled up');
  }

  function doFilter(type) {
    const selects = [...document.querySelectorAll('select')];
    for (const sel of selects) {
      const opts = [...sel.options];
      let match = null;
      if (type === 'price_low')  match = opts.find(o => /low|ascending|price.*low/i.test(o.text));
      if (type === 'price_high') match = opts.find(o => /high|descending|price.*high/i.test(o.text));
      if (type === 'rating')     match = opts.find(o => /rating|review|top/i.test(o.text));
      if (type === 'newest')     match = opts.find(o => /new|recent|latest/i.test(o.text));
      if (match) {
        sel.value = match.value;
        sel.dispatchEvent(new Event('change', { bubbles: true }));
        return ok(`🔧 Sorted: ${match.text}`);
      }
    }
    const labels = {
      price_low:  ['Price: Low to High','Low to High','Lowest Price'],
      price_high: ['Price: High to Low','High to Low','Highest Price'],
      rating:     ['Avg. Customer Review','Rating','Top Rated','Popularity'],
      newest:     ['Newest Arrivals','New Arrivals','Latest'],
    };
    const btn = findByText(labels[type] || [], 'a, button, [role="option"], li, span');
    if (btn) { btn.click(); return ok(`🔧 Filter applied`); }
    return err(`🔧 Filter option not found on this page`);
  }

  function doClickFirstProduct() {
    const selectors = [
      '[data-component-type="s-search-result"] a',
      '.product-title a', '.s-product-image-container a',
      'article a', '.product-item a',
      '._1AtVbE a', '.CXW8mj a',
      '[class*="product"] a',
    ];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && isVisible(el)) { el.click(); return ok('📦 Opened first product'); }
    }
    return err('📦 No product found on this page');
  }

  function doClickText(texts, selectors = 'button, a, [role="button"], li, span') {
    const btn = findByText(texts, selectors);
    if (btn) { btn.click(); return ok(`✅ Clicked: ${btn.textContent?.trim()}`); }
    return err(`❌ Could not find: ${texts[0]}`);
  }

  function doSetQuantity(n) {
    const inputs = [...document.querySelectorAll('input[type="number"], select[class*="qty" i], select[name*="quantity" i], input[class*="qty" i]')];
    if (inputs[0]) {
      inputs[0].value = n;
      inputs[0].dispatchEvent(new Event('change', { bubbles: true }));
      return ok(`🔢 Quantity set to ${n}`);
    }
    return err('🔢 Quantity input not found');
  }

  function doPincode(pin) {
    const el = document.querySelector('input[placeholder*="pincode" i], input[placeholder*="pin" i], input[id*="pincode" i]');
    if (el) {
      el.focus(); el.value = pin;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', keyCode: 13, bubbles: true }));
      return ok(`📍 Pincode set to ${pin}`);
    }
    return err('📍 Pincode input not found');
  }

  // ── Helpers ───────────────────────────────────────────────────

  function extractValue(text, prefixes) {
    for (const prefix of prefixes) {
      const regex = new RegExp(prefix + '\\s+(.+)', 'i');
      const match = text.match(regex);
      if (match) return match[1].trim();
    }
    return null;
  }

  function findByText(texts, selectors) {
    const els = [...document.querySelectorAll(selectors)];
    for (const text of texts) {
      const el = els.find(e => {
        const t = e.textContent?.trim();
        return t && (t === text || t.toLowerCase().includes(text.toLowerCase())) && isVisible(e);
      });
      if (el) return el;
    }
    return null;
  }

  function isVisible(el) {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && window.getComputedStyle(el).visibility !== 'hidden';
  }

  function ok(msg)  { return { result: msg }; }
  function err(msg) { return { error: msg };  }

  // ── Toast notification ────────────────────────────────────────
  function showToast(msg) {
    const existing = document.getElementById('ai-assistant-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'ai-assistant-toast';
    toast.textContent = msg;
    Object.assign(toast.style, {
      position:     'fixed',
      bottom:       '24px',
      left:         '50%',
      transform:    'translateX(-50%) translateY(10px)',
      background:   '#0d1117',
      color:        '#e8edf3',
      border:       '1px solid rgba(0,255,178,0.3)',
      borderRadius: '10px',
      padding:      '10px 18px',
      fontFamily:   'monospace',
      fontSize:     '13px',
      zIndex:       '2147483647',
      boxShadow:    '0 4px 24px rgba(0,0,0,0.5)',
      transition:   'all 0.3s ease',
      maxWidth:     '320px',
      textAlign:    'center',
      lineHeight:   '1.5',
    });
    document.body.appendChild(toast);
    requestAnimationFrame(() => {
      toast.style.transform = 'translateX(-50%) translateY(0)';
      toast.style.opacity = '1';
    });
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(-50%) translateY(10px)';
      setTimeout(() => toast.remove(), 400);
    }, 3000);
  }

})();