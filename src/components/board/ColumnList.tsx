// TODO: DndContext wrapper, horizontal scroll, list of Column + "Add column" button
import { DndContext } from '@dnd-kit/core';
import { useColumns } from '../../hooks/useColumns';
import { useTasks } from '../../hooks/useTasks';
import { useMoveTask } from '../../hooks/useTasks';

interface Props {
  boardId: string;
}

export function ColumnList({ boardId }: Props) {
  const { data: columns } = useColumns(boardId);
  const { data: tasks } = useTasks(boardId);
  const moveTask = useMoveTask(boardId);

  return null;
}
