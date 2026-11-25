import { api, guardar } from '../api.js';
import { $, app } from '../utils.js';

let modo = 'login';

// Pantalla dividida: marca a la izquierda, formulario a la derecha
const dividida = interior => `<div class="auth-split">
  <section class="auth-marca"><div><div class="auth-logo">FindIt <span>School</span></div><p>Tus objetos. De regreso.</p></div></section>
  <section class="auth-form">${interior}</section></div>`;

export function login() {
  const reg = modo === 'registro';
  app.innerHTML = dividida(`<form id="f"><h1>${reg ? 'Crea tu cuenta' : 'Bienvenido de nuevo'}</h1>
  ${reg ? '<div class="campo-f"><input id="n" placeholder="Nombre completo" aria-label="Nombre completo" required minlength="2" autocomplete="name"></div>' : ''}
  <div class="campo-f"><input id="c" type="email" placeholder="Correo electrónico" aria-label="Correo electrónico" required autocomplete="email"></div>
  <div class="campo-f"><input id="p" type="password" placeholder="Contraseña" aria-label="Contraseña" required minlength="6" autocomplete="${reg ? 'new-password' : 'current-password'}"></div>
  ${reg ? '' : '<p class="derecha"><a href="#/recuperar">Recuperación de contraseña</a></p>'}
  <p id="e" class="err" role="alert"></p>
  <button class="btn block">${reg ? 'Crear cuenta' : 'Iniciar sesión'}</button>
  <p class="pie">${reg ? '¿Ya tienes una cuenta?' : '¿No tienes una cuenta?'} <a href="#/login" id="t">${reg ? 'Inicia sesión' : 'Regístrate'}</a></p></form>`);
  $('#t').onclick = e => { e.preventDefault(); modo = reg ? 'login' : 'registro'; login(); };
  $('#f').onsubmit = async e => {
    e.preventDefault();
    try {
      const d = await api(reg ? '/registro' : '/login', { method: 'POST', body: { nombre: $('#n')?.value, correo: $('#c').value, password: $('#p').value } });
      guardar(d.token, d.user);
      location.hash = '#/';
    } catch (x) { $('#e').textContent = x.message; }
  };
}

export function recuperar() {
  app.innerHTML = dividida(`<form id="f"><h1>Recupera tu contraseña</h1>
  <p class="sub" style="text-align:center">Escribe tu correo y te enviamos un enlace para crear una nueva. Dura una hora.</p>
  <div class="campo-f"><input id="c" type="email" placeholder="Correo electrónico" aria-label="Correo electrónico" required autocomplete="email"></div>
  <p id="e" class="err" role="alert"></p><button class="btn block">Enviar enlace</button>
  <p class="pie"><a href="#/login">Volver a iniciar sesión</a></p></form>`);
  $('#f').onsubmit = async e => {
    e.preventDefault();
    try {
      await api('/recuperar', { method: 'POST', body: { correo: $('#c').value } });
      $('#f').innerHTML = `<h1>Revisa tu correo</h1><p class="msg" style="text-align:center">Si ese correo tiene una cuenta, ya te mandamos el enlace.</p>
        <p class="hint" style="text-align:center">Si no llega en unos minutos, busca en la carpeta de spam.</p><p class="pie"><a href="#/login">Volver a iniciar sesión</a></p>`;
    } catch (x) { $('#e').textContent = x.message; }
  };
}

export function restablecer(token) {
  app.innerHTML = dividida(`<form id="f"><h1>Crea una contraseña nueva</h1>
  <div class="campo-f"><input id="p" type="password" placeholder="Contraseña nueva" aria-label="Contraseña nueva" required minlength="6" autocomplete="new-password"></div>
  <div class="campo-f"><input id="q" type="password" placeholder="Repite la contraseña" aria-label="Repite la contraseña" required minlength="6" autocomplete="new-password"></div>
  <p id="e" class="err" role="alert"></p><button class="btn block">Guardar contraseña</button></form>`);
  $('#f').onsubmit = async e => {
    e.preventDefault();
    if ($('#p').value !== $('#q').value) { $('#e').textContent = 'Las contraseñas no coinciden'; return; }
    try {
      await api('/restablecer', { method: 'POST', body: { token, password: $('#p').value } });
      modo = 'login';
      $('#f').innerHTML = '<h1>Listo</h1><p class="msg" style="text-align:center">Tu contraseña cambió.</p><a class="btn block" href="#/login">Iniciar sesión</a>';
    } catch (x) { $('#e').innerHTML = `${x.message} <a href="#/recuperar">Pedir un enlace nuevo</a>`; }
  };
}
