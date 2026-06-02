import http from 'k6/http';
import { check } from 'k6';

export const options = {
  vus: 1,
  duration: '30s',
};

const BASE = 'https://pfa-pointage.vercel.app';

export default function () {
  const res = http.get(`${BASE}/api/auth/me`);
  check(res, {
    'api répond': r => r.status !== 500,
  });
}
