// TODO: Modal with task details (title, description, priority, due_date, assignee) + CommentList
import { Modal } from '../shared/Modal';
import type { Task } from '../../types';

interface Props {
  task: Task | null;
  boardId: string;
  onClose: () => void;
}

export function TaskModal({ task, boardId, onClose }: Props) {
  return (
    <Modal open={Boolean(task)} onClose={onClose} title={task?.title}>
      {/* TODO */}
    </Modal>
  );
}
