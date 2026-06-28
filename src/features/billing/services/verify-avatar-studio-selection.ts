import { assertAvatarStudioSelection } from "./assert-avatar-studio-selection";

function expectFailure(
  label: string,
  result: ReturnType<typeof assertAvatarStudioSelection>,
): void {
  if (result.ok) {
    throw new Error(`${label}: expected failure, got ${result.mode}`);
  }
}

function expectPreset(
  label: string,
  result: ReturnType<typeof assertAvatarStudioSelection>,
): void {
  if (!result.ok || result.mode !== "preset") {
    throw new Error(`${label}: expected preset mode`);
  }
}

function expectCustom(
  label: string,
  result: ReturnType<typeof assertAvatarStudioSelection>,
): void {
  if (!result.ok || result.mode !== "custom") {
    throw new Error(`${label}: expected custom mode`);
  }
}

function verifyAvatarStudioSelection(): void {
  expectFailure(
    "free rejects arbitrary anam id in preset field",
    assertAvatarStudioSelection("free", {
      presetAvatarId: "anam-custom-avatar-uuid-12345",
      hasPhotoFile: false,
    }),
  );

  expectFailure(
    "free rejects custom file upload",
    assertAvatarStudioSelection("free", {
      presetAvatarId: "",
      hasPhotoFile: true,
    }),
  );

  expectFailure(
    "free rejects preset plus file combo",
    assertAvatarStudioSelection("free", {
      presetAvatarId: "somnia",
      hasPhotoFile: true,
    }),
  );

  expectPreset(
    "free accepts workforce preset slug",
    assertAvatarStudioSelection("free", {
      presetAvatarId: "kaira",
      hasPhotoFile: false,
    }),
  );

  expectCustom(
    "super pro accepts custom file",
    assertAvatarStudioSelection("super_pro", {
      presetAvatarId: "",
      hasPhotoFile: true,
    }),
  );

  expectFailure(
    "super pro rejects invalid preset id",
    assertAvatarStudioSelection("super_pro", {
      presetAvatarId: "not-a-real-preset",
      hasPhotoFile: false,
    }),
  );

  console.log("Avatar studio selection verification: OK");
}

verifyAvatarStudioSelection();
