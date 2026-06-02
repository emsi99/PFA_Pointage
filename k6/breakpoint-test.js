import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate  = new Rate('errors');
const reqLatency = new Trend('req_latency', true);

export const options = {
  // Montée linéaire illimitée jusqu'à rupture
  stages: [
    { duration: '2m',  target: 20  },
    { duration: '2m',  target: 50  },
    { duration: '2m',  target: 100 },
    { duration: '2m',  target: 150 },
    { duration: '2m',  target: 200 },
    { duration: '2m',  target: 300 },
    { duration: '2m',  target: 400 },
    { duration: '5m',  target: 400 }, // maintien max
    { duration: '2m',  target: 0   }, // descente
  ],
  thresholds: {
    // Seuils indicatifs — ne pas aborter le test (abortOnFail: false)
    http_req_duration: [
      { threshold: 'p(95)<3000', abortOnFail: false },
      { threshold: 'p(99)<5000', abortOnFail: false },
    ],
    http_req_failed: [{ threshold: 'rate<0.20', abortOnFail: false }],
    errors:          [{ threshold: 'rate<0.20', abortOnFail: false }],
  },
};

const BASE = 'https://pfa-pointage.vercel.app';

const ENDPOINTS = [
  { method: 'GET', url: `${BASE}/api/auth/me`  },
  { method: 'GET', url: `${BASE}/api/stats`    },
  { method: 'GET', url: `${BASE}/api/employes` },
];

export default function () {
  const endpoint = ENDPOINTS[Math.floor(Math.random() * ENDPOINTS.length)];

  const res = http.get(endpoint.url, {
    headers: { 'Content-Type': 'application/json' },
    timeout: '15s',
  });

  reqLatency.add(res.timings.duration);

  const ok = check(res, {
    'status != 500':     r => r.status !== 500,
    'status != 503':     r => r.status !== 503,
    'réponse reçue':     r => r.body !== null,
    'latence < 5s':      r => r.timings.duration < 5000,
  });
  errorRate.add(!ok);

  sleep(0.3);
}
