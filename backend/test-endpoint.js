const http = require('http');

const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/admin/jobs?page=1&limit=10',
    method: 'GET',
    headers: {
        'Authorization': 'Bearer fake-token-for-testing'
    }
};

const req = http.request(options, (res) => {
    console.log(`Status Code: ${res.statusCode}`);
    console.log(`Status Message: ${res.statusMessage}`);

    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        console.log('\nResponse Body:');
        try {
            const json = JSON.parse(data);
            console.log(JSON.stringify(json, null, 2));
        } catch (e) {
            console.log(data);
        }
    });
});

req.on('error', (error) => {
    console.error('Error:', error.message);
});

req.end();
