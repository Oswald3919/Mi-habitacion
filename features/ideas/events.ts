export const IDEAS_CHANGED_EVENT = 'mi-habitacion:ideas-changed';
export const IDEA_CREATE_EVENT = 'mi-habitacion:idea-create';
export const IDEA_EDIT_EVENT = 'mi-habitacion:idea-edit';
export const notifyIdeasChanged = () => window.dispatchEvent(new Event(IDEAS_CHANGED_EVENT));
export const requestIdeaCreation = () => window.dispatchEvent(new Event(IDEA_CREATE_EVENT));
export const requestIdeaEdit = (ideaId: string) => window.dispatchEvent(new CustomEvent(IDEA_EDIT_EVENT, { detail: { ideaId } }));
