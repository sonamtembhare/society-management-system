import * as settingsModel from "../models/settings.model";

export interface MaintenanceRates {
  [flatType: string]: number;
}

export interface AppSettings {
  rates: MaintenanceRates;
  lateFee: number;
  dueDay: number;
  currency: string;
}

const DEFAULT_RATES: MaintenanceRates = {
  "1BHK": 1500,
  "2BHK": 2500,
  "3BHK": 3500,
  "4BHK": 5000,
  "Studio": 1000,
};

export const getAllSettings = async (): Promise<settingsModel.SettingRow[]> => {
  return settingsModel.findAll();
};

export const getSetting = async (key: string): Promise<string | null> => {
  const setting = await settingsModel.findByKey(key);
  return setting?.value ?? null;
};

export const getAppSettings = async (): Promise<AppSettings> => {
  const keys = [
    "rate_1BHK", "rate_2BHK", "rate_3BHK", "rate_4BHK", "rate_Studio",
    "late_fee", "due_day", "currency",
  ];
  const values = await settingsModel.findByKeys(keys);

  const rates: MaintenanceRates = {};
  for (const [key, value] of Object.entries(values)) {
    if (key.startsWith("rate_")) {
      const flatType = key.replace("rate_", "");
      rates[flatType] = Number(value) || 0;
    }
  }

  return {
    rates: Object.keys(rates).length > 0 ? rates : DEFAULT_RATES,
    lateFee: Number(values.late_fee) || 50,
    dueDay: Number(values.due_day) || 5,
    currency: values.currency || "INR",
  };
};

export const getRateForFlatType = async (flatType: string): Promise<number> => {
  const settings = await getAppSettings();
  return settings.rates[flatType] ?? 0;
};

export const updateSettings = async (
  data: { key: string; value: string; description?: string }[]
): Promise<settingsModel.SettingRow[]> => {
  const results: settingsModel.SettingRow[] = [];
  for (const item of data) {
    const result = await settingsModel.upsert(item.key, item.value, item.description);
    results.push(result);
  }
  return results;
};
