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
        <td class="${t.passed ? 'pass' : 'fail'}">
          ${t.passed ? '✅ PASS' : '❌ FAIL'}
        </td>
      </tr>
      `).join('');

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
</head>
<body>
  <h1>K6 Performance Test Report</h1>
  <p>
    Build: #${__ENV.BUILD_NUMBER || 'local'} |
    Job: ${__ENV.JOB_NAME || 'local'} |
    Generated: ${formattedTime}
  </p>

  <table border="1" cellpadding="8" cellspacing="0">
    <tr><th>Metric</th><th>Value</th></tr>
    <tr>
      <td>Total Requests</td>
      <td>${totalRequests}</td>
    </tr>
    <tr>
      <td>P95 Duration</td>
      <td>${p95Duration.toFixed(2)} ms</td>
    </tr>
    ${thresholdRows}
  </table>
</body>
</html>`;

    return {
        '/app/results/summary.json': JSON.stringify(data, null, 2),
        '/app/results/summary.html': html,
    };
}
