import http from 'k6/http';

export function createPost(userData) {
  return http.post('https://jsonplaceholder.typicode.com/posts',
    JSON.stringify(userData),
    {
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
      },
    }
  );
}

export function getPosts() {
  return http.get('https://jsonplaceholder.typicode.com/posts');
}

export function getPost(id) {
  return http.get(`https://jsonplaceholder.typicode.com/posts/${id}`);
}