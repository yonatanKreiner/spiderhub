const axios = require('axios');

const config = require('./config');

const GITHUB_URL = 'https://api.github.com'

const searchCommits = async (query, requestedPages) => {
    try
    {
        const res = await axios.head(`${GITHUB_URL}/search/commits?q=${query}`, { headers: { Accept: 'application/vnd.github.cloak-preview' }});
        const maxPages = parseInt(res.headers['link'].match(/page=(\d+).*$/)[1]);
        const limit = parseInt(res.headers['x-ratelimit-remaining']);
        const pages = Math.min(requestedPages, maxPages, limit);

        let commits = [];

        for (let i = 0; i < pages; i++) {
            const commit = await axios.get(`${GITHUB_URL}/search/commits?q=${query}&page=${i}`, { headers: { Accept: 'application/vnd.github.cloak-preview' }});
            commits = commits.concat(commit.data.items);
        }
        
        return commits;
    } catch (err) {
        console.error(err.message);
    }
}

const getData = async htmlPath => {
    try {
        const res = await axios.get(htmlPath);
        return res.data;
    } catch (err) {
        console.error(err.message);
    }
}

const findRegex = (html, regex) => {
    try {
        return html.match(regex);
    } catch (err) {
        console.error(err.message);
    }
}

const searchSpider = async (spider, pages) => {
    const commits = await searchCommits(spider.query, pages);
    const results = await Promise.all(commits.map(async commit => {
        const html = await getData(commit.html_url);
        return findRegex(html, spider.regex);
    }))
    
    const filteredResults = results.flat().filter(result => result != null);

    if (spider.filter) {
        return { [spider.name]: spider.filter(filteredResults) };
    }

    return { [spider.name]: filteredResults };
}

Promise.all(config.spiders.map(async spider => await searchSpider(spider, config.pages))).then(results => {
    results.forEach(result => console.log(result));
});