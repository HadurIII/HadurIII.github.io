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

test("index.html keeps the AdSense base script for site review", () => {
  const matches = html.match(/pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js/g) || [];

  assert.equal(matches.length, 1);
  includesText(html, "ca-pub-5982594533644359");
});

test("index.html temporarily disables live ad slots during review", () => {
  assert.equal(html.includes('<ins class="adsbygoogle"'), false);
  assert.equal(html.includes("adsbygoogle = window.adsbygoogle"), false);
  assert.equal(html.includes("data-ad-slot="), false);
  assert.equal(html.includes("Publicidade lateral"), false);
});

test("styles.css focuses layout on editor content", () => {
  includesText(css, ".layout-grid");
  includesText(css, ".content-section");
  includesText(css, ".site-footer");
});
