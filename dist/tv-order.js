// A slot is a position in the current sequence, not a one-use target.
// Occupied targets make room; tapes already placed may be moved again.
export function placeTape(slots, tapeId, targetIndex) {
  if (targetIndex < 0 || targetIndex >= slots.length) return [...slots];
  const result = [...slots];
  const sourceIndex = result.indexOf(tapeId);
  if (sourceIndex === targetIndex) return result;

  if (sourceIndex !== -1) {
    result[sourceIndex] = null;
    if (result[targetIndex] !== null) {
      const step = sourceIndex < targetIndex ? 1 : -1;
      for (let index = sourceIndex; index !== targetIndex; index += step) {
        result[index] = result[index + step];
      }
    }
    result[targetIndex] = tapeId;
    return result;
  }

  if (result[targetIndex] === null) {
    result[targetIndex] = tapeId;
    return result;
  }

  let freeIndex = -1;
  for (let index = targetIndex + 1; index < result.length; index += 1) {
    if (result[index] === null) { freeIndex = index; break; }
  }
  if (freeIndex !== -1) {
    for (let index = freeIndex; index > targetIndex; index -= 1) result[index] = result[index - 1];
    result[targetIndex] = tapeId;
    return result;
  }
  for (let index = targetIndex - 1; index >= 0; index -= 1) {
    if (result[index] === null) { freeIndex = index; break; }
  }
  if (freeIndex !== -1) {
    for (let index = freeIndex; index < targetIndex; index += 1) result[index] = result[index + 1];
    result[targetIndex] = tapeId;
  }
  return result;
}

export function removeTape(slots, tapeId) {
  return slots.map((id) => id === tapeId ? null : id);
}
