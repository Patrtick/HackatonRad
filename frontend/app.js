document.addEventListener('DOMContentLoaded', () => {
  const auth = firebase.auth();
  const db = firebase.firestore();

  const signupForm = document.getElementById('signup-form');
  const signinForm = document.getElementById('signin-form');
  const switchToSignin = document.getElementById('switch-to-signin');
  const switchToSignup = document.getElementById('switch-to-signup');
  const logoutBtn = document.getElementById('logout-btn');

  // Обработка выбора роли
  document.querySelectorAll('.role-btn').forEach(button => {
    button.addEventListener('click', () => {
      document.querySelectorAll('.role-btn').forEach(btn => btn.classList.remove('selected'));
      button.classList.add('selected');
      document.getElementById('signup-role').value = button.dataset.role;
    });
  });

  // Проверка состояния авторизации
  auth.onAuthStateChanged((user) => {
    if (user) {
      console.log('Пользователь авторизован:', user.uid);
      redirectUser(user.uid);
    } else {
      console.log('Пользователь не авторизован');
      showAuthForms();
    }
  });

  // Переключение форм
  switchToSignin.addEventListener('click', (e) => {
    e.preventDefault();
    signupForm.style.display = 'none';
    signinForm.style.display = 'flex';
    document.getElementById('signup-error').textContent = '';
  });

  switchToSignup.addEventListener('click', (e) => {
    e.preventDefault();
    signinForm.style.display = 'none';
    signupForm.style.display = 'flex';
    document.getElementById('signin-error').textContent = '';
  });

  // Регистрация
  signupForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('signup-confirm-password').value;
    const role = document.getElementById('signup-role').value;
    const errorElement = document.getElementById('signup-error');

    if (password !== confirmPassword) {
      errorElement.textContent = 'Пароли не совпадают';
      return;
    }

    if (!role) {
      errorElement.textContent = 'Выберите роль';
      return;
    }

    if (password.length < 6) {
      errorElement.textContent = 'Пароль должен содержать минимум 6 символов';
      return;
    }

    console.log('Попытка регистрации:', { email, role });

    auth.createUserWithEmailAndPassword(email, password)
      .then((userCredential) => {
        const user = userCredential.user;
        console.log('Пользователь создан в Authentication:', user.uid);
        return db.collection('users').doc(user.uid).set({ role })
          .then(() => {
            console.log('Роль успешно сохранена в Firestore:', role);
            redirectUser(user.uid);
            signupForm.reset();
            errorElement.textContent = '';
          });
      })
      .catch((error) => {
        errorElement.textContent = translateError(error.code);
        console.error('Ошибка регистрации:', error.message);
      });
  });

  // Вход
  signinForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('signin-email').value;
    const password = document.getElementById('signin-password').value;
    const errorElement = document.getElementById('signin-error');

    console.log('Попытка входа:', { email });

    auth.signInWithEmailAndPassword(email, password)
      .then((userCredential) => {
        console.log('Вход успешен:', userCredential.user.uid);
        redirectUser(userCredential.user.uid);
        signinForm.reset();
        errorElement.textContent = '';
      })
      .catch((error) => {
        errorElement.textContent = translateError(error.code);
        console.error('Ошибка входа:', error.message);
      });
  });

  // Выход
  logoutBtn.addEventListener('click', () => {
    auth.signOut()
      .then(() => {
        console.log('Пользователь вышел');
        showAuthForms();
      })
      .catch((error) => console.error('Ошибка выхода:', error));
  });

  // Функция редиректа по роли
  function redirectUser(uid) {
    console.log('Получение роли для пользователя:', uid);
    db.collection('users').doc(uid).get()
      .then((doc) => {
        if (doc.exists) {
          const role = doc.data().role;
          console.log('Роль найдена:', role);
          loadSection(role);
          document.getElementById('auth-container').style.display = 'none';
          document.getElementById('main-content').style.display = 'block';
          logoutBtn.style.display = 'block';
        } else {
          console.error('Документ пользователя не найден в Firestore!');
          document.getElementById('signup-error').textContent = 'Ошибка: данные пользователя не найдены';
        }
      })
      .catch((error) => {
        console.error('Ошибка при получении роли:', error);
        document.getElementById('signup-error').textContent = 'Ошибка получения данных';
      });
  }

  // Показ форм авторизации
  function showAuthForms() {
    document.getElementById('auth-container').style.display = 'block';
    document.getElementById('main-content').style.display = 'none';
    signupForm.style.display = 'flex';
    signinForm.style.display = 'none';
    logoutBtn.style.display = 'none';
  }

  // Загрузка секции кабинета
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

  // Перевод ошибок Firebase на русский
  function translateError(code) {
    switch (code) {
      case 'auth/email-already-in-use': return 'Этот email уже зарегистрирован';
      case 'auth/invalid-email': return 'Некорректный email';
      case 'auth/weak-password': return 'Пароль слишком слабый (мин. 6 символов)';
      case 'auth/user-not-found':
      case 'auth/wrong-password': return 'Неверный email или пароль';
      default: return 'Произошла ошибка. Попробуйте снова';
    }
  }
});