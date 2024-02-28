# puppet_scraper

Web scraper service using headless Puppeteer

I wrote this at the beginning of 2022 as a proof of concept (just now getting around to uploading it to GIT). It is functional (though its Mythix dependencies are very outdated at this point).

This uses the headless Puppeteer chromium browser to load and scrape websites.

It is itself a web application, and will accept HTTP requests for URLs to fetch and scrape. It caches the results, has a cache invalidation system, will fetch resources "intelligently" (with random timeouts) to behave like a "human", has a fully featured job queue with retries, and will call a webhook after the resource(s) requested have been successfully fetched.

