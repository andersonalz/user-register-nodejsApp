// /* eslint-disable */
// // import '@babel/polyfill';
// import { displayMap } from './mapbox';
// import { login, logout } from './login';
// import { updateSettings } from './updateSettings';
// import { bookTour } from './stripe';

// // DOM ELEMENTS
// const mapBox = document.getElementById('map');

const loginForm = document.querySelector('.form--login');
const loginFormByPhoneNumber = document.querySelector(
  '.form--loginByPhoneNumber',
);
const logOutBtn = document.querySelector('.nav__el--logout');
const resendCode = document.getElementById('resendverifycode');
const userDataForm = document.querySelector('.form-user-data');
const userPasswordForm = document.querySelector('.form-user-password');
const bookBtn = document.getElementById('book-tour');

// // DELEGATION
// if (mapBox) {
//   const locations = JSON.parse(mapBox.dataset.locations);
//   displayMap(locations);
// }
if (loginForm)
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    login(email, password);
  });

if (loginFormByPhoneNumber)
  loginFormByPhoneNumber.addEventListener('submit', (e) => {
    e.preventDefault();
    const submitButton = e.submitter;
    const phoneNumber = document.getElementById('phoneNumber').value;
    const verifyCodeInput = document.getElementById('verifyCodeInput');
    if (submitButton.id === 'resendverifycode') {
      sendSmsPhoneNumber(phoneNumber);
      return;
    }
    if (phoneNumber && !verifyCodeInput.value) {
      sendSmsPhoneNumber(phoneNumber);
    } else {
      loginByPhoneNumber(phoneNumber, verifyCodeInput.value);
    }
  });

const sendSmsPhoneNumber = async (phoneNumber) => {
  try {
    const res = await axios({
      method: 'GET',
      url: `/api/v1/users/sendSms/${phoneNumber}`,
      data: {
        phoneNumber,
      },
    });
    if (res.data.status === 'success') {
      document.getElementById('btnLogin').innerText = 'کد تایید را وارد کنید';
      document.getElementById('verifyCodeTitle').style.display = 'block';
      document.getElementById('verifyCodeInput').style.display = 'block';
      document.getElementById('resendverifycode').style.display = 'block';
      showAlert('success', 'send sms successfully!');
    } else {
      showAlert('error', 'try again');
    }
  } catch (err) {
    showAlert('error', err);
  }
};

const loginByPhoneNumber = async (phoneNumber, verifyCode) => {
  try {
    const res = await axios({
      method: 'POST',
      url: '/api/v1/users/loginByPhoneNumber',
      data: {
        phoneNumber,
        verifyCode,
      },
    });
    if (res.data.status === 'success') {
      showAlert('success', 'Logged in successfully!');
      window.setTimeout(() => {
        location.assign('/me');
      }, 1500);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};

if (logOutBtn) logOutBtn.addEventListener('click', logout);

if (userDataForm)
  userDataForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const form = new FormData();

    document.querySelectorAll('.form__input').forEach((input) => {
      form.append(input.name, input.value);
    });

    console.log('🚀 ~ form:', form);

    updateSettings(form, 'data');
  });

if (userPasswordForm)
  userPasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    document.querySelector('.btn--save-password').textContent = 'Updating...';

    const passwordCurrent = document.getElementById('password-current').value;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('password-confirm').value;
    await updateSettings(
      { passwordCurrent, password, passwordConfirm },
      'password',
    );

    document.querySelector('.btn--save-password').textContent = 'Save password';
    document.getElementById('password-current').value = '';
    document.getElementById('password').value = '';
    document.getElementById('password-confirm').value = '';
  });

if (bookBtn)
  bookBtn.addEventListener('click', (e) => {
    e.target.textContent = 'Processing...';
    const { tourId } = e.target.dataset;
    bookTour(tourId);
  });

const alertMessage = document.querySelector('body').dataset.alert;
if (alertMessage) showAlert('success', alertMessage, 20);

const login = async (email, password) => {
  try {
    const res = await axios({
      method: 'POST',
      url: '/api/v1/users/login',
      data: {
        email,
        password,
      },
    });

    if (res.data.status === 'success') {
      showAlert('success', 'Logged in successfully!');
      window.setTimeout(() => {
        location.assign('/');
      }, 1500);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};

const logout = async () => {
  try {
    const res = await axios({
      method: 'GET',
      url: '/api/v1/users/logout',
    });
    if ((res.data.status = 'success')) location.reload(true);
  } catch (err) {
    console.log(err.response);
    showAlert('error', 'Error logging out! Try again.');
  }
};

////////////////////////////////////////////////////////////////////////////////////////alert
const hideAlert = () => {
  const el = document.querySelector('.alert');
  if (el) el.parentElement.removeChild(el);
};

// type is 'success' or 'error'
const showAlert = (type, msg, time = 7) => {
  hideAlert();
  const markup = `<div class="alert alert--${type}">${msg}</div>`;
  document.querySelector('body').insertAdjacentHTML('afterbegin', markup);
  window.setTimeout(hideAlert, time * 1000);
};
////////////////////////////////////////////////////////////////////////////////////update setting
const updateSettings = async (data, type) => {
  try {
    const url =
      type === 'password'
        ? '/api/v1/users/updateMyPassword'
        : '/api/v1/users/updateMe';

    const res = await axios({
      method: 'PATCH',
      url,
      data,
    });

    if (res.data.status === 'success') {
      showAlert('success', `${type.toUpperCase()} updated successfully!`);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};
