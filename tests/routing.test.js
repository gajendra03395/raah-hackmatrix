
import test from 'node:test';
import assert from 'node:assert/strict';
import { shortestPath, computeRoutes } from '../src/engine/routing.js';

test('normal route from base to Ravet exists', () => {
  const route = shortestPath('base', 'RAVET');
  assert.ok(route);
  assert.equal(route.path[0], 'base');
  assert.equal(route.path.at(-1), 'RAVET');
  assert.ok(route.durationMin > 0);
});

test('closed Ravet Bridge is excluded from routing', () => {
  const route = shortestPath('base', 'RAVET', new Set(['e7']));
  assert.ok(route);
  assert.ok(!route.edges.includes('e7'));
});

test('closing Ravet Bridge produces an alternative route', () => {
  const original = shortestPath('base', 'RAVET');
  const rerouted = shortestPath('base', 'RAVET', new Set(['e7']));

  assert.ok(original.edges.includes('e7'));
  assert.notDeepEqual(rerouted.edges, original.edges);
  assert.ok(rerouted.durationMin >= original.durationMin);
});

test('Ravet becomes unreachable when both access roads close', () => {
  const closed = new Set(['e7', 'e9']);

  assert.equal(shortestPath('base', 'RAVET', closed), null);

  const routes = computeRoutes(['RAVET'], closed);
  assert.equal(routes.RAVET.reachable, false);
  assert.deepEqual(routes.RAVET.path, []);
});

test('Chikhali becomes unreachable when its bridge closes', () => {
  const routes = computeRoutes(
    ['CHIKHALI'],
    new Set(['e20'])
  );

  assert.equal(routes.CHIKHALI.reachable, false);
  assert.equal(routes.CHIKHALI.durationMin, null);
});
