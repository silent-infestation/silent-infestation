const { loadHtml } = require("./crawlerHelper");

class MockCrawler {
  constructor(config) {
    this.config = config;
    this.queue = jest.fn();
    this.on = (event, handler) => {
      if (event === "drain") {
        setTimeout(async () => {
          await this.config.callback(
            null,
            {
              $: loadHtml(),
              options: { url: "http://example.com" },
            },
            jest.fn()
          );
          handler();
        }, 0);
      }
    };
  }
}

module.exports = MockCrawler;
