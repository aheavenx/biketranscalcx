import { computeCosts } from './costs';
import { computeFitness } from './fitness';
import { computeLifeExpectancy } from './mortality';
import type { Inputs, Results } from './types';
import { computeWellbeing } from './wellbeing';

export function computeAll(inputs: Inputs): Results {
  return {
    costs: computeCosts(inputs),
    lifeExpectancy: computeLifeExpectancy(inputs),
    fitness: computeFitness(inputs),
    wellbeing: computeWellbeing(inputs),
  };
}
