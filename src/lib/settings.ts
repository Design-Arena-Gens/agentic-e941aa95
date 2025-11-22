import prisma from "./prisma";

export type SettingsPayload = {
  minimumQuality: number;
  indicatorSensitivity: number;
};

const DEFAULT_SETTINGS: SettingsPayload = {
  minimumQuality: 60,
  indicatorSensitivity: 1,
};

export async function getSettings(): Promise<SettingsPayload> {
  const settings = await prisma.setting.findFirst();
  if (settings) {
    return {
      minimumQuality: settings.minimumQuality,
      indicatorSensitivity: settings.indicatorSensitivity,
    };
  }

  const created = await prisma.setting.create({
    data: {
      minimumQuality: DEFAULT_SETTINGS.minimumQuality,
      indicatorSensitivity: DEFAULT_SETTINGS.indicatorSensitivity,
    },
  });

  return {
    minimumQuality: created.minimumQuality,
    indicatorSensitivity: created.indicatorSensitivity,
  };
}

export async function updateSettings(
  payload: SettingsPayload,
): Promise<SettingsPayload> {
  const updated = await prisma.setting.upsert({
    where: { id: 1 },
    create: {
      minimumQuality: payload.minimumQuality,
      indicatorSensitivity: payload.indicatorSensitivity,
    },
    update: {
      minimumQuality: payload.minimumQuality,
      indicatorSensitivity: payload.indicatorSensitivity,
    },
  });

  return {
    minimumQuality: updated.minimumQuality,
    indicatorSensitivity: updated.indicatorSensitivity,
  };
}
