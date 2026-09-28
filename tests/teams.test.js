
import test from 'node:test';
import assert from 'node:assert/strict';

import { SETTLEMENTS, TEAMS } from '../src/data/network.js';
import { computeRoutes } from '../src/engine/routing.js';
import { buildPlan } from '../src/engine/scoring.js';
import {
  buildRequirements,
  autoAllocate,
  computeCoverage
} from '../src/engine/teams.js';

// Run the actual RAAH allocation pipeline.
function scenario(closed = new Set(), teams = TEAMS) {
  const routes = computeRoutes(
    Object.keys(SETTLEMENTS),
    closed
  );

  const plan = buildPlan(SETTLEMENTS, routes);
  const requirements = buildRequirements(plan);
  const assignments = autoAllocate(
    plan,
    requirements,
    teams
  );

  const coverage = computeCoverage(
    assignments,
    requirements,
    teams,
    Object.keys(SETTLEMENTS)
  );

  return {
    routes,
    plan,
    requirements,
    assignments,
    coverage
  };
}

// 1. Rescue requirements must never be negative.
test('every settlement has valid rescue requirements', () => {
  const { requirements } = scenario();

  for (const [id, requirement] of Object.entries(requirements)) {
    assert.ok(requirement.peopleToEvac >= 0, id);
    assert.ok(requirement.membersRequired >= 0, id);
    assert.ok(requirement.boats >= 0, id);
  }
});

// 2. Every allocated team must exist.
test('allocated teams exist in the official roster', () => {
  const { assignments } = scenario();
  const roster = new Set(TEAMS.map(team => team.id));

  for (const teamId of Object.keys(assignments)) {
    assert.ok(roster.has(teamId));
  }
});

// 3. Teams must not be sent to unknown settlements.
test('every assignment targets a known settlement', () => {
  const { assignments } = scenario();

  for (const settlementId of Object.values(assignments)) {
    assert.ok(SETTLEMENTS[settlementId]);
  }
});

// 4. Team members must not be double-counted.
test('allocated personnel are counted exactly once', () => {
  const { assignments, coverage } = scenario();

  const expected = TEAMS
    .filter(team => assignments[team.id])
    .reduce((total, team) => total + team.members, 0);

  assert.equal(coverage.totals.assignedMembers, expected);
});

// 5. Every team must be assigned or unassigned.
test('all rescue teams are accounted for', () => {
  const { assignments, coverage } = scenario();

  const assigned = Object.keys(assignments).length;
  const unassigned = coverage.unassigned.length;

  assert.equal(assigned + unassigned, TEAMS.length);
});

// 6. The system must handle zero available teams.
test('zero available teams do not crash allocation', () => {
  const { assignments, coverage } = scenario(
    new Set(),
    []
  );

  assert.deepEqual(assignments, {});
  assert.equal(coverage.totals.assignedMembers, 0);
});

// 7. Isolated settlements require special attention.
test('isolated Ravet requires boat support', () => {
  const { routes, requirements } = scenario(
    new Set(['e7', 'e9'])
  );

  assert.equal(routes.RAVET.reachable, false);
  assert.equal(requirements.RAVET.cut, true);
  assert.ok(requirements.RAVET.boats >= 2);
});

// 8. Resource scarcity must produce valid coverage.
test('resource shortages produce valid coverage values', () => {
  const { coverage } = scenario(
    new Set(),
    TEAMS.slice(0, 1)
  );

  for (const result of Object.values(coverage.bySettlement)) {
    assert.ok(result.coverage >= 0);
    assert.ok(result.coverage <= 1);
    assert.ok(result.shortfall >= 0);
    assert.ok(result.boatShortfall >= 0);
  }
});

// 9. Unchanged inputs must produce unchanged assignments.
test('allocation is deterministic', () => {
  const first = scenario().assignments;
  const second = scenario().assignments;

  assert.deepEqual(first, second);
});
