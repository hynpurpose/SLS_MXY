// This one-time birthday game starts fresh on each page load. Progress remains
// available while moving between rooms, but a refresh begins a new playthrough.
export const STAGE_IDS = Object.freeze(['clue-1', 'clue-2', 'clue-3']);
let completedStages = [];

export function getProgress() {
  return { completedStages: [...completedStages] };
}

export function completeStage(stageId) {
  if (!STAGE_IDS.includes(stageId)) throw new Error('Unknown stage');
  if (!completedStages.includes(stageId)) completedStages.push(stageId);
  return getProgress();
}

export function resetFromStage(stageId) {
  const stageIndex = STAGE_IDS.indexOf(stageId);
  if (stageIndex < 0) throw new Error('Unknown stage');
  completedStages = completedStages.filter((id) => STAGE_IDS.indexOf(id) < stageIndex);
  return getProgress();
}
