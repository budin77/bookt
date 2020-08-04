/* eslint-disable */

export const hideAlert = () => {
  const el = document.querySelector('.message');
  // if (el) el.parentElement.removeChild(el);
  if (el) el.remove();
};

// type is 'success' or 'error'
export const showAlert = (type, msg) => {
  hideAlert();
  const markup = `
    <div class="row justify-content-center message">
      <div class="col-md-6 alert alert-${type}" role="alert">${msg}</div>
    </div>`;
  document.querySelector('.msg').insertAdjacentHTML('afterbegin', markup);
};
