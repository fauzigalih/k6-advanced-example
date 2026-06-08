import http from 'k6/http';
import { check } from 'k6';
import { SharedArray } from 'k6/data';
import { createPost } from '../helpers/posts.js';

const posts = new SharedArray('posts', function () {
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
  vus: 1,
  iterations: 20,
};

export default function () {
  const post = posts[__ITER % posts.length];
  const response = createPost({
    title: post.title,
    body: post.body,
    userId: post.userId,
  });

  const responseBody = response.json();

  check(response, {
    'status is 201': (r) => r.status === 201,
    'response contains same title': () =>
      responseBody.title === post.title,
  });
}