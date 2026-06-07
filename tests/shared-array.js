import { SharedArray } from 'k6/data';

const users = new SharedArray('users', function () {
  return JSON.parse(open('../data/users.json'));
});

export const options = {
  scenarios: {
    test: {
      executor: 'per-vu-iterations',
      vus: 20,
      iterations: 1,
    },
  },
};

export default function () {
  const user = users[__VU - 1];
  console.info(`VU ${__VU} menggunakan userId=${user.userId}`);
}
