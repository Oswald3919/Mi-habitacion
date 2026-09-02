export const SETTINGS_CHANGED_EVENT = 'mi-habitacion:settings-changed';
export const notifySettingsChanged = () => window.dispatchEvent(new Event(SETTINGS_CHANGED_EVENT));
