const axios = require('axios');

const config = require('./config');

const GITHUB_URL = 'https://api.github.com/search'

const searchCommits = async query => {
    try
    {
        const res = await axios.get(`${GITHUB_URL}/commits?q=${query}`, { headers: { Accept: 'application/vnd.github.cloak-preview' }});
        return res.data.items;
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