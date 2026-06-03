// TODO: draggable card with title, priority badge, due date, assignee avatar, click → TaskModal
import type { Task } from '../../types';

interface Props {
  task: Task;
  onClick: (task: Task) => void;
}

export function TaskCard({ task, onClick }: Props) {
  return null;
}
