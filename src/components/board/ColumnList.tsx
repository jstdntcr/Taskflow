import { useState, type FormEvent } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { useColumns, useCreateColumn } from '../../hooks/useColumns';
import { useTasks, useMoveTask } from '../../hooks/useTasks';
import type { Task } from '../../types';
import { Column } from './Column';
import { TaskCard } from './TaskCard';
import styles from './ColumnList.module.css';

interface Props {
  boardId: string;
  onTaskClick?: (task: Task) => void;
}

export function ColumnList({ boardId, onTaskClick }: Props) {
  const { data: columns = [], isLoading } = useColumns(boardId);
  const { data: tasks = [] } = useTasks(boardId);
  const createColumn = useCreateColumn(boardId);
  const moveTask = useMoveTask(boardId);

  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [addingColumn, setAddingColumn] = useState(false);
  const [columnTitle, setColumnTitle] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const handleDragStart = ({ active }: DragStartEvent) => {
    const task = tasks.find((t) => t.id === active.id);
    if (task) setActiveTask(task);
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveTask(null);
    if (!over || active.id === over.id) return;

    const taskId = active.id as string;
    const overId = over.id as string;

    const overIsColumn = columns.some((c) => c.id === overId);
    const overTask = tasks.find((t) => t.id === overId);
    const targetColumnId = overIsColumn ? overId : overTask?.column_id;

    if (!targetColumnId) return;

    const targetTasks = tasks
      .filter((t) => t.column_id === targetColumnId && t.id !== taskId)
      .sort((a, b) => a.position - b.position);

    const newPosition = overTask
      ? targetTasks.findIndex((t) => t.id === overId)
      : targetTasks.length;

    moveTask.mutate({ id: taskId, columnId: targetColumnId, position: Math.max(0, newPosition) });
  };

  const submitColumn = async (e?: FormEvent) => {
    e?.preventDefault();
    const trimmed = columnTitle.trim();
    if (!trimmed) return;
    await createColumn.mutateAsync({ title: trimmed, position: columns.length });
    setColumnTitle('');
    setAddingColumn(false);
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className={styles.skeleton} />
        ))}
      </div>
    );
  }

  const tasksByColumn: Record<string, Task[]> = {};
  for (const task of tasks) {
    if (!tasksByColumn[task.column_id]) tasksByColumn[task.column_id] = [];
    tasksByColumn[task.column_id].push(task);
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className={styles.container}>
        {columns
          .sort((a, b) => a.position - b.position)
          .map((col) => (
            <Column
              key={col.id}
              column={col}
              tasks={tasksByColumn[col.id] ?? []}
              boardId={boardId}
              onTaskClick={onTaskClick}
            />
          ))}

        <div className={styles.addColumnArea}>
          {addingColumn ? (
            <form onSubmit={submitColumn} className={styles.addForm}>
              <input
                autoFocus
                value={columnTitle}
                onChange={(e) => setColumnTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') { setAddingColumn(false); setColumnTitle(''); }
                }}
                placeholder="Название колонки..."
                className={styles.addInput}
              />
              <div className={styles.addActions}>
                <button type="submit" disabled={!columnTitle.trim()} className={styles.saveBtn}>
                  Добавить
                </button>
                <button type="button" onClick={() => { setAddingColumn(false); setColumnTitle(''); }} className={styles.cancelBtn}>
                  Отмена
                </button>
              </div>
            </form>
          ) : (
            <button className={styles.addColumnBtn} onClick={() => setAddingColumn(true)}>
              + Добавить колонку
            </button>
          )}
        </div>
      </div>

      <DragOverlay>
        {activeTask && <TaskCard task={activeTask} overlay />}
      </DragOverlay>
    </DndContext>
  );
}
