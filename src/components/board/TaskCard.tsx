import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Task } from '../../types';
import { formatDate, isOverdue } from '../../utils/date';
import styles from './TaskCard.module.css';

const PRIORITY_CLASS: Record<string, string> = {
  low: styles.low,
  medium: styles.medium,
  high: styles.high,
};

const PRIORITY_LABEL: Record<string, string> = {
  low: 'Низкий',
  medium: 'Средний',
  high: 'Высокий',
};

interface Props {
  task: Task;
  onClick?: (task: Task) => void;
  overlay?: boolean;
}

export function TaskCard({ task, onClick, overlay = false }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({
      id: task.id,
      data: { type: 'task', columnId: task.column_id },
    });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={[
        styles.card,
        isDragging && !overlay ? styles.ghost : '',
        overlay ? styles.overlay : '',
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={() => !isDragging && onClick?.(task)}
      {...attributes}
      {...listeners}
    >
      <p className={styles.title}>{task.title}</p>
      <div className={styles.footer}>
        <span className={`${styles.priority} ${PRIORITY_CLASS[task.priority]}`}>
          {PRIORITY_LABEL[task.priority]}
        </span>
        {task.due_date && (
          <span className={`${styles.due} ${isOverdue(task.due_date) ? styles.overdue : ''}`}>
            {formatDate(task.due_date)}
          </span>
        )}
      </div>
    </div>
  );
}
