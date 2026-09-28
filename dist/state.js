// The seasonal game's state boundary. Future levels can import completeStage.
export const STAGE_IDS = Object.freeze(['clue-1', 'clue-2', 'clue-3']);
const KEY = 'sm-birthday-2026:clues:v1';

export function getProgress() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || '{}');
    const validStages = Array.isArray(saved.completedStages) ? saved.completedStages : [];
    return { completedStages: STAGE_IDS.filter((id) => validStages.includes(id)) };
  } catch {
    return { completedStages: [] };
  }
}

export function completeStage(stageId) {
  const stageIndex = STAGE_IDS.indexOf(stageId);
  if (stageIndex < 0) throw new Error('Unknown stage');
  const completedStages = getProgress().completedStages;
  if (stageIndex > 0 && !completedStages.includes(STAGE_IDS[stageIndex - 1])) {
    throw new Error('Previous stage is still locked');
  }
  if (!completedStages.includes(stageId)) completedStages.push(stageId);
  localStorage.setItem(KEY, JSON.stringify({ completedStages }));
  return getProgress();
}
