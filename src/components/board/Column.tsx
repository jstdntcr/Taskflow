// TODO: droppable column with header (rename, delete) + list of TaskCards + "Add task" button
import type { Column as ColumnType, Task } from '../../types';

interface Props {
  column: ColumnType;
  tasks: Task[];
  boardId: string;
}

export function Column({ column, tasks, boardId }: Props) {
  return null;
}
