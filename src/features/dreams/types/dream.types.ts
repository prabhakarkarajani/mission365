export type DreamStatus = 'active' | 'archived';

export interface Dream {
  _id: string;
  userId: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  status: DreamStatus;
  createdAt: string;
  updatedAt: string;
}
