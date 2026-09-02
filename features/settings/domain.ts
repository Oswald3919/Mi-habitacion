import { PAYMENT_METHODS, type PaymentMethod } from '../finance/domain';
import { SCHOOL_DEFAULT_SETTINGS, type SchoolSettings } from '../school/domain';

export const HOME_MODULE_IDS = ['tasks', 'finance', 'goals', 'projects', 'school', 'room', 'ideas', 'history'] as const;
export type HomeModuleId = (typeof HOME_MODULE_IDS)[number];
export type Appearance = 'warm' | 'sage';
export type AppSettings = {
  room_notifications: boolean;
  profile_name: string;
  appearance: Appearance;
  visible_modules: HomeModuleId[];
  home_module_order: HomeModuleId[];
  school: SchoolSettings;
  finance_categories: string[];
  finance_payment_methods: PaymentMethod[];
};
export const DEFAULT_APP_SETTINGS: AppSettings = { room_notifications: false, profile_name: 'Armando', appearance: 'warm', visible_modules: [...HOME_MODULE_IDS], home_module_order: [...HOME_MODULE_IDS], school: SCHOOL_DEFAULT_SETTINGS, finance_categories: ['General', 'Comida', 'Transporte', 'Servicios', 'Escuela', 'Ahorro'], finance_payment_methods: [...PAYMENT_METHODS] };
