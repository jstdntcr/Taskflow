// TODO: board header (title, members, back button) + ColumnList
import { useParams } from 'react-router-dom';
import { ColumnList } from '../components/board/ColumnList';

export function BoardPage() {
  const { boardId } = useParams<{ boardId: string }>();
  return <ColumnList boardId={boardId!} />;
}
