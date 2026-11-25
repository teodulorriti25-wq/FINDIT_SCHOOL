// Sesión del usuario y llamadas a la API
export const sesion = { token: localStorage.t || '', user: JSON.parse(localStorage.u || 'null') };

export function guardar(token, user) {
  sesion.token = token; sesion.user = user;
  localStorage.t = token; localStorage.u = JSON.stringify(user);
}
export function salir() {
  sesion.token = ''; sesion.user = null;
  localStorage.clear();
  location.hash = '#/login';
}
export async function api(url, o = {}) {
  const esForm = o.body instanceof FormData;
  const r = await fetch('/api' + url, {
    ...o,
    headers: { ...(esForm ? {} : { 'Content-Type': 'application/json' }), ...(sesion.token && { Authorization: 'Bearer ' + sesion.token }) },
    body: o.body && !esForm ? JSON.stringify(o.body) : o.body
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) {
    if (r.status === 401 && sesion.token) salir();
    throw new Error(d.error || 'Algo salió mal');
  }
  return d;
}
