import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '1m',  target: 5   }, // trafic normal
    { duration: '10s', target: 200 }, // pic soudain (spike)
    { duration: '1m',  target: 200 }, // maintien du pic
    { duration: '10s', target: 5   }, // retour rapide
    { duration: '3m',  target: 5   }, // récupération
    { duration: '10s', target: 200 }, // second spike
    { duration: '1m',  target: 200 }, // maintien
    { duration: '10s', target: 0   }, // fin
  ],
  thresholds: {
    http_req_duration: ['p(99)<5000'], // 99% des requêtes < 5s lors du pic
    http_req_failed:   ['rate<0.10'],  // taux d'erreur toléré à 10% lors du spike
    errors:            ['rate<0.10'],
  },
};

const BASE = 'https://pfa-pointage.vercel.app';

export default function () {
  const res = http.get(`${BASE}/api/auth/me`, {
    headers: { 'Content-Type': 'application/json' },
    timeout: '10s',
  });

  const ok = check(res, {
    'status != 500':    r => r.status !== 500,
    'pas de timeout':   r => r.timings.duration < 10000,
  });
  errorRate.add(!ok);

  sleep(0.5);
}
