/* eslint-disable */
import '@babel/polyfill';
import { login, logout } from './login';
import { showMap } from './mapbox';

const map = document.getElementById('map');
const loginForm = document.getElementById('loginform');
const logoutButton = document.getElementById('logoutButton');

if (map) {
  showMap(JSON.parse(map.dataset.locations));
}

if (loginForm) {
  loginForm.addEventListener('submit', e => {
    e.preventDefault();
    const email = document.getElementById('inputEmail').value;
    const password = document.getElementById('inputPassword').value;
    login(email, password);
  });
}

if (logoutButton) {
  logoutButton.addEventListener('click', e => {
    e.preventDefault();
    logout();
  });
}
