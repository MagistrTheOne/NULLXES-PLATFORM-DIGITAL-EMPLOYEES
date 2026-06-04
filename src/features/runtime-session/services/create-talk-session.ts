import { StreamClient } from "@stream-io/node-sdk";
import {
  getPublicStreamApiKey,
  getStreamApiKey,
  getStreamSecretKey,
} from "@/shared/config/env";
import { getEmployeeDetail } from "@/features/employees/services/get-employee-detail";

export type TalkSessionCredentials = {
  apiKey: string;
  token: string;
  userId: string;
  userName: string;
  callType: string;
  callId: string;
  employeeId: string;
  employeeName: string;
};

const TALK_CALL_TYPE = "development";

export async function createTalkSession(
  organizationId: string,
  employeeId: string,
  actorUserId: string,
  actorName: string,
): Promise<TalkSessionCredentials | null> {
  const employee = await getEmployeeDetail(organizationId, employeeId);

  if (!employee?.canTalk) {
    return null;
  }

  const apiKey = getStreamApiKey();
  const secret = getStreamSecretKey();
  const publicApiKey = getPublicStreamApiKey();

  if (!apiKey || !secret || !publicApiKey) {
    throw new Error(
      "STREAM_API_KEY and STREAM_SECRET_KEY must be configured for Talk sessions.",
    );
  }

  const client = new StreamClient(apiKey, secret);

  await client.upsertUsers([
    {
      id: actorUserId,
      name: actorName,
      role: "user",
    },
  ]);

  const callId = `employee-${employeeId}`;
  const call = client.video.call(TALK_CALL_TYPE, callId);

  await call.getOrCreate({
    data: {
      created_by_id: actorUserId,
      custom: {
        employeeId,
        employeeName: employee.name,
        organizationId,
      },
    },
  });

  const token = client.generateUserToken({
    user_id: actorUserId,
    validity_in_seconds: 60 * 60,
  });

  return {
    apiKey: publicApiKey,
    token,
    userId: actorUserId,
    userName: actorName,
    callType: TALK_CALL_TYPE,
    callId,
    employeeId,
    employeeName: employee.name,
  };
}
