export type PlanId = 'free' | 'premium';

export interface Plan {
  id: PlanId;
  name: string;
  priceLabel: string;
  features: string[];
}

export const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    priceLabel: '$0/mo',
    features: [
      'Up to 5 habits',
      'Daily missions & streaks',
      'Basic journal & mood tracking',
      'Focus timer',
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    priceLabel: '$6.99/mo',
    features: [
      'Unlimited habits & goals',
      'Full analytics & insights',
      'Priority reminders',
      'All achievements & themes',
    ],
  },
];
