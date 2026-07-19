import { useMutation } from '@tanstack/react-query';

import { generateRoadmap } from '../services/coach.service';

export function useGenerateRoadmap() {
  return useMutation({
    mutationFn: generateRoadmap,
  });
}
