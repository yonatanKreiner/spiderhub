module.exports = {
    pages: 1,
    spiders: [
        {
            name: 'mongo',
            query: 'mongo connection string',
            regex: /mongodb:\/\/(\w+:\w+@)?[\.\w]+(:\d+)?(,[\.\w]+(:\d+)?)*(\/\w+)?/g,
            filter: connectionStrings => {
                const uniqueConnectionStrings = [...new Set(connectionStrings)];
                return uniqueConnectionStrings.filter(connectionString => !connectionString.includes('localhost') && !connectionString.includes('127.0.0.1'));
            }
        },
        {
            name: 'password',
            query: 'removed password',
            regex: /password\s?[=:]\s?["']\w+["']/g
        }
    ]
}