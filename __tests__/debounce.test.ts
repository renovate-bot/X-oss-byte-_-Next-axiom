/**
 * @jest-environment jsdom
 */

import { jest } from '@jest/globals';
import { NextWebVitalsMetric } from 'next/app';
import { reportWebVitals } from '../src/webVitals';

global.fetch = jest.fn() as jest.Mock;
jest.useFakeTimers();

test('debounce sendMetrics', async () => {
  let metricsMatrix: NextWebVitalsMetric[][] = [
    [
      { id: '1', startTime: 1234, value: 1, name: 'FCP', label: 'web-vital' },
      { id: '2', startTime: 5678, value: 2, name: 'FCP', label: 'web-vital' },
    ],
    [{ id: '3', startTime: 9012, value: 3, name: 'FCP', label: 'web-vital' }],
    [{ id: '4', startTime: 4012, value: 4, name: 'FCP', label: 'web-vital' }],
  ];

  // report first set of web-vitals
  metricsMatrix[0].forEach(reportWebVitals);
  // skip 100ms and report another webVital
  jest.advanceTimersByTime(100);
  metricsMatrix[1].forEach(reportWebVitals);
  // ensure fetch has not been called yet for any the previously reported
  // web-vitals
  expect(fetch).toBeCalledTimes(0);
  // skip ahead of time to send the previous webvitals
  jest.advanceTimersByTime(1000);

  // send the last set of webVitals and wait for them to be sent
  metricsMatrix[2].forEach(reportWebVitals);
  jest.advanceTimersByTime(1000);

  const url = '/axiom/web-vitals';
  const payload = { method: 'POST', keepalive: true };

  expect(fetch).toHaveBeenCalledTimes(2);
  expect(fetch).nthCalledWith(1, url, {
    body: JSON.stringify({
      webVitals: [...metricsMatrix[0], ...metricsMatrix[1]],
    }),
    ...payload,
  });
  expect(fetch).nthCalledWith(2, url, {
    body: JSON.stringify({
      webVitals: metricsMatrix[2],
    }),
    ...payload,
  });
});
