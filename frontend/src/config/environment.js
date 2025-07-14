const config = {
    development: {
        apiUrl: 'http://localhost:55556',
        environment: 'development'
    },
    production: {
        apiUrl: 'https://medicaltrackerbackend.azurewebsites.net',
        environment: 'production'
    }
};

const environment = process.env.NODE_ENV || 'development';
export default config[environment]; 