const cheerio = require("cheerio");

function loadHtml() {
  const html = `
    <html>
      <body>
        <a href="/about">About</a>
        <form method="POST" action="/login">
          <input type="text" name="username" />
          <input type="password" name="password" />
        </form>
      </body>
    </html>
  `;
  return cheerio.load(html);
}

module.exports = { loadHtml };
