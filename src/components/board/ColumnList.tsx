import { useEffect, useRef, useState, type FormEvent } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  pointerWithin,
  closestCenter,
  type CollisionDetection,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { useColumns, useCreateColumn, useMoveColumn } from '../../hooks/useColumns';
import { useTasks, useReorderTasks } from '../../hooks/useTasks';
import type { Column as ColumnType, Task } from '../../types';
import { Column, TASK_DROP_PREFIX } from './Column';
import { TaskCard } from './TaskCard';
import styles from './ColumnList.module.css';

interface Props {
  boardId: string;
  onTaskClick?: (task: Task) => void;
}

type ColTarget = { columnId: string; side: 'left' | 'right' } | null;
type TaskLine  = { columnId: string; index: number } | null;

export function ColumnList({ boardId, onTaskClick }: Props) {
  const { data: columns = [], isLoading } = useColumns(boardId);
  const { data: tasks = [] } = useTasks(boardId);
  const createColumn = useCreateColumn(boardId);
  const moveColumn = useMoveColumn(boardId);
  const reorderTasks = useReorderTasks(boardId);

  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [activeColumn, setActiveColumn] = useState<ColumnType | null>(null);
  const [taskLine, setTaskLine] = useState<TaskLine>(null);
  const [addingColumn, setAddingColumn] = useState(false);
  const [columnTitle, setColumnTitle] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  // Track the real cursor position — insertion side/index is computed from the
  // pointer, not from the dragged element's center (which can be far from it).
  const pointerRef = useRef({ x: 0, y: 0 });
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointerRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('pointermove', onMove);
    return () => window.removeEventListener('pointermove', onMove);
  }, []);

  const sortedColumns = [...columns].sort((a, b) => a.position - b.position);

  const tasksByColumn: Record<string, Task[]> = {};
  for (const t of tasks) (tasksByColumn[t.column_id] ??= []).push(t);
  for (const id in tasksByColumn) tasksByColumn[id].sort((a, b) => a.position - b.position);

  // ── Type-aware collision: columns hit only columns, tasks hit only tasks/zones ──
  const collisionDetection: CollisionDetection = (args) => {
    const activeType = args.active.data.current?.type;
    const filtered = args.droppableContainers.filter((c) => {
      const t = c.data.current?.type;
      return activeType === 'column'
        ? t === 'column'
        : t === 'task' || t === 'column-dropzone';
    });

    // Columns: pick the column whose center is horizontally closest to the
    // CURSOR (not the dragged element), so gaps resolve to the right column.
    if (activeType === 'column') {
      const pointer = args.pointerCoordinates;
      if (!pointer) return closestCenter({ ...args, droppableContainers: filtered });
      let best: (typeof filtered)[number] | null = null;
      let bestDist = Infinity;
      for (const c of filtered) {
        const r = args.droppableRects.get(c.id);
        if (!r) continue;
        const dist = Math.abs(pointer.x - (r.left + r.width / 2));
        if (dist < bestDist) { bestDist = dist; best = c; }
      }
      return best ? [{ id: best.id }] : [];
    }

    const pointer = pointerWithin({ ...args, droppableContainers: filtered });
    return pointer.length ? pointer : closestCenter({ ...args, droppableContainers: filtered });
  };

  // ── Resolve where a dragged COLUMN should land relative to the hovered one ──
  const resolveColumnTarget = (e: DragOverEvent | DragEndEvent): ColTarget => {
    const { active, over } = e;
    if (!over) return null;
    const overColumnId = over.data.current?.columnId as string | undefined;
    if (!overColumnId || overColumnId === active.id) return null;

    const overRect = over.rect;
    const overCenterX = overRect.left + overRect.width / 2;
    return {
      columnId: overColumnId,
      side: pointerRef.current.x < overCenterX ? 'left' : 'right',
    };
  };

  // ── Resolve target column + insertion index for a dragged TASK ──
  const resolveTaskTarget = (e: DragOverEvent | DragEndEvent): TaskLine => {
    const { active, over } = e;
    if (!over) return null;
    const overType = over.data.current?.type as string | undefined;
    const overColumnId = over.data.current?.columnId as string | undefined;
    if (!overColumnId) return null;

    const colTasks = (tasksByColumn[overColumnId] ?? []).filter((t) => t.id !== active.id);

    if (overType === 'column-dropzone') {
      return { columnId: overColumnId, index: colTasks.length };
    }

    if (overType === 'task') {
      const overIdx = colTasks.findIndex((t) => t.id === over.id);
      if (overIdx === -1) return { columnId: overColumnId, index: colTasks.length };
      const overRect = over.rect;
      const overCenterY = overRect.top + overRect.height / 2;
      return {
        columnId: overColumnId,
        index: pointerRef.current.y < overCenterY ? overIdx : overIdx + 1,
      };
    }
    return null;
  };

  const handleDragStart = ({ active }: DragStartEvent) => {
    if (active.data.current?.type === 'column') {
      setActiveColumn(columns.find((c) => c.id === active.id) ?? null);
    } else {
      setActiveTask(tasks.find((t) => t.id === active.id) ?? null);
    }
  };

  const handleDragOver = (e: DragOverEvent) => {
    // No insertion line for columns — only for tasks
    setTaskLine(e.active.data.current?.type === 'column' ? null : resolveTaskTarget(e));
  };

  const reset = () => {
    setActiveTask(null);
    setActiveColumn(null);
    setTaskLine(null);
  };

  const handleDragEnd = (e: DragEndEvent) => {
    const activeType = e.active.data.current?.type;

    if (activeType === 'column') {
      const target = resolveColumnTarget(e);
      if (target) {
        const without = sortedColumns.filter((c) => c.id !== e.active.id);
        let insertAt = without.findIndex((c) => c.id === target.columnId);
        if (target.side === 'right') insertAt += 1;
        const moved = sortedColumns.find((c) => c.id === e.active.id)!;
        without.splice(insertAt, 0, moved);
        moveColumn.mutate(without.map((c, i) => ({ id: c.id, position: i })));
      }
      reset();
      return;
    }

    const target = resolveTaskTarget(e);
    if (target) {
      const taskId = e.active.id as string;
      const movedTask = tasks.find((t) => t.id === taskId);
      if (movedTask) {
        const sourceCol = movedTask.column_id;
        const destCol = target.columnId;

        // Insert into destination list and reindex sequentially
        const dest = (tasksByColumn[destCol] ?? []).filter((t) => t.id !== taskId);
        dest.splice(target.index, 0, movedTask);

        const updates = dest.map((t, i) => ({ id: t.id, column_id: destCol, position: i }));

        // Moving across columns: also reindex the source column
        if (sourceCol !== destCol) {
          (tasksByColumn[sourceCol] ?? [])
            .filter((t) => t.id !== taskId)
            .forEach((t, i) => updates.push({ id: t.id, column_id: sourceCol, position: i }));
        }

        reorderTasks.mutate(updates);
      }
    }
    reset();
  };

  const submitColumn = async (ev?: FormEvent) => {
    ev?.preventDefault();
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

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={reset}
    >
      <SortableContext items={sortedColumns.map((c) => c.id)} strategy={horizontalListSortingStrategy}>
        <div className={styles.container}>
          {sortedColumns.map((col) => (
            <Column
              key={col.id}
              column={col}
              tasks={tasksByColumn[col.id] ?? []}
              boardId={boardId}
              onTaskClick={onTaskClick}
              taskLineIndex={taskLine?.columnId === col.id ? taskLine.index : null}
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
      </SortableContext>

      <DragOverlay>
        {activeTask && <TaskCard task={activeTask} overlay />}
        {activeColumn && (
          <div className={styles.columnOverlay}>
            <div className={styles.columnOverlayHeader}>
              <span className={styles.columnOverlayTitle}>{activeColumn.title}</span>
              <span className={styles.columnOverlayCount}>
                {(tasksByColumn[activeColumn.id] ?? []).length}
              </span>
            </div>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
