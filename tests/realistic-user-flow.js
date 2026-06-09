import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';
import { SharedArray } from 'k6/data';
import { createPost, getPost, getPosts } from '../helpers/posts.js';

const postsCsv = new SharedArray('posts', function () {
  const csv = open('../data/posts.csv');

  const lines = csv.trim().split('\n');
  const headers = lines[0].split(',');

  return lines.slice(1).map(line => {
    const values = line.split(',');

    return {
      [headers[0]]: values[0].trim(),
      [headers[1]]: values[1].trim(),
      [headers[2]]: Number(values[2].trim()),
    };
  });
});

export const options = {
  thresholds: {
    http_req_duration: ['p(95)<2000'],
    http_req_failed: ['rate<0.01'],
    checks: ['rate>0.95'],
  },
  scenarios: {
    user_journey: {
      executor: 'shared-iterations',
      vus: 1,
      iterations: 20,
    },
  },
};

export default function () {
  group('user journey', function () {

    // STEP 1 - GET /posts
    const listResponse = getPosts();
    check(listResponse, {
      'list status is 200': (res) => res.status === 200,
    });
    const posts = listResponse.json();
    const randomPost = posts[Math.floor(Math.random() * posts.length)];
    
    sleep(randomIntBetween(1, 3));
    
    // STEP 2 - GET /posts/{id}
    const detailResponse = getPost(randomPost.id);
    check(detailResponse, {
      'detail status is 200': (r) => r.status === 200,
      'detail id match': (r) => r.json().id === randomPost.id,
    });

    sleep(randomIntBetween(1, 3));

    // STEP 3 - POST /posts
    const csvPost = postsCsv[__ITER % postsCsv.length];
    const createResponse = createPost({
      title: csvPost.title,
      body: csvPost.body,
      userId: csvPost.userId,
    });

    const createdPost = createResponse.json();
    check(createResponse, {
      'create status is 201': (r) => r.status === 201,
      'title matches request': () => createdPost.title === csvPost.title,
      'response contains id': () => createdPost.hasOwnProperty('id'),
    });

    sleep(randomIntBetween(1, 3));
  });
}

export function handleSummary(data) {
    const totalRequests = data.metrics.http_reqs?.values?.count ?? 0;
    const p95Duration = data.metrics.http_req_duration?.values?.['p(95)'] ?? 0;

    const thresholds = Object.entries(data.metrics)
      .filter(([_, metric]) => metric.thresholds)
      .map(([metricName, metric]) => ({
        name: metricName,
        passed: Object.values(metric.thresholds).every(t => t.ok),
      }));

    const thresholdRows = thresholds.map(t => `
      <tr>
        <td>${t.name}</td>
        <td style="color: ${t.passed ? '#0F6E56' : '#A32D2D'}; font-weight: bold;">
          ${t.passed ? '✅ PASS' : '❌ FAIL'}
        </td>
      </tr>`).join('');

    // Waktu Jakarta (UTC+7)
    const now = new Date();
    const jakartaTime = new Date(now.getTime() + (7 * 60 * 60 * 1000));
    const formattedTime = jakartaTime.toISOString()
      .replace('T', ' ')
      .replace('Z', '')
      .split('.')[0] + ' WIB';

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>K6 Test Report — Build #${__ENV.BUILD_NUMBER || 'local'}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: Arial, sans-serif;
      background: #f0f2f5;
      padding: 40px;
      color: #333;
    }
    .container {
      max-width: 680px;
      margin: 0 auto;
      background: #ffffff;
      border: 1px solid #d0d7de;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }
    .header {
      background: #1f2937;
      color: #ffffff;
      padding: 20px 28px;
      border-bottom: 3px solid #3b82f6;
    }
    .header h1 {
      font-size: 20px;
      font-weight: 700;
      margin-bottom: 6px;
    }
    .header .meta {
      font-size: 12px;
      color: #9ca3af;
      line-height: 1.6;
    }
    .body { padding: 24px 28px; }
    .section-title {
      font-size: 11px;
      font-weight: 600;
      color: #6b7280;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      margin-bottom: 10px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      border: 1px solid #d0d7de;
      border-radius: 6px;
      overflow: hidden;
      margin-bottom: 24px;
    }
    thead tr {
      background: #f6f8fa;
    }
    th {
      padding: 10px 14px;
      text-align: left;
      font-size: 12px;
      font-weight: 600;
      color: #57606a;
      border-bottom: 1px solid #d0d7de;
    }
    td {
      padding: 10px 14px;
      font-size: 13px;
      border-bottom: 1px solid #eaeef2;
    }
    tr:last-child td { border-bottom: none; }
    tr:nth-child(even) td { background: #f6f8fa; }
    .footer {
      padding: 14px 28px;
      background: #f6f8fa;
      border-top: 1px solid #d0d7de;
      font-size: 11px;
      color: #6b7280;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="container">

    <div class="header">
      <h1>K6 Performance Test Report</h1>
      <div class="meta">
        Build: #${__ENV.BUILD_NUMBER || 'local'} &nbsp;|&nbsp;
        Job: ${__ENV.JOB_NAME || 'local'} &nbsp;|&nbsp;
        ${formattedTime}
      </div>
    </div>

    <div class="body">

      <p class="section-title">Summary</p>
      <table>
        <thead>
          <tr><th>Metric</th><th>Value</th></tr>
        </thead>
        <tbody>
          <tr><td>Total Requests</td><td>${totalRequests}</td></tr>
          <tr><td>P95 Duration</td><td>${p95Duration.toFixed(2)} ms</td></tr>
        </tbody>
      </table>

      <p class="section-title">Threshold Results</p>
      <table>
        <thead>
          <tr><th>Metric</th><th>Status</th></tr>
        </thead>
        <tbody>
          ${thresholdRows}
        </tbody>
      </table>

    </div>

    <div class="footer">
      Generated by k6 v${__ENV.K6_VERSION || '-'} &nbsp;|&nbsp; Grafana k6 Performance Testing
    </div>

  </div>
</body>
</html>`;

    return {
        '/app/results/summary.json': JSON.stringify(data, null, 2),
        '/app/results/summary.html': html,
    };
}
