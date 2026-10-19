import { computeCosts } from './costs';
import { computeLifeExpectancy } from './mortality';
import type { Inputs, Results } from './types';
import { computeWellbeing } from './wellbeing';

export function computeAll(inputs: Inputs): Results {
  return {
    costs: computeCosts(inputs),
    lifeExpectancy: computeLifeExpectancy(inputs),
    wellbeing: computeWellbeing(inputs),
  };
}
