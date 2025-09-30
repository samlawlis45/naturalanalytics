#!/usr/bin/env node

// Simple cron-like scheduler for Natural Analytics refresh system
// This script should be run as a background service or via cron

const https = require('https');
const http = require('http');

const SCHEDULER_URL = process.env.SCHEDULER_URL || 'http://localhost:3000/api/refresh/scheduler';
const SCHEDULER_TOKEN = process.env.SCHEDULER_TOKEN || 'dev-scheduler-token';
const INTERVAL_MINUTES = parseInt(process.env.SCHEDULER_INTERVAL || '5'); // Run every 5 minutes by default

console.log(`Natural Analytics Scheduler started`);
console.log(`URL: ${SCHEDULER_URL}`);
console.log(`Interval: ${INTERVAL_MINUTES} minutes`);

function callScheduler() {
  const url = new URL(SCHEDULER_URL);
  const isHttps = url.protocol === 'https:';
  const client = isHttps ? https : http;

  const postData = JSON.stringify({});
  
  const options = {
    hostname: url.hostname,
    port: url.port || (isHttps ? 443 : 80),
    path: url.pathname,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SCHEDULER_TOKEN}`,
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const req = client.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      const timestamp = new Date().toISOString();
      
      if (res.statusCode === 200) {
        try {
          const result = JSON.parse(data);
          console.log(`[${timestamp}] Scheduler executed successfully:`, {
            schedulesProcessed: result.schedulesProcessed,
            results: result.results?.length || 0
          });
          
          if (result.results?.length > 0) {
            const successes = result.results.filter(r => r.status === 'success').length;
            const errors = result.results.filter(r => r.status === 'error').length;
            console.log(`[${timestamp}] Results: ${successes} successful, ${errors} failed`);
          }
        } catch (e) {
          console.log(`[${timestamp}] Scheduler executed (could not parse response)`);
        }
      } else {
        console.error(`[${timestamp}] Scheduler failed with status ${res.statusCode}:`, data);
      }
    });
  });

  req.on('error', (error) => {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] Scheduler request failed:`, error.message);
  });

  req.write(postData);
  req.end();
}

// Initial call
console.log('Making initial scheduler call...');
callScheduler();

// Set up interval
const intervalMs = INTERVAL_MINUTES * 60 * 1000;
setInterval(() => {
  callScheduler();
}, intervalMs);

console.log(`Scheduler will run every ${INTERVAL_MINUTES} minutes`);

// Handle process termination
process.on('SIGINT', () => {
  console.log('\nScheduler stopped');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nScheduler stopped');
  process.exit(0);
});