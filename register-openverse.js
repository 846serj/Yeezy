#!/usr/bin/env node

/**
 * Openverse API Registration Script
 * 
 * This script helps you register for the Openverse API by making a POST request
 * to their registration endpoint.
 * 
 * Usage: node register-openverse.js
 */

const https = require('https');

// Registration data
const registrationData = {
  name: "WordPress Article Editor",
  description: "A WordPress article editor that allows users to search and use openly-licensed images from Openverse for their articles. The application will display proper attribution and respect license terms.",
  email: "your-email@example.com" // Replace with your actual email
};

// Convert data to JSON
const postData = JSON.stringify(registrationData);

// Request options
const options = {
  hostname: 'api.openverse.org',
  port: 443,
  path: '/v1/auth_tokens/register/',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

console.log('🚀 Registering for Openverse API...');
console.log('📧 Email:', registrationData.email);
console.log('📝 Application:', registrationData.name);
console.log('');

// Make the request
const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      
      if (res.statusCode === 201) {
        console.log('✅ Registration successful!');
        console.log('');
        console.log('🔑 Your credentials:');
        console.log('Client ID:', response.client_id);
        console.log('Client Secret:', response.client_secret);
        console.log('');
        console.log('📋 Next steps:');
        console.log('1. Save these credentials securely');
        console.log('2. Check your email and verify your account');
        console.log('3. Add these to your .env.local file:');
        console.log('');
        console.log('OPENVERSE_CLIENT_ID=' + response.client_id);
        console.log('OPENVERSE_CLIENT_SECRET=' + response.client_secret);
        console.log('');
        console.log('4. Restart your development server');
      } else {
        console.log('❌ Registration failed:');
        console.log('Status:', res.statusCode);
        console.log('Response:', response);
      }
    } catch (error) {
      console.log('❌ Error parsing response:');
      console.log('Status:', res.statusCode);
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (error) => {
  console.log('❌ Network error:', error.message);
});

// Send the request
req.write(postData);
req.end();

console.log('⏳ Making request to Openverse API...');
