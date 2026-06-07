import http from 'k6/http';
import { check } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';
import { createPost } from '../helpers/posts.js';

// Custom Metrics
export const postDuration = new Trend('post_duration');
export const responseHasId = new Rate('response_has_id');
export const failedRequests = new Counter('failed_requests');

export const options = {
  vus: 1,
  iterations: 20,
};

export default function () {
  const response = createPost({
    title: 'user-metrics',
    body: 'Lorem ipsum',
    userId: 1
  });

  // Trend Metric
  postDuration.add(response.timings.duration);

  const body = response.json();

  // Rate Metric
  responseHasId.add(body.hasOwnProperty('id'));

  // Counter Metric
  if (response.status !== 201) {
    failedRequests.add(1);
  }

  check(response, {
    'status is 201': (r) => r.status === 201,
    'response contains id': () => body.hasOwnProperty('id'),
  });
}