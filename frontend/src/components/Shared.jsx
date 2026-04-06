import { HiOutlineInbox } from 'react-icons/hi';

export function Loader() {
  return (
    <div className="loader">
      <div className="spinner"></div>
    </div>
  );
}

export function EmptyState({ icon = <HiOutlineInbox />, title, message }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">{icon}</div>
      <h3>{title || 'No data found'}</h3>
      <p>{message || 'Nothing here yet. Create your first item to get started.'}</p>
    </div>
  );
}
