export const PROJECTS_CHANGED_EVENT = 'mi-habitacion:projects-changed';
export const PROJECT_CREATE_EVENT = 'mi-habitacion:project-create';
export const PROJECT_EDIT_EVENT = 'mi-habitacion:project-edit';
export const notifyProjectsChanged = () => window.dispatchEvent(new Event(PROJECTS_CHANGED_EVENT));
export const requestProjectCreation = () => window.dispatchEvent(new Event(PROJECT_CREATE_EVENT));
export const requestProjectEdit = (projectId: string) => window.dispatchEvent(new CustomEvent(PROJECT_EDIT_EVENT, { detail: { projectId } }));
