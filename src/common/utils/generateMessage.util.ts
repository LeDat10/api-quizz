export type Action =
  | 'created'
  | 'updated'
  | 'deleted'
  | 'restored'
  | 'fetched'
  | 'start'
  | 'failed';

export function generateMessage(
  action: Action,
  entity: string,
  id?: number | string,
  reason?: string,
) {
  const entityText = id ? `${entity} with ID ${id}` : entity;

  switch (action) {
    case 'start':
      return `Start ${entityText}`;
    case 'created':
      return `${entityText} created successfully`;
    case 'updated':
      return `${entityText} updated successfully`;
    case 'deleted':
      return `${entityText} deleted successfully`;
    case 'restored':
      return `${entityText} restored successfully`;
    case 'fetched':
      return `${entityText} fetched successfully`;
    case 'failed':
      return reason
        ? `${entityText} failed: ${reason}`
        : `${entityText} failed`;
    default:
      return `${entityText} processed`;
  }
}
