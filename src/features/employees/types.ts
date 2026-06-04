import type {
  AvatarProvider,
  BrainProvider,
  EmployeeStatus,
} from "@/entities/digital-employee";

export type EmployeeListItem = {
  id: string;
  name: string;
  role: string;
  status: EmployeeStatus;
  avatarProvider: AvatarProvider;
  brainProvider: BrainProvider;
  knowledgeSourcesCount: number;
  createdAt: Date;
};
