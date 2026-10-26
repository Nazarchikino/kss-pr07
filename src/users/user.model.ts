export type Role = 'student' | 'teacher' | 'admin';

export interface User {
  readonly id: number;
  fullName: string;
  email: string;
  role: Role;
}
