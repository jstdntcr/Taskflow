export function formatDate(date: string): string {
  return new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(
    new Date(date)
  );
}

export function isOverdue(dueDate: string): boolean {
  return new Date(dueDate) < new Date();
}
