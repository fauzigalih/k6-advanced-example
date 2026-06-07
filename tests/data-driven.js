import http from 'k6/http';
import { check } from 'k6';
import { SharedArray } from 'k6/data';
import { createPost } from '../helpers/posts.js';
import { uuidv4 } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';

const posts = new SharedArray('posts', function () {
  const csv = open('../data/posts.csv');
  const lines = csv.trim().split('\n');
  const headers = lines[0].split(',');
  return lines.slice(1).map(line => {
    const values = line.split(',');
    return {
        [headers[0]]: values[0],
        [headers[1]]: values[1],
        [headers[2]]: Number(values[2]),
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