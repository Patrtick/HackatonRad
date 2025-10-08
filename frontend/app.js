document.addEventListener('DOMContentLoaded', () => {
  const auth = firebase.auth();
  const db = firebase.firestore();
  const signupForm = document.getElementById('signup-form');
  const signinForm = document.getElementById('signin-form');
  const switchToSignin = document.getElementById('switch-to-signin');
  const switchToSignup = document.getElementById('switch-to-signup');
  const logoutBtn = document.getElementById('logout-btn');
  let currentUser = null;
  let currentChatId = null;

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
      currentUser = user;
      redirectUser(user.uid);
    } else {
      console.log('Пользователь не авторизован');
      currentUser = null;
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
        return db.collection('users').doc(user.uid).set({ 
          role: role,
          email: email,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        })
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
          const userData = doc.data();
          const role = userData.role;
          console.log('Роль найдена:', role);
          loadSection(role, uid, userData);
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
  function loadSection(role, uid, userData) {
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = '';
    if (role === 'employer') {
      loadEmployerSection(uid, userData);
    } else if (role === 'employee') {
      loadEmployeeSection(uid, userData);
    }
  }

  // Кабинет компании
  function loadEmployerSection(uid, userData) {
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `
      <section id="employer">
        <h2>Кабинет компании</h2>
        <div class="section-content">
          <div class="card" onclick="showInviteForm()">
            <h3>📧 Пригласить работника</h3>
            <p>Отправьте приглашение по email</p>
          </div>
          <div class="card" onclick="showActiveChats()">
            <h3>💬 Активные чаты</h3>
            <p>Общайтесь с работниками</p>
          </div>
          <div class="card" onclick="showEmployees()">
            <h3>👥 Сотрудники</h3>
            <p>Управление сотрудниками</p>
          </div>
          <div class="card">
            <h3>📊 Отчётность</h3>
            <p>Формируйте отчёты</p>
          </div>
        </div>
        <div id="employer-content"></div>
      </section>
    `;

    window.showInviteForm = showInviteForm;
    window.showActiveChats = showActiveChats;
    window.showEmployees = showEmployees;

    function showInviteForm() {
      const content = document.getElementById('employer-content');
      content.innerHTML = `
        <div class="invite-form" style="margin-top: 20px; padding: 20px; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h3>Отправить приглашение</h3>
          <input type="email" id="employee-email" placeholder="Email работника" style="width: 100%; padding: 12px; margin: 10px 0; border: 1px solid #ddd; border-radius: 6px; font-size: 14px;">
          <textarea id="invite-message" placeholder="Сообщение приглашения (опционально)" style="width: 100%; padding: 12px; margin: 10px 0; border: 1px solid #ddd; border-radius: 6px; height: 80px; font-size: 14px; resize: vertical;"></textarea>
          <button onclick="sendInvitation()" style="background: #1a3c6e; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-size: 14px; margin-right: 10px;">Отправить приглашение</button>
          <button onclick="clearInviteForm()" style="background: #6c757d; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-size: 14px;">Очистить</button>
          <div id="invite-result" style="margin-top: 15px; min-height: 20px;"></div>
        </div>
      `;
    }

    function showActiveChats() {
      const content = document.getElementById('employer-content');
      content.innerHTML = `
        <div class="chats-list" style="margin-top: 20px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
            <h3>Активные чаты</h3>
            <button onclick="refreshChats()" style="background: #1a3c6e; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 12px;">🔄 Обновить</button>
          </div>
          <div id="chats-container" style="max-height: 500px; overflow-y: auto;"></div>
        </div>
      `;
      loadEmployerChats(uid);
    }

    function showEmployees() {
      const content = document.getElementById('employer-content');
      content.innerHTML = `
        <div class="employees-list">
          <h3>Сотрудники</h3>
          <div id="employees-emails" style="max-height: 400px; overflow-y: auto; padding: 15px; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <p style="text-align: center; color: #666;">⏳ Загрузка сотрудников...</p>
          </div>
        </div>
      `;
      loadEmployees(uid);
    }

    function loadEmployees(employerId) {
      const emailsContainer = document.getElementById('employees-emails');
      db.collection('invitations')
        .where('employerId', '==', employerId)
        .where('status', '==', 'accepted')
        .get()
        .then(snapshot => {
          if (snapshot.empty) {
            emailsContainer.innerHTML = '<p style="text-align: center; color: #666;">Нет принявших приглашение сотрудников</p>';
            return;
          }

          const uniqueEmails = new Set();
          snapshot.forEach(doc => {
            const data = doc.data();
            if (data.employeeEmail) {
              uniqueEmails.add(data.employeeEmail);
            }
          });

          if (uniqueEmails.size === 0) {
            emailsContainer.innerHTML = '<p style="text-align: center; color: #666;">Нет сотрудников</p>';
          } else {
            emailsContainer.innerHTML = '';
            uniqueEmails.forEach(email => {
              const emailEl = document.createElement('div');
              emailEl.className = 'employee-email';
              emailEl.textContent = email;
              emailsContainer.appendChild(emailEl);
            });
          }
        })
        .catch(err => {
          console.error('Ошибка загрузки сотрудников:', err);
          emailsContainer.innerHTML = '<p style="color: red; text-align: center;">Ошибка загрузки</p>';
        });
    }

    window.sendInvitation = function() {
      const employeeEmail = document.getElementById('employee-email').value;
      const message = document.getElementById('invite-message').value;
      const resultDiv = document.getElementById('invite-result');
      if (!employeeEmail) {
        resultDiv.innerHTML = '<p style="color: red; margin: 0;">Введите email работника</p>';
        return;
      }
      if (employeeEmail === currentUser.email) {
        resultDiv.innerHTML = '<p style="color: red; margin: 0;">Нельзя отправить приглашение самому себе</p>';
        return;
      }
      resultDiv.innerHTML = '<p style="color: #1a3c6e; margin: 0;">⏳ Отправка приглашения...</p>';
      db.collection('invitations').add({
        employerId: uid,
        employerEmail: currentUser.email,
        employeeEmail: employeeEmail,
        message: message,
        status: 'pending',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      })
      .then(() => {
        resultDiv.innerHTML = '<p style="color: green; margin: 0;">✅ Приглашение успешно отправлено!</p>';
        setTimeout(() => {
          resultDiv.innerHTML = '';
        }, 3000);
      })
      .catch(error => {
        console.error('Ошибка отправки приглашения:', error);
        resultDiv.innerHTML = '<p style="color: red; margin: 0;">❌ Ошибка отправки приглашения: ' + error.message + '</p>';
      });
    };

    window.clearInviteForm = function() {
      document.getElementById('employee-email').value = '';
      document.getElementById('invite-message').value = '';
      document.getElementById('invite-result').innerHTML = '';
    };

    window.refreshChats = function() {
      loadEmployerChats(uid);
    };

    function loadEmployerChats(employerId) {
      const chatsContainer = document.getElementById('chats-container');
      chatsContainer.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">⏳ Загрузка чатов...</p>';
      db.collection('chats')
        .get()
        .then(snapshot => {
          if (snapshot.empty) {
            chatsContainer.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">Нет активных чатов</p>';
            return;
          }
          chatsContainer.innerHTML = '';
          let hasChats = false;
          snapshot.forEach(chatDoc => {
            const chat = chatDoc.data();
            if (chat.employerId === employerId) {
              hasChats = true;
              const chatElement = document.createElement('div');
              chatElement.className = 'chat-item';
              const lastMessageTime = chat.lastMessageAt ? 
                new Date(chat.lastMessageAt.toDate()).toLocaleString() : 
                new Date(chat.createdAt?.toDate()).toLocaleString();
              chatElement.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
                  <strong style="color: #1a3c6e;">💬 Чат с ${chat.participantNames?.find(name => name !== currentUser.email) || 'работником'}</strong>
                  <small style="color: #666; font-size: 11px;">${lastMessageTime}</small>
                </div>
                <div style="color: #555; font-size: 13px; margin-bottom: 5px;">
                  ${chat.lastMessage || 'Чат только создан'}
                </div>
              `;
              chatElement.onclick = () => openChat(chatDoc.id, chat);
              chatsContainer.appendChild(chatElement);
            }
          });
          if (!hasChats) {
            chatsContainer.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">Нет активных чатов</p>';
          }
        })
        .catch(error => {
          console.error('Ошибка загрузки чатов:', error);
          chatsContainer.innerHTML = '<p style="color: red; text-align: center;">Ошибка загрузки чатов: ' + error.message + '</p>';
        });
    }
  }

  // Кабинет работника
  function loadEmployeeSection(uid, userData) {
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `
      <section id="employee">
        <h2>Кабинет сотрудника</h2>
        <div class="section-content">
          <div class="card" onclick="showInvitations()" style="position: relative;">
            <h3>📨 Приглашения</h3>
            <p>Просмотр приглашений</p>
            <div id="invitations-badge" style="position: absolute; top: -8px; right: -8px; background: #ff4444; color: white; border-radius: 50%; width: 20px; height: 20px; display: none; align-items: center; justify-content: center; font-size: 12px; font-weight: bold;">0</div>
          </div>
          <div class="card" onclick="showActiveChats()">
            <h3>💬 Мои чаты</h3>
            <p>Общайтесь с компаниями</p>
          </div>
          <div class="card">
            <h3>📄 Документы</h3>
            <p>Ваши документы</p>
          </div>
          <div class="card">
            <h3>💰 Выплаты</h3>
            <p>История выплат</p>
          </div>
        </div>
        <div id="employee-content"></div>
      </section>
    `;

    window.showInvitations = showInvitations;
    window.showActiveChats = showActiveChats;

    function showInvitations() {
      const content = document.getElementById('employee-content');
      content.innerHTML = `
        <div class="invitations-list" style="margin-top: 20px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
            <h3>Мои приглашения</h3>
            <div>
              <button onclick="refreshInvitations()" style="background: #1a3c6e; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 12px; margin-right: 8px;">🔄 Обновить</button>
              <button onclick="clearAllInvitations()" class="clear-invitations-btn">🗑️ Очистить</button>
            </div>
          </div>
          <div id="invitations-container" style="max-height: 500px; overflow-y: auto;"></div>
        </div>
      `;
      loadEmployeeInvitations();
    }

    function showActiveChats() {
      const content = document.getElementById('employee-content');
      content.innerHTML = `
        <div class="chats-list" style="margin-top: 20px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
            <h3>Мои чаты</h3>
            <button onclick="refreshChats()" style="background: #1a3c6e; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 12px;">🔄 Обновить</button>
          </div>
          <div id="chats-container" style="max-height: 400px; overflow-y: auto;"></div>
        </div>
      `;
      loadEmployeeChats(uid);
    }

    window.refreshInvitations = function() {
      loadEmployeeInvitations();
    };
    window.refreshChats = function() {
      loadEmployeeChats(uid);
    };

    window.clearAllInvitations = function() {
      if (!confirm('Вы уверены, что хотите удалить все приглашения?')) return;
      db.collection('invitations')
        .where('employeeEmail', '==', currentUser.email)
        .get()
        .then(snapshot => {
          const batch = db.batch();
          snapshot.forEach(doc => {
            batch.delete(doc.ref);
          });
          return batch.commit();
        })
        .then(() => {
          alert('Все приглашения удалены');
          showInvitations();
        })
        .catch(err => {
          console.error('Ошибка очистки приглашений:', err);
          alert('Не удалось очистить приглашения');
        });
    };

    function loadEmployeeInvitations() {
      const invitationsContainer = document.getElementById('invitations-container');
      invitationsContainer.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">⏳ Загрузка приглашений...</p>';
      db.collection('invitations')
        .get()
        .then(snapshot => {
          if (snapshot.empty) {
            invitationsContainer.innerHTML = '<p style="text-align: center; color: #666; padding: 40px;">Нет новых приглашений</p>';
            document.getElementById('invitations-badge').style.display = 'none';
            return;
          }
          invitationsContainer.innerHTML = '';
          let pendingInvitations = 0;
          snapshot.forEach(doc => {
            const invitation = doc.data();
            if (invitation.employeeEmail === currentUser.email && invitation.status === 'pending') {
              pendingInvitations++;
              const invitationId = doc.id;
              const invitationElement = document.createElement('div');
              invitationElement.className = 'invitation-item';
              invitationElement.dataset.invitationId = invitationId;
              const inviteTime = invitation.createdAt ? 
                new Date(invitation.createdAt.toDate()).toLocaleString() : 
                'недавно';
              invitationElement.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
                  <h4 style="margin: 0; color: #1a3c6e;">📩 Приглашение от ${invitation.employerEmail}</h4>
                  <small style="color: #666; font-size: 12px;">${inviteTime}</small>
                </div>
                <p style="margin: 10px 0; color: #555; line-height: 1.4;">${invitation.message || 'Приглашение к сотрудничеству'}</p>
                <div style="margin-top: 20px; text-align: center; display: flex; gap: 10px; justify-content: center;">
                  <button onclick="acceptInvitation('${invitationId}')" style="background: #4CAF50; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-size: 14px; flex: 1; max-width: 120px;">✅ Принять</button>
                  <button onclick="declineInvitation('${invitationId}')" style="background: #f44336; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-size: 14px; flex: 1; max-width: 120px;">❌ Отклонить</button>
                </div>
              `;
              invitationsContainer.appendChild(invitationElement);
            }
          });
          if (pendingInvitations > 0) {
            document.getElementById('invitations-badge').textContent = pendingInvitations;
            document.getElementById('invitations-badge').style.display = 'flex';
          } else {
            invitationsContainer.innerHTML = '<p style="text-align: center; color: #666; padding: 40px;">Нет новых приглашений</p>';
            document.getElementById('invitations-badge').style.display = 'none';
          }
        })
        .catch(error => {
          console.error('Ошибка загрузки приглашений:', error);
          invitationsContainer.innerHTML = '<p style="color: red; text-align: center; padding: 20px;">Ошибка загрузки приглашений: ' + error.message + '</p>';
        });
    }

    function loadEmployeeChats(employeeId) {
      const chatsContainer = document.getElementById('chats-container');
      chatsContainer.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">⏳ Загрузка чатов...</p>';
      db.collection('chats')
        .get()
        .then(snapshot => {
          if (snapshot.empty) {
            chatsContainer.innerHTML = '<p style="text-align: center; color: #666; padding: 40px;">Нет активных чатов</p>';
            return;
          }
          chatsContainer.innerHTML = '';
          let hasChats = false;
          snapshot.forEach(chatDoc => {
            const chat = chatDoc.data();
            if (chat.employeeId === employeeId) {
              hasChats = true;
              const chatElement = document.createElement('div');
              chatElement.className = 'chat-item';
              const lastMessageTime = chat.lastMessageAt ? 
                new Date(chat.lastMessageAt.toDate()).toLocaleString() : 
                new Date(chat.createdAt?.toDate()).toLocaleString();
              chatElement.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
                  <strong style="color: #1a3c6e;">💬 Чат с ${chat.participantNames?.find(name => name !== currentUser.email) || 'компанией'}</strong>
                  <small style="color: #666; font-size: 11px;">${lastMessageTime}</small>
                </div>
                <div style="color: #555; font-size: 13px; margin-bottom: 5px;">
                  ${chat.lastMessage || 'Чат только создан'}
                </div>
              `;
              chatElement.onclick = () => openChat(chatDoc.id, chat);
              chatsContainer.appendChild(chatElement);
            }
          });
          if (!hasChats) {
            chatsContainer.innerHTML = '<p style="text-align: center; color: #666; padding: 40px;">Нет активных чатов</p>';
          }
        })
        .catch(error => {
          console.error('Ошибка загрузки чатов:', error);
          chatsContainer.innerHTML = '<p style="color: red; text-align: center;">Ошибка загрузки чатов: ' + error.message + '</p>';
        });
    }

    window.acceptInvitation = function(invitationId) {
      const invitationElement = document.querySelector(`[data-invitation-id="${invitationId}"]`);
      if (invitationElement) {
        invitationElement.innerHTML = '<div style="text-align: center; padding: 30px; color: #1a3c6e;"><p>⏳ Обработка приглашения...</p></div>';
      }
      db.collection('invitations').doc(invitationId).get()
        .then(doc => {
          if (!doc.exists) throw new Error('Приглашение не найдено');
          const invitation = doc.data();
          return db.collection('chats').add({
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            participantNames: [invitation.employerEmail, invitation.employeeEmail],
            lastMessage: 'Чат начат - приглашение принято',
            lastMessageAt: firebase.firestore.FieldValue.serverTimestamp(),
            employerId: invitation.employerId,
            employeeId: currentUser.uid,
            invitationId: invitationId
          }).then(chatRef => ({ chatRef, invitation }));
        })
        .then(({ chatRef, invitation }) => {
          const batch = db.batch();
          batch.set(db.collection('chats').doc(chatRef.id).collection('participants').doc(invitation.employerId), {
            userId: invitation.employerId,
            email: invitation.employerEmail,
            role: 'employer',
            joinedAt: firebase.firestore.FieldValue.serverTimestamp()
          });
          batch.set(db.collection('chats').doc(chatRef.id).collection('participants').doc(currentUser.uid), {
            userId: currentUser.uid,
            email: currentUser.email,
            role: 'employee',
            joinedAt: firebase.firestore.FieldValue.serverTimestamp()
          });
          batch.update(db.collection('invitations').doc(invitationId), {
            status: 'accepted',
            chatId: chatRef.id,
            acceptedAt: firebase.firestore.FieldValue.serverTimestamp()
          });
          return batch.commit();
        })
        .then(() => {
          if (invitationElement) {
            invitationElement.innerHTML = '<div style="text-align: center; padding: 30px; color: green;"><p>✅ Приглашение принято! Чат создан.</p></div>';
          }
          setTimeout(() => showActiveChats(), 2000);
        })
        .catch(error => {
          console.error('Ошибка принятия приглашения:', error);
          if (invitationElement) {
            invitationElement.innerHTML = `
              <div style="text-align: center; padding: 20px;">
                <p style="color: red; margin-bottom: 15px;">❌ Ошибка: ${error.message}</p>
                <button onclick="acceptInvitation('${invitationId}')" style="background: #1a3c6e; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer;">Повторить</button>
              </div>
            `;
          }
        });
    };

    window.declineInvitation = function(invitationId) {
      const invitationElement = document.querySelector(`[data-invitation-id="${invitationId}"]`);
      if (invitationElement) {
        invitationElement.innerHTML = '<div style="text-align: center; padding: 30px; color: #1a3c6e;"><p>⏳ Отклонение приглашения...</p></div>';
      }
      db.collection('invitations').doc(invitationId).update({
        status: 'declined',
        declinedAt: firebase.firestore.FieldValue.serverTimestamp()
      })
      .then(() => {
        if (invitationElement) {
          invitationElement.innerHTML = '<div style="text-align: center; padding: 30px; color: orange;"><p>❌ Приглашение отклонено</p></div>';
          setTimeout(() => {
            if (invitationElement.parentNode) invitationElement.remove();
            updateInvitationsBadge();
          }, 2000);
        }
      })
      .catch(error => {
        console.error('Ошибка отклонения приглашения:', error);
        if (invitationElement) {
          invitationElement.innerHTML = `
            <div style="text-align: center; padding: 20px;">
              <p style="color: red; margin-bottom: 15px;">❌ Ошибка отклонения: ${error.message}</p>
              <button onclick="declineInvitation('${invitationId}')" style="background: #1a3c6e; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer;">Повторить</button>
            </div>
          `;
        }
      });
    };

    function updateInvitationsBadge() {
      const badge = document.getElementById('invitations-badge');
      const invitationItems = document.querySelectorAll('.invitation-item');
      badge.style.display = invitationItems.length > 0 ? 'flex' : 'none';
      if (invitationItems.length > 0) badge.textContent = invitationItems.length;
    }
  }

  // Открытие чата
  function openChat(chatId, chatData) {
    const mainContent = document.getElementById('main-content');
    currentChatId = chatId;
    db.collection('chats').doc(chatId).get()
      .then((chatDoc) => {
        if (!chatDoc.exists) throw new Error('Чат не найден');
        mainContent.innerHTML = `
          <section id="chat-section">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; padding: 15px; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <h2 style="margin: 0; color: #1a3c6e; font-size: 18px;">💬 Чат с ${chatData.participantNames?.find(name => name !== currentUser.email) || 'участником'}</h2>
              <button onclick="goBackToDashboard()" class="back-to-chats-btn">← Назад к чатам</button>
            </div>
            <div id="chat-messages"></div>
            <div style="display: flex; gap: 10px; align-items: center; margin-top: 10px;">
              <input type="text" id="message-input" placeholder="Введите сообщение..." style="flex: 1; padding: 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px;">
              <button onclick="sendMessage()" style="background: #1a3c6e; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-size: 14px; white-space: nowrap;">Отправить</button>
            </div>
          </section>
        `;
        loadChatMessages(chatId);
        document.getElementById('message-input').addEventListener('keypress', e => {
          if (e.key === 'Enter') sendMessage();
        });
        document.getElementById('message-input').focus();
      })
      .catch(error => {
        mainContent.innerHTML = `
          <div style="text-align: center; padding: 40px;">
            <h3 style="color: #d32f2f;">Ошибка загрузки чата</h3>
            <p>${error.message}</p>
            <button onclick="goBackToDashboard()" style="background: #1a3c6e; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; margin-top: 15px;">Вернуться к чатам</button>
          </div>
        `;
      });
  }

  window.goBackToDashboard = function() {
    if (window.chatUnsubscribe) {
      window.chatUnsubscribe();
      window.chatUnsubscribe = null;
    }
    if (currentUser) {
      db.collection('users').doc(currentUser.uid).get()
        .then(doc => {
          if (doc.exists) {
            const userData = doc.data();
            loadSection(userData.role, currentUser.uid, userData);
          }
        })
        .catch(err => console.error('Ошибка загрузки данных:', err));
    }
  };

  window.sendMessage = function() {
    const messageInput = document.getElementById('message-input');
    const messageText = messageInput.value.trim();
    if (!messageText || !currentChatId) return;

    db.collection('chats').doc(currentChatId).get()
      .then(chatDoc => {
        if (!chatDoc.exists) throw new Error('Чат не найден');
        return db.collection('chats').doc(currentChatId).collection('messages').add({
          text: messageText,
          senderId: currentUser.uid,
          senderEmail: currentUser.email,
          timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
      })
      .then(docRef => {
        const shortMessage = messageText.length > 50 ? messageText.substring(0, 50) + '...' : messageText;
        return db.collection('chats').doc(currentChatId).update({
          lastMessage: shortMessage,
          lastMessageAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      })
      .then(() => {
        messageInput.value = '';
        messageInput.focus();
      })
      .catch(err => {
        console.error('Ошибка отправки:', err);
        alert('Ошибка отправки сообщения: ' + (err.message || 'неизвестная ошибка'));
      });
  };

  function loadChatMessages(chatId) {
    const messagesContainer = document.getElementById('chat-messages');
    messagesContainer.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">⏳ Загрузка сообщений...</p>';
    const unsubscribe = db.collection('chats').doc(chatId).collection('messages')
      .orderBy('timestamp', 'asc')
      .onSnapshot(
        snapshot => {
          window.chatUnsubscribe = unsubscribe;
          messagesContainer.innerHTML = '';
          if (snapshot.empty) {
            messagesContainer.innerHTML = '<p style="text-align: center; color: #666; padding: 40px;">Нет сообщений. Начните общение!</p>';
            return;
          }
          snapshot.forEach(doc => {
            const msg = doc.data();
            const isMy = msg.senderId === currentUser.uid;
            const time = msg.timestamp ? new Date(msg.timestamp.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'только что';
            const el = document.createElement('div');
            el.style.marginBottom = '12px';
            el.style.padding = '10px 14px';
            el.style.borderRadius = '12px';
            el.style.maxWidth = '70%';
            el.style.wordWrap = 'break-word';
            el.style.boxShadow = '0 1px 2px rgba(0,0,0,0.1)';
            if (isMy) {
              el.style.marginLeft = 'auto';
              el.style.backgroundColor = '#1a3c6e';
              el.style.color = 'white';
              el.style.borderBottomRightRadius = '4px';
            } else {
              el.style.backgroundColor = '#f1f3f4';
              el.style.color = '#333';
              el.style.borderBottomLeftRadius = '4px';
            }
            el.innerHTML = `
              <div style="font-weight: bold; font-size: 12px; margin-bottom: 4px; opacity: 0.9;">${msg.senderEmail || 'Неизвестный'}</div>
              <div style="margin-bottom: 6px; line-height: 1.4;">${msg.text}</div>
              <div style="font-size: 10px; opacity: 0.7; text-align: right;">${time}</div>
            `;
            messagesContainer.appendChild(el);
          });
          messagesContainer.scrollTop = messagesContainer.scrollHeight;
        },
        err => {
          messagesContainer.innerHTML = `<p style="color: red; text-align: center;">Ошибка: ${err.message}</p>`;
        }
      );
  }

  function translateError(code) {
    switch (code) {
      case 'auth/email-already-in-use': return 'Этот email уже зарегистрирован';
      case 'auth/invalid-email': return 'Некорректный email';
      case 'auth/weak-password': return 'Пароль слишком слабый (мин. 6 символов)';
      case 'auth/user-not-found':
      case 'auth/wrong-password': return 'Неверный email или пароль';
      case 'auth/network-request-failed': return 'Ошибка сети. Проверьте подключение';
      case 'auth/too-many-requests': return 'Слишком много попыток. Попробуйте позже';
      default: return 'Произошла ошибка. Попробуйте снова';
    }
  }
});