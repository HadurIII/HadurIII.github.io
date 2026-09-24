const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const css = fs.readFileSync(path.join(root, "styles.css"), "utf8");

function test(name, fn) {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`not ok - ${name}`);
    console.error(error);
    process.exitCode = 1;
  }
}

function includesText(text, expected) {
  assert.ok(text.includes(expected), `Expected to find: ${expected}`);
}

test("index.html defines desktop and mobile advertising slots", () => {
  includesText(html, '<div class="page-frame">');
  includesText(html, '<aside class="ad-slot ad-slot-left" aria-label="Publicidade lateral esquerda" data-ad-slot="desktop-left">');
  includesText(html, '<aside class="ad-slot ad-slot-right" aria-label="Publicidade lateral direita" data-ad-slot="desktop-right">');
  includesText(html, '<aside class="ad-slot ad-slot-mobile" aria-label="Publicidade" data-ad-slot="mobile-bottom">');
  includesText(html, '<span>Publicidade</span>');
  assert.ok(
    html.indexOf('data-ad-slot="mobile-bottom"') < html.indexOf('<div class="layout-grid">'),
    "Expected the mobile ad slot to appear before the main layout grid"
  );
});

test("styles.css positions ad slots responsively", () => {
  includesText(css, ".page-frame");
  includesText(css, ".ad-slot");
  includesText(css, ".ad-slot-left");
  includesText(css, ".ad-slot-right");
  includesText(css, ".ad-slot-mobile");
  includesText(css, "grid-template-columns: minmax(120px, 160px) minmax(0, 1180px) minmax(120px, 160px);");
  includesText(css, "@media (max-width: 1280px)");
  includesText(css, "@media (max-width: 920px)");
});
