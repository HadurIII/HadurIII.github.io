const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const siteUrl = "https://haduriii.github.io/";

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
  includesText(html, '<meta name="google-site-verification" content="kSJR2sug0vVIFZUu9UncXI_5W2wErR4RLG_zhA3af0s" />');
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

test("index.html adds editorial content and institutional links", () => {
  includesText(html, '<h2 id="como-funciona">Como funciona o Folgapp</h2>');
  includesText(html, '<h2 id="emendar-feriados">O que significa emendar feriados</h2>');
  includesText(html, '<h2 id="exemplo-calculo">Exemplo prático de cálculo</h2>');
  includesText(html, '<h2 id="perguntas-frequentes">Perguntas frequentes</h2>');
  includesText(html, '<a href="sobre.html">Sobre</a>');
  includesText(html, '<a href="privacidade.html">Privacidade</a>');
  includesText(html, '<a href="contato.html">Contato</a>');
});

test("institutional pages exist with indexable metadata", () => {
  for (const page of ["sobre.html", "privacidade.html", "contato.html"]) {
    const pageHtml = fs.readFileSync(path.join(root, page), "utf8");
    includesText(pageHtml, '<meta name="robots" content="index, follow" />');
    includesText(pageHtml, '<link rel="stylesheet" href="styles.css" />');
  }

  includesText(fs.readFileSync(path.join(root, "privacidade.html"), "utf8"), "Google AdSense");
  includesText(fs.readFileSync(path.join(root, "contato.html"), "utf8"), "https://github.com/HadurIII/HadurIII.github.io/issues");
});

test("robots.txt allows indexing and points to sitemap.xml", () => {
  const robots = fs.readFileSync(path.join(root, "robots.txt"), "utf8");

  includesText(robots, "User-agent: *");
  includesText(robots, "Allow: /");
  includesText(robots, `Sitemap: ${siteUrl}sitemap.xml`);
});

test("sitemap.xml lists the published Folgapp pages", () => {
  const sitemap = fs.readFileSync(path.join(root, "sitemap.xml"), "utf8");

  includesText(sitemap, "<urlset");
  includesText(sitemap, `<loc>${siteUrl}</loc>`);
  includesText(sitemap, `<loc>${siteUrl}sobre.html</loc>`);
  includesText(sitemap, `<loc>${siteUrl}privacidade.html</loc>`);
  includesText(sitemap, `<loc>${siteUrl}contato.html</loc>`);
});

test("ads.txt authorizes the AdSense publisher", () => {
  const adsTxt = fs.readFileSync(path.join(root, "ads.txt"), "utf8").trim();
  assert.equal(adsTxt, "google.com, pub-5982594533644359, DIRECT, f08c47fec0942fa0");
});

test("site.webmanifest describes the Folgapp web app", () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, "site.webmanifest"), "utf8"));

  assert.equal(manifest.name, "Folgapp - Emendar feriados");
  assert.equal(manifest.short_name, "Folgapp");
  assert.equal(manifest.start_url, "/");
  assert.equal(manifest.scope, "/");
  assert.equal(manifest.display, "standalone");
  assert.match(manifest.description, /emendar feriados/i);
});
