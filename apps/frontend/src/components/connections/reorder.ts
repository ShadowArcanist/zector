/** Return a connection order with one id moved before or after another id. */
export function moveConnectionId(
  ids: string[],
  draggedId: string,
  targetId: string,
  after: boolean,
): string[] {
  if (draggedId === targetId || !ids.includes(draggedId) || !ids.includes(targetId)) return ids;

  const next = ids.filter((id) => id !== draggedId);
  const targetIndex = next.indexOf(targetId);
  next.splice(targetIndex + (after ? 1 : 0), 0, draggedId);
  return next;
}
