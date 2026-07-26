import { generateRoadmapLocally } from './generateRoadmapLocally';
import type { RoadmapGenerationInput } from '../types/roadmap.types';

const BASE_INPUT: RoadmapGenerationInput = { goalTitle: 'Learn Spanish' };

describe('generateRoadmapLocally', () => {
  it('derives timelineDays from a targetDate when one is given', () => {
    const targetDate = new Date(Date.now() + 30 * 86_400_000).toISOString();
    const roadmap = generateRoadmapLocally({ ...BASE_INPUT, targetDate });
    expect(roadmap.timelineDays).toBeGreaterThanOrEqual(29);
    expect(roadmap.timelineDays).toBeLessThanOrEqual(31);
  });

  it('falls back to the daily time budget lookup when no targetDate is given', () => {
    expect(generateRoadmapLocally({ ...BASE_INPUT, dailyTimeBudget: 'under_30' }).timelineDays).toBe(120);
    expect(generateRoadmapLocally({ ...BASE_INPUT, dailyTimeBudget: '2h_plus' }).timelineDays).toBe(45);
  });

  it('ignores a targetDate that has already passed and falls back to the time budget', () => {
    const pastDate = new Date(Date.now() - 86_400_000).toISOString();
    const roadmap = generateRoadmapLocally({ ...BASE_INPUT, targetDate: pastDate, dailyTimeBudget: '30_60' });
    expect(roadmap.timelineDays).toBe(90);
  });

  it('scores estimatedSuccessPercent higher for advanced level and more daily time', () => {
    const beginner = generateRoadmapLocally({ ...BASE_INPUT, currentLevel: 'beginner', dailyTimeBudget: 'under_30' });
    const advanced = generateRoadmapLocally({ ...BASE_INPUT, currentLevel: 'advanced', dailyTimeBudget: '2h_plus' });
    expect(advanced.estimatedSuccessPercent).toBeGreaterThan(beginner.estimatedSuccessPercent);
  });

  it('lowers estimatedSuccessPercent as more challenges are listed, clamped to a 35-96 range', () => {
    const noChallenges = generateRoadmapLocally(BASE_INPUT);
    const manyChallenges = generateRoadmapLocally({ ...BASE_INPUT, challenges: ['a', 'b', 'c', 'd', 'e', 'f'] });
    expect(manyChallenges.estimatedSuccessPercent).toBeLessThan(noChallenges.estimatedSuccessPercent);
    expect(manyChallenges.estimatedSuccessPercent).toBeGreaterThanOrEqual(35);
    expect(noChallenges.estimatedSuccessPercent).toBeLessThanOrEqual(96);
  });

  it('produces exactly 4 milestones and 7 first-week missions, referencing the real goal title', () => {
    const roadmap = generateRoadmapLocally(BASE_INPUT);
    expect(roadmap.milestones).toHaveLength(4);
    expect(roadmap.firstWeekMissions).toHaveLength(7);
    expect(roadmap.summary).toContain('Learn Spanish');
    expect(roadmap.firstWeekMissions[0]?.dayOffset).toBe(0);
    expect(roadmap.firstWeekMissions.at(-1)?.dayOffset).toBe(6);
  });

  it('is deterministic - the same input always produces the same output', () => {
    const first = generateRoadmapLocally({ ...BASE_INPUT, dailyTimeBudget: '1_2h', currentLevel: 'intermediate' });
    const second = generateRoadmapLocally({ ...BASE_INPUT, dailyTimeBudget: '1_2h', currentLevel: 'intermediate' });
    expect(first).toEqual(second);
  });
});
