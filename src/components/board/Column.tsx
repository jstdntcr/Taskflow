import { Fragment, useState, type FormEvent, type KeyboardEvent } from 'react';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDroppable } from '@dnd-kit/core';
import type { Column as ColumnType, Task } from '../../types';
import { useUpdateColumn, useDeleteColumn } from '../../hooks/useColumns';
import { useCreateTask } from '../../hooks/useTasks';
import { TaskCard } from './TaskCard';
import styles from './Column.module.css';

// Prefix so task drop zones don't collide with column sortable IDs
export const TASK_DROP_PREFIX = 'drop-';

interface Props {
  column: ColumnType;
  tasks: Task[];
  boardId: string;
  onTaskClick?: (task: Task) => void;
  /** Index in the task list where the task insertion line should appear */
  taskLineIndex?: number | null;
}

export function Column({
  column,
  tasks,
  boardId,
  onTaskClick,
  taskLineIndex = null,
}: Props) {
  const {
    setNodeRef: setColumnRef,
    setActivatorNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: column.id,
    data: { type: 'column', columnId: column.id },
  });

  const { setNodeRef: setTaskListRef } = useDroppable({
    id: TASK_DROP_PREFIX + column.id,
    data: { type: 'column-dropzone', columnId: column.id },
  });

  const columnStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const updateColumn = useUpdateColumn(boardId);
  const deleteColumn = useDeleteColumn(boardId);
  const createTask = useCreateTask(boardId);

  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(column.title);
  const [addingTask, setAddingTask] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskError, setTaskError] = useState<string | null>(null);

  const sorted = [...tasks].sort((a, b) => a.position - b.position);

  const submitRename = () => {
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== column.title) {
      updateColumn.mutate({ id: column.id, title: trimmed });
    } else {
      setRenameValue(column.title);
    }
    setRenaming(false);
  };

  const onRenameKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') submitRename();
    if (e.key === 'Escape') { setRenameValue(column.title); setRenaming(false); }
  };

  const handleDelete = () => {
    if (window.confirm(`Удалить колонку «${column.title}»? Все задачи в ней будут удалены.`)) {
      deleteColumn.mutate(column.id);
    }
  };

  const submitTask = async (e?: FormEvent) => {
    e?.preventDefault();
    const trimmed = taskTitle.trim();
    if (!trimmed) return;
    setTaskError(null);
    try {
      await createTask.mutateAsync({ columnId: column.id, title: trimmed, position: sorted.length });
      setTaskTitle('');
      setAddingTask(false);
    } catch (err) {
      setTaskError(err instanceof Error ? err.message : 'Не удалось создать задачу');
    }
  };

  const onTaskKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitTask(); }
    if (e.key === 'Escape') { setAddingTask(false); setTaskTitle(''); }
  };

  return (
    <div ref={setColumnRef} style={columnStyle} className={styles.column}>
      <div className={styles.header}>
        <div
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          className={styles.dragHandle}
          title="Перетащить колонку"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="9" cy="5"  r="1.5"/><circle cx="15" cy="5"  r="1.5"/>
            <circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/>
            <circle cx="9" cy="19" r="1.5"/><circle cx="15" cy="19" r="1.5"/>
          </svg>
        </div>

        {renaming ? (
          <input
            autoFocus
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onBlur={submitRename}
            onKeyDown={onRenameKey}
            className={styles.renameInput}
          />
        ) : (
          <h3
            className={styles.title}
            onDoubleClick={() => setRenaming(true)}
            title="Двойной клик для переименования"
          >
            {column.title}
            <span className={styles.count}>{tasks.length}</span>
          </h3>
        )}

        <button className={styles.deleteBtn} onClick={handleDelete} aria-label="Удалить колонку">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <SortableContext items={sorted.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div ref={setTaskListRef} className={styles.taskList}>
          {sorted.map((task, i) => (
            <Fragment key={task.id}>
              {taskLineIndex === i && <div className={styles.taskLine} />}
              <TaskCard task={task} onClick={onTaskClick} />
            </Fragment>
          ))}
          {taskLineIndex === sorted.length && <div className={styles.taskLine} />}
          {sorted.length === 0 && taskLineIndex === null && (
            <div className={styles.emptyHint}>Перетащите задачу сюда</div>
          )}
        </div>
      </SortableContext>

      <div className={styles.footer}>
        {addingTask ? (
          <form onSubmit={submitTask} className={styles.addForm}>
            <textarea
              autoFocus
              value={taskTitle}
              onChange={(e) => { setTaskTitle(e.target.value); setTaskError(null); }}
              onKeyDown={onTaskKey}
              placeholder="Название задачи..."
              rows={2}
              className={styles.taskInput}
            />
            {taskError && <p className={styles.taskError}>{taskError}</p>}
            <div className={styles.addActions}>
              <button type="submit" disabled={!taskTitle.trim() || createTask.isPending} className={styles.saveBtn}>
                {createTask.isPending ? 'Сохраняем...' : 'Добавить'}
              </button>
              <button type="button" onClick={() => { setAddingTask(false); setTaskTitle(''); setTaskError(null); }} className={styles.cancelBtn}>
                Отмена
              </button>
            </div>
          </form>
        ) : (
          <button className={styles.addTaskBtn} onClick={() => setAddingTask(true)}>
            + Добавить задачу
          </button>
        )}
      </div>
    </div>
  );
}
