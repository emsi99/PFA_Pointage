import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate  = new Rate('errors');
const loginTrend = new Trend('login_duration', true);

export const options = {
  stages: [
    { duration: '2m', target: 10 },
    { duration: '5m', target: 10 },
    { duration: '2m', target: 30 },
    { duration: '5m', target: 30 },
    { duration: '2m', target: 60 },
    { duration: '5m', target: 60 },
    { duration: '3m', target: 0  },
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'],
    http_req_failed:   ['rate<0.05'],
    errors:            ['rate<0.05'],
    login_duration:    ['p(95)<3000'],
  },
};

const BASE     = 'https://pfa-pointage.vercel.app';
const email    = __ENV.K6_EMAIL;
const password = __ENV.K6_PASSWORD;
const HEADERS  = { 'Content-Type': 'application/json' };

export default function () {
  const loginRes = http.post(
    `${BASE}/api/auth/login`,
    JSON.stringify({ email: email, password: password }),
    { headers: HEADERS },
  );

  loginTrend.add(loginRes.timings.duration);

  const loginOk = check(loginRes, {
    'login — status 200':   r => r.status === 200,
    'login — success true': r => {
      try { return JSON.parse(r.body).success === true; } 
      catch { return false; }
    },
    'login — moins de 3s':  r => r.timings.duration < 3000,
  });

  errorRate.add(!loginOk);

  if (!loginOk) {
    sleep(1);
    return;
  }

  sleep(1);
}