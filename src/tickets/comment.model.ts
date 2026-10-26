export interface Comment {
  readonly id: number;
  ticketId: number;
  authorId: number;
  text: string;
  createdAt: string;
}
