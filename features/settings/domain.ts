import { PAYMENT_METHODS, type PaymentMethod } from '../finance/domain';
import { SCHOOL_DEFAULT_SETTINGS, type SchoolSettings } from '../school/domain';

export const HOME_MODULE_IDS = ['tasks', 'finance', 'goals', 'projects', 'school', 'room', 'ideas', 'history'] as const;
export type HomeModuleId = (typeof HOME_MODULE_IDS)[number];
export type Appearance = 'warm' | 'sage' | 'gray' | 'dark';
export type Accent = 'green' | 'terracotta' | 'blue' | 'purple' | 'amber' | 'pink';
export type AppSettings = {
  room_notifications: boolean;
  profile_name: string;
  appearance: Appearance;
  accent: Accent;
  visible_modules: HomeModuleId[];
  home_module_order: HomeModuleId[];
  school: SchoolSettings;
  finance_categories: string[];
  finance_payment_methods: PaymentMethod[];
};
export const DEFAULT_APP_SETTINGS: AppSettings = { room_notifications: false, profile_name: 'Armando', appearance: 'warm', accent: 'green', visible_modules: [...HOME_MODULE_IDS], home_module_order: [...HOME_MODULE_IDS], school: SCHOOL_DEFAULT_SETTINGS, finance_categories: ['General', 'Comida', 'Transporte', 'Servicios', 'Escuela', 'Ahorro'], finance_payment_methods: [...PAYMENT_METHODS] };

export const APPEARANCES: Array<{ id: Appearance; label: string }> = [
  { id: 'warm', label: 'Crema cálido' },
  { id: 'sage', label: 'Verde suave' },
  { id: 'gray', label: 'Gris elegante' },
  { id: 'dark', label: 'Oscuro' },
];

export const ACCENTS: Array<{ id: Accent; label: string }> = [
  { id: 'green', label: 'Verde' },
  { id: 'terracotta', label: 'Terracota' },
  { id: 'blue', label: 'Azul' },
  { id: 'purple', label: 'Morado' },
  { id: 'amber', label: 'Ámbar' },
  { id: 'pink', label: 'Rosa suave' },
];

export function normalizeAppSettings(value: Partial<AppSettings>): AppSettings {
  const appearance = APPEARANCES.some((item) => item.id === value.appearance) ? value.appearance as Appearance : DEFAULT_APP_SETTINGS.appearance;
  const accent = ACCENTS.some((item) => item.id === value.accent) ? value.accent as Accent : DEFAULT_APP_SETTINGS.accent;
  const visible = Array.isArray(value.visible_modules) ? value.visible_modules.filter((id): id is HomeModuleId => HOME_MODULE_IDS.includes(id as HomeModuleId)) : [...DEFAULT_APP_SETTINGS.visible_modules];
  const order = Array.isArray(value.home_module_order) ? value.home_module_order.filter((id): id is HomeModuleId => HOME_MODULE_IDS.includes(id as HomeModuleId)) : [...DEFAULT_APP_SETTINGS.home_module_order];
  const paymentMethods = Array.isArray(value.finance_payment_methods) ? value.finance_payment_methods.filter((method): method is PaymentMethod => PAYMENT_METHODS.includes(method as PaymentMethod)) : [...DEFAULT_APP_SETTINGS.finance_payment_methods];
  return { ...DEFAULT_APP_SETTINGS, ...value, appearance, accent, visible_modules: visible, home_module_order: order, finance_categories: Array.isArray(value.finance_categories) ? value.finance_categories : [...DEFAULT_APP_SETTINGS.finance_categories], finance_payment_methods: paymentMethods, school: { ...DEFAULT_APP_SETTINGS.school, ...(value.school ?? {}) } };
}
