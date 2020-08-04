/* eslint-disable */
import axios from 'axios';
import { showAlert, hideAlert } from './messages';

export const login = async (email, password) => {
  try {
    const res = await axios({
      method: 'post',
      url: '/api/v1/users/login',
      data: {
        email,
        password
      }
    });

    if (res.data.status === 'success') {
      //window.setTimeout(() => location.assign('/'), 1500);
      location.assign('/');
    }
  } catch (err) {
    showAlert('danger', err.response.data.message);
  }
};

export const logout = async () => {
  try {
    const res = await axios({
      method: 'GET',
      url: '/api/v1/users/logout'
    });

    if (res.data.status === 'success')
      //location.reload(true);
      location.assign('/');
  } catch (err) {
    showAlert('danger', err.response.data.message);
  }
};
