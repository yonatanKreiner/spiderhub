const axios = require('axios');
const fs = require('fs')
const GITHUB_URL = 'https://api.github.com';
const GITHUB_SEARCH_URL = 'https://api.github.com/search'

const searchCommits = async (query) => {
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
        // const res = await axios.get(`${GITHUB_SEARCH_URL}/commits?q=${query}&page=${page}`, { headers: { Accept: 'application/vnd.github.cloak-preview' }});
        return commits.map(commit => commit.data);
    } catch (err) {
        console.error(err.message);
    }
}

const searchCode = async query => {
    try {
        const res = await axios.get(`${GITHUB_SEARCH_URL}/code?q=${query}`, { headers: { Accept: 'application/vnd.github.cloak-preview' }});
        return res.data;
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

const findMongo = html => {
    try {
        const regex = /mongodb:\/\/(\w+:\w+@)?[\.\w]+(:\d+)?(,[\.\w]+(:\d+)?)*(\/\w+)?/g;
        return html.match(regex);
    } catch (err) {
        console.error(err.message);
    }
}

const filterMongo = connectionStrings => {
    const uniqueConnectionStrings = [...new Set(connectionStrings)];
    return uniqueConnectionStrings.filter(connectionString => !connectionString.includes('localhost') && !connectionString.includes('127.0.0.1'))
}

searchCommits('mongo connection string').then(all_commits => {
    all_commits.forEach(async page_commits => {
        page_commits.items.map(async commit => {
            const html = await getData(commit.html_url);
            const mongos = filterMongo(findMongo(html));
            mongos.forEach(mongo => console.log(mongo));
        })
    })
});