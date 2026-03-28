import http from 'http';

const postData = JSON.stringify({
  type: "checkout.session.completed",
  data: {
    object: {
      customer_details: {
        email: "nwekea489@gmail.com",
        name: "Test User"
      },
      metadata: {
        productId: "bundle",
        productTitle: "The Ultimate Wealth Bundle",
        customerEmail: "nwekea489@gmail.com"
      }
    }
  }
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/webhook',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  res.setEncoding('utf8');
  res.on('data', (chunk) => {
    console.log(`Body: ${chunk}`);
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.write(postData);
req.end();
