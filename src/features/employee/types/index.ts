import type { EmployeeLifecycleEvent } from "@/entities/employee-lifecycle";
import type {
  AvatarProvider,
  BrainProvider,
  DigitalEmployee,
  EmployeeStatus,
} from "@/entities/digital-employee";
import type { EmployeeRuntime } from "@/entities/runtime";

export type CreateDigitalEmployeeInput = {
  organizationId: string;
  actorUserId: string;
  name: string;
  description?: string;
  role: string;
  avatarProvider: AvatarProvider;
  brainProvider: BrainProvider;
  systemPrompt: string;
  temperature?: number;
  maxTokens?: number;
  sessionLimitSeconds?: number;
  reason?: string;
};

export type CreateDigitalEmployeeResult = {
  employee: DigitalEmployee;
  runtime: EmployeeRuntime;
  lifecycleEvent: EmployeeLifecycleEvent;
};

export type ActivateDigitalEmployeeInput = {
  employeeId: string;
  actorUserId: string;
  /** Caller workspace — home org may mutate catalog-published employees. */
  organizationId?: string;
  reason?: string;
};

export type PauseDigitalEmployeeInput = {
  employeeId: string;
  actorUserId: string;
  organizationId?: string;
  reason?: string;
};

export type ArchiveDigitalEmployeeInput = {
  employeeId: string;
  actorUserId: string;
  organizationId?: string;
  reason?: string;
};

export type EmployeeStatusChangeResult = {
  employee: DigitalEmployee;
  lifecycleEvent: EmployeeLifecycleEvent;
  previousStatus: EmployeeStatus;
  nextStatus: EmployeeStatus;
};
