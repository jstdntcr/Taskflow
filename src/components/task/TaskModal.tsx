import { useState, useEffect, useCallback, type KeyboardEvent } from 'react';
import type { Task, Priority } from '../../types';
import { useUpdateTask, useDeleteTask } from '../../hooks/useTasks';
import { useBoardMembers } from '../../hooks/useBoardMembers';
import { CommentList } from './CommentList';
import styles from './TaskModal.module.css';

const PRIORITIES: { value: Priority; label: string; cls: string }[] = [
  { value: 'low',    label: 'Низкий',  cls: styles.low },
  { value: 'medium', label: 'Средний', cls: styles.medium },
  { value: 'high',   label: 'Высокий', cls: styles.high },
];

interface Props {
  task: Task | null;
  boardId: string;
  onClose: () => void;
}

export function TaskModal({ task, boardId, onClose }: Props) {
  const updateTask = useUpdateTask(boardId);
  const deleteTask = useDeleteTask(boardId);
  const { data: members = [] } = useBoardMembers(boardId);

  // All fields as controlled local state — updates immediately on change
  const [title, setTitle]           = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority]     = useState<Priority>('medium');
  const [dueDate, setDueDate]       = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [editingTitle, setEditingTitle] = useState(false);

  // Sync when a different task is opened
  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description ?? '');
      setPriority(task.priority);
      setDueDate(task.due_date ?? '');
      setAssigneeId(task.assignee_id ?? '');
      setEditingTitle(false);
    }
  }, [task?.id]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: globalThis.KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const save = useCallback(<K extends keyof Task>(key: K, value: Task[K]) => {
    if (!task) return;
    updateTask.mutate({ id: task.id, updates: { [key]: value } });
  }, [task, updateTask]);

  const commitTitle = () => {
    setEditingTitle(false);
    const trimmed = title.trim();
    if (!trimmed) { setTitle(task?.title ?? ''); return; }
    if (trimmed !== task?.title) save('title', trimmed);
  };

  const onTitleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') commitTitle();
    if (e.key === 'Escape') { setTitle(task?.title ?? ''); setEditingTitle(false); }
  };

  const commitDescription = () => {
    if (description !== (task?.description ?? '')) {
      save('description', description || null);
    }
  };

  const handleDelete = async () => {
    if (!task) return;
    if (window.confirm(`Удалить задачу «${task.title}»?`)) {
      await deleteTask.mutateAsync(task.id);
      onClose();
    }
  };

  if (!task) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>

        {/* ── Header ── */}
        <div className={styles.header}>
          {editingTitle ? (
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={commitTitle}
              onKeyDown={onTitleKey}
              className={styles.titleInput}
            />
          ) : (
            <h2
              className={styles.title}
              onClick={() => setEditingTitle(true)}
              title="Нажмите для редактирования"
            >
              {title}
            </h2>
          )}
          <button className={styles.closeBtn} onClick={onClose} aria-label="Закрыть">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* ── Body ── */}
        <div className={styles.body}>
          <div className={styles.main}>

            {/* Priority */}
            <div className={styles.metaField}>
              <span className={styles.metaLabel}>Приоритет</span>
              <div className={styles.priorityBtns}>
                {PRIORITIES.map((p) => (
                  <button
                    key={p.value}
                    className={`${styles.priorityBtn} ${p.cls} ${priority === p.value ? styles.active : ''}`}
                    onClick={() => { setPriority(p.value); save('priority', p.value); }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Due date */}
            <div className={styles.metaField}>
              <span className={styles.metaLabel}>Дедлайн</span>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => {
                  setDueDate(e.target.value);
                  save('due_date', e.target.value || null);
                }}
                className={styles.dateInput}
              />
            </div>

            {/* Assignee */}
            <div className={styles.metaField}>
              <span className={styles.metaLabel}>Исполнитель</span>
              <select
                value={assigneeId}
                onChange={(e) => {
                  setAssigneeId(e.target.value);
                  save('assignee_id', e.target.value || null);
                }}
                className={styles.select}
              >
                <option value="">Не назначен</option>
                {members.map((m) => (
                  <option key={m.user_id} value={m.user_id}>
                    {m.profile?.name ?? 'Участник'}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div className={styles.descField}>
              <span className={styles.metaLabel}>Описание</span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={commitDescription}
                placeholder="Добавьте описание..."
                rows={5}
                className={styles.descTextarea}
              />
            </div>

            {/* Delete */}
            <button className={styles.deleteBtn} onClick={handleDelete}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
              </svg>
              Удалить задачу
            </button>
          </div>

          {/* Sidebar: comments */}
          <div className={styles.sidebar}>
            <CommentList taskId={task.id} />
          </div>
        </div>
      </div>
    </div>
  );
}
