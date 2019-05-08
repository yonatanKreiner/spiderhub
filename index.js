const axios = require('axios');
const fs = require('fs')
const GITHUB_URL = 'https://api.github.com';
const GITHUB_SEARCH_URL = 'https://api.github.com/search'

const config = require('./config');

const GITHUB_URL = 'https://api.github.com/search'

const searchCommits = async query => {
    try
    {
        const page_request = await axios.head(`${GITHUB_SEARCH_URL}/commits?q=${query}`, { headers: { Accept: 'application/vnd.github.cloak-preview' }});
        const regex = /.*&page=\d+>;.*&page=(\d+)>;.*/g;
        const match = regex.exec(page_request.headers['link']);
        const pages = parseInt(match[1]);
        var commits = [];
        for(let page = 1; page <= pages; page++) {
            var rate = await axios.get(`${GITHUB_URL}/rate_limit`, { headers: { Accept: 'application/vnd.github.cloak-preview' }});
            var remaining = parseInt(rate.data['resources']['search']['remaining']);
            while (remaining == 0) {
                rate = await axios.get(`${GITHUB_URL}/rate_limit`, { headers: { Accept: 'application/vnd.github.cloak-preview' }});
                var remaining = parseInt(rate.data['resources']['search']['remaining']);
            }
            commits.push(await axios.get(`${GITHUB_SEARCH_URL}/commits?q=${query}&page=${page}`, { headers: { Accept: 'application/vnd.github.cloak-preview' }}));
        }
        return commits.map(commit => commit.data);
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

const searchSpider = async spider => {
    const commits = await searchCommits(spider.query);
    let results = await Promise.all(commits.map(async commit => {
        const html = await getData(commit.html_url);
        return findRegex(html, spider.regex);
    }))
    
    results = results.flat().filter(result => result != null);

    if (spider.filter) {
        results = spider.filter(results);
    }

    return { [spider.name]: results };
}

Promise.all(config.spiders.map(async spider => await searchSpider(spider))).then(results => {
    results.forEach(result => console.log(result));
});