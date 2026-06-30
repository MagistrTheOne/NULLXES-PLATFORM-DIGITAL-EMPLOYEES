export type PendingApprovalRow = {
  id: string;
  employeeId: string;
  employeeName: string;
  taskId: string | null;
  actionType: string;
  payload: Record<string, unknown>;
  createdAt: Date;
  expiresAt: Date | null;
};
