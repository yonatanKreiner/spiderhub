const axios = require('axios');

const GITHUB_URL = 'https://api.github.com/search'

const searchCommits = async query => {
    try
    {
        const res = await axios.get(`${GITHUB_URL}/commits?q=${query}`, { headers: { Accept: 'application/vnd.github.cloak-preview' }});
        return res.data;
    } catch (err) {
        console.error(err.message);
    }
}

const searchCode = async query => {
    try {
        const res = await axios.get(`${GITHUB_URL}/code?q=${query}`, { headers: { Accept: 'application/vnd.github.cloak-preview' }});
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
        let matches = html.match(regex);
     
        if (matches) {
            matches.forEach(match => console.log(match));
        }
    } catch (err) {
        console.error(err.message);
    }
}

searchCommits('mongo connection string').then(commits => {
    commits.items.map(async commit => {
        const html = await getData(commit.html_url);
        findMongo(html);
    })
});