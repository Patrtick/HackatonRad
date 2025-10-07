document.addEventListener('DOMContentLoaded', () => {
  const auth = firebase.auth();
  const signupForm = document.getElementById('signup-form');
  const signinForm = document.getElementById('signin-form');
  const switchToSignin = document.getElementById('switch-to-signin');
  const switchToSignup = document.getElementById('switch-to-signup');
  const logoutBtn = document.getElementById('logout-btn');

  // Проверка состояния авторизации
  auth.onAuthStateChanged((user) => {
    if (user) {
      // Пользователь авторизован
      showMainContent();
      logoutBtn.style.display = 'block';
      console.log('Пользователь авторизован:', user.uid);
    } else {
      // Пользователь не авторизован
      showAuthForms();
      logoutBtn.style.display = 'none';
      console.log('Пользователь не авторизован');
    }
  });

  // Переключение на форму входа
  switchToSignin.addEventListener('click', (e) => {
    e.preventDefault();
    signupForm.style.display = 'none';
    signinForm.style.display = 'flex';
    document.getElementById('signup-error').textContent = '';
  });

  // Переключение на форму регистрации
  switchToSignup.addEventListener('click', (e) => {
    e.preventDefault();
    signinForm.style.display = 'none';
    signupForm.style.display = 'flex';
    document.getElementById('signin-error').textContent = '';
  });

  // Обработчик формы регистрации
  signupForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('signup-confirm-password').value;
    const errorElement = document.getElementById('signup-error');

    if (password !== confirmPassword) {
      errorElement.textContent = 'Пароли не совпадают';
      return;
    }

    auth.createUserWithEmailAndPassword(email, password)
      .then((userCredential) => {
        errorElement.textContent = '';
        // Очищаем поля только при успехе
        document.getElementById('signup-email').value = '';
        document.getElementById('signup-password').value = '';
        document.getElementById('signup-confirm-password').value = '';
        showMainContent();
      })
      .catch((error) => {
        errorElement.textContent = translateError(error.code);
        console.error('Ошибка регистрации:', error.message);
      });
  });

  // Обработчик формы авторизации
  signinForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('signin-email').value;
    const password = document.getElementById('signin-password').value;
    const errorElement = document.getElementById('signin-error');

    auth.signInWithEmailAndPassword(email, password)
      .then((userCredential) => {
        errorElement.textContent = '';
        // Очищаем поля только при успехе
        document.getElementById('signin-email').value = '';
        document.getElementById('signin-password').value = '';
        showMainContent();
      })
      .catch((error) => {
        errorElement.textContent = translateError(error.code);
        console.error('Ошибка авторизации:', error.message);
      });
  });

  // Обработчик выхода
  logoutBtn.addEventListener('click', () => {
    auth.signOut()
      .then(() => {
        showAuthForms();
      })
      .catch((error) => {
        console.error('Ошибка выхода:', error);
      });
  });

  // Обработчики выбора роли
  document.getElementById('employer-btn').addEventListener('click', () => {
    loadSection('employer');
  });

  document.getElementById('employee-btn').addEventListener('click', () => {
    loadSection('employee');
  });

  // Функция переключения на основной контент
  function showMainContent() {
    document.getElementById('auth-container').style.display = 'none';
    document.getElementById('main-content').style.display = 'block';
  }

  // Функция показа форм авторизации (по умолчанию регистрация)
  function showAuthForms() {
    document.getElementById('auth-container').style.display = 'block';
    document.getElementById('main-content').style.display = 'none';
    signupForm.style.display = 'flex';
    signinForm.style.display = 'none';
  }

  // Функция загрузки секции
  function loadSection(role) {
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = '';

    if (role === 'employer') {
      mainContent.innerHTML = `
        <section id="employer">
          <h2>Кабинет компании</h2>
          <div class="section-content">
            <div class="card">
              <h3>Управление сотрудниками</h3>
              <p>Добавляйте, редактируйте и управляйте данными сотрудников.</p>
            </div>
            <div class="card">
              <h3>Отчётность</h3>
              <p>Формируйте отчёты по налогам и выплатам.</p>
            </div>
            <div class="card">
              <h3>Платежи</h3>
              <p>Управляйте выплатами и расчётами.</p>
            </div>
          </div>
        </section>
      `;
    } else if (role === 'employee') {
      mainContent.innerHTML = `
        <section id="employee">
          <h2>Кабинет сотрудника</h2>
          <div class="section-content">
            <div class="card">
              <h3>Документы</h3>
              <p>Просматривайте и загружайте необходимые документы.</p>
            </div>
            <div class="card">
              <h3>Выплаты</h3>
              <p>Следите за историей ваших выплат.</p>
            </div>
            <div class="card">
              <h3>Справки</h3>
              <p>Получайте справки и другие документы.</p>
            </div>
          </div>
        </section>
      `;
    }
  }

  // Функция перевода ошибок Firebase на русский
  function translateError(code) {
    switch (code) {
      case 'auth/email-already-in-use':
        return 'Этот email уже зарегистрирован';
      case 'auth/invalid-email':
        return 'Некорректный email';
      case 'auth/weak-password':
        return 'Пароль слишком слабый (мин. 6 символов)';
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        return 'Неверный email или пароль';
      default:
        return 'Произошла ошибка. Попробуйте снова';
    }
  }
});