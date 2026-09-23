const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const siteUrl = "https://haduriii.github.io/folgapp/";

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
  assert.ok(
    text.includes(expected),
    `Expected to find: ${expected}`
  );
}

test("index.html exposes search metadata for emendar feriados", () => {
  includesText(html, "<title>Folgapp - Emendar feriados e calcular melhor período de férias</title>");
  includesText(html, '<meta name="description" content="Calcule o melhor período para tirar férias e emendar feriados nacionais, folgas semanais e datas extras para aumentar seus dias de descanso." />');
  includesText(html, `<link rel="canonical" href="${siteUrl}" />`);
  includesText(html, '<meta name="robots" content="index, follow" />');
  includesText(html, '<link rel="manifest" href="site.webmanifest" />');
  includesText(html, '<h1 id="app-title">Otimizador de Folgas</h1>');
  includesText(html, "Calcule o melhor período para emendar feriados e aumentar seu descanso.");
});

test("index.html exposes Open Graph and Twitter preview metadata", () => {
  includesText(html, '<meta property="og:title" content="Folgapp - Emendar feriados" />');
  includesText(html, '<meta property="og:description" content="Descubra o melhor período para tirar férias e juntar folgas com feriados nacionais." />');
  includesText(html, `<meta property="og:url" content="${siteUrl}" />`);
  includesText(html, '<meta property="og:type" content="website" />');
  includesText(html, '<meta property="og:locale" content="pt_BR" />');
  includesText(html, '<meta name="twitter:card" content="summary" />');
  includesText(html, '<meta name="twitter:title" content="Folgapp - Emendar feriados" />');
  includesText(html, '<meta name="twitter:description" content="Calcule o melhor período de férias para aumentar seus dias de descanso." />');
});

test("index.html includes WebApplication structured data", () => {
  const match = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  assert.ok(match, "Expected JSON-LD script in index.html");

  const data = JSON.parse(match[1].trim());

  assert.equal(data["@context"], "https://schema.org");
  assert.equal(data["@type"], "WebApplication");
  assert.equal(data.name, "Folgapp");
  assert.equal(data.url, siteUrl);
  assert.equal(data.applicationCategory, "UtilitiesApplication");
  assert.equal(data.operatingSystem, "Any");
  assert.match(data.description, /emendar feriados/i);
  assert.deepEqual(data.alternateName, [
    "Otimizador de Folgas",
    "Emendar feriados",
    "Imendar feriados",
  ]);
});

test("robots.txt allows indexing and points to sitemap.xml", () => {
  const robots = fs.readFileSync(path.join(root, "robots.txt"), "utf8");

  includesText(robots, "User-agent: *");
  includesText(robots, "Allow: /");
  includesText(robots, `Sitemap: ${siteUrl}sitemap.xml`);
});

test("sitemap.xml lists the published Folgapp URL", () => {
  const sitemap = fs.readFileSync(path.join(root, "sitemap.xml"), "utf8");

  includesText(sitemap, "<urlset");
  includesText(sitemap, `<loc>${siteUrl}</loc>`);
});

test("site.webmanifest describes the Folgapp web app", () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, "site.webmanifest"), "utf8"));

  assert.equal(manifest.name, "Folgapp - Emendar feriados");
  assert.equal(manifest.short_name, "Folgapp");
  assert.equal(manifest.start_url, "/folgapp/");
  assert.equal(manifest.scope, "/folgapp/");
  assert.equal(manifest.display, "standalone");
  assert.match(manifest.description, /emendar feriados/i);
});
