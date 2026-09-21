// Últimos contatos escolhidos na busca (as bolinhas ao abrir a pesquisa).
// Ficam só neste navegador, separados por empresa e por usuário.
const LIMIT = 5;

const keyOf = user => `recentContacts:${user?.companyId}:${user?.id}`;

export const getRecentContacts = user => {
  try {
    const list = JSON.parse(localStorage.getItem(keyOf(user)) || "[]");
    return Array.isArray(list) ? list.slice(0, LIMIT) : [];
  } catch {
    return [];
  }
};

export const addRecentContact = (user, contact) => {
  if (!contact?.id || contact.isGroup) return getRecentContacts(user);
  const { id, name, number, profilePicUrl } = contact;
  const list = [
    { id, name, number, profilePicUrl },
    ...getRecentContacts(user).filter(c => c.id !== id)
  ].slice(0, LIMIT);
  try {
    localStorage.setItem(keyOf(user), JSON.stringify(list));
  } catch {
    // navegador sem espaço ou em modo privado: segue sem guardar
  }
  return list;
};
