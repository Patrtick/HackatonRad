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
          <div class="card">
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

    // Добавляем функции в глобальную область видимости
    window.showInviteForm = showInviteForm;
    window.showActiveChats = showActiveChats;

    function showInviteForm() {
      const content = document.getElementById('employer-content');
      content.innerHTML = `
        <div class="invite-form" style="margin-top: 20px; padding: 20px; background: white; border-radius: 8px;">
          <h3>Отправить приглашение</h3>
          <input type="email" id="employee-email" placeholder="Email работника" style="width: 100%; padding: 10px; margin: 10px 0; border: 1px solid #ddd; border-radius: 6px;">
          <textarea id="invite-message" placeholder="Сообщение приглашения (опционально)" style="width: 100%; padding: 10px; margin: 10px 0; border: 1px solid #ddd; border-radius: 6px; height: 80px;"></textarea>
          <button onclick="sendInvitation()" style="background: #1a3c6e; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer;">Отправить приглашение</button>
          <div id="invite-result" style="margin-top: 10px;"></div>
        </div>
      `;
    }

    function showActiveChats() {
      const content = document.getElementById('employer-content');
      content.innerHTML = `
        <div class="chats-list" style="margin-top: 20px;">
          <h3>Активные чаты</h3>
          <div id="chats-container" style="max-height: 400px; overflow-y: auto;"></div>
        </div>
      `;
      loadEmployerChats(uid);
    }

    window.sendInvitation = function() {
      const employeeEmail = document.getElementById('employee-email').value;
      const message = document.getElementById('invite-message').value;
      const resultDiv = document.getElementById('invite-result');

      if (!employeeEmail) {
        resultDiv.innerHTML = '<p style="color: red;">Введите email работника</p>';
        return;
      }

      // Создаем приглашение
      db.collection('invitations').add({
        employerId: uid,
        employerEmail: currentUser.email,
        employeeEmail: employeeEmail,
        message: message,
        status: 'pending',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      })
      .then(() => {
        resultDiv.innerHTML = '<p style="color: green;">Приглашение отправлено!</p>';
        document.getElementById('employee-email').value = '';
        document.getElementById('invite-message').value = '';
      })
      .catch(error => {
        console.error('Ошибка отправки приглашения:', error);
        resultDiv.innerHTML = '<p style="color: red;">Ошибка отправки приглашения</p>';
      });
    };

    function loadEmployerChats(employerId) {
      const chatsContainer = document.getElementById('chats-container');
      
      // Слушаем чаты где текущий пользователь участник
      db.collectionGroup('participants')
        .where('userId', '==', employerId)
        .onSnapshot(snapshot => {
          const chatIds = snapshot.docs.map(doc => doc.ref.parent.parent.id);
          
          if (chatIds.length === 0) {
            chatsContainer.innerHTML = '<p>Нет активных чатов</p>';
            return;
          }

          // Получаем информацию о чатах
          Promise.all(chatIds.map(chatId => 
            db.collection('chats').doc(chatId).get()
          )).then(chatDocs => {
            chatsContainer.innerHTML = '';
            chatDocs.forEach(chatDoc => {
              if (chatDoc.exists) {
                const chat = chatDoc.data();
                const chatElement = document.createElement('div');
                chatElement.className = 'chat-item';
                chatElement.style.padding = '10px';
                chatElement.style.border = '1px solid #ddd';
                chatElement.style.margin = '5px 0';
                chatElement.style.borderRadius = '6px';
                chatElement.style.cursor = 'pointer';
                chatElement.innerHTML = `
                  <strong>Чат с ${chat.participantNames?.find(name => name !== currentUser.email) || 'работником'}</strong>
                  <br><small>Создан: ${new Date(chat.createdAt?.toDate()).toLocaleDateString()}</small>
                `;
                chatElement.onclick = () => openChat(chatDoc.id, chat);
                chatsContainer.appendChild(chatElement);
              }
            });
          });
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
          <div class="card" onclick="showInvitations()">
            <h3>📨 Приглашения</h3>
            <p id="invitations-badge" style="background: red; color: white; border-radius: 50%; width: 20px; height: 20px; display: none; margin: 0 auto;">0</p>
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

    // Добавляем функции в глобальную область видимости
    window.showInvitations = showInvitations;
    window.showActiveChats = showActiveChats;

    function showInvitations() {
      const content = document.getElementById('employee-content');
      content.innerHTML = `
        <div class="invitations-list" style="margin-top: 20px;">
          <h3>Мои приглашения</h3>
          <div id="invitations-container"></div>
        </div>
      `;
      loadEmployeeInvitations();
    }

    function showActiveChats() {
      const content = document.getElementById('employee-content');
      content.innerHTML = `
        <div class="chats-list" style="margin-top: 20px;">
          <h3>Мои чаты</h3>
          <div id="chats-container" style="max-height: 400px; overflow-y: auto;"></div>
        </div>
      `;
      loadEmployeeChats(uid);
    }

    function loadEmployeeInvitations() {
      const invitationsContainer = document.getElementById('invitations-container');
      
      db.collection('invitations')
        .where('employeeEmail', '==', currentUser.email)
        .where('status', '==', 'pending')
        .onSnapshot(snapshot => {
          if (snapshot.empty) {
            invitationsContainer.innerHTML = '<p>Нет новых приглашений</p>';
            document.getElementById('invitations-badge').style.display = 'none';
            return;
          }

          invitationsContainer.innerHTML = '';
          snapshot.forEach(doc => {
            const invitation = doc.data();
            const invitationElement = document.createElement('div');
            invitationElement.className = 'invitation-item';
            invitationElement.style.padding = '15px';
            invitationElement.style.border = '1px solid #ddd';
            invitationElement.style.margin = '10px 0';
            invitationElement.style.borderRadius = '8px';
            invitationElement.innerHTML = `
              <h4>Приглашение от ${invitation.employerEmail}</h4>
              <p>${invitation.message || 'Приглашение к сотрудничеству'}</p>
              <small>Отправлено: ${new Date(invitation.createdAt?.toDate()).toLocaleString()}</small>
              <div style="margin-top: 10px;">
                <button onclick="acceptInvitation('${doc.id}')" style="background: #4CAF50; color: white; border: none; padding: 8px 16px; border-radius: 4px; margin-right: 10px; cursor: pointer;">Принять</button>
                <button onclick="declineInvitation('${doc.id}')" style="background: #f44336; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">Отклонить</button>
              </div>
            `;
            invitationsContainer.appendChild(invitationElement);
          });

          // Показываем бейдж с количеством приглашений
          document.getElementById('invitations-badge').textContent = snapshot.size;
          document.getElementById('invitations-badge').style.display = 'block';
        });
    }

    function loadEmployeeChats(employeeId) {
      const chatsContainer = document.getElementById('chats-container');
      
      db.collectionGroup('participants')
        .where('userId', '==', employeeId)
        .onSnapshot(snapshot => {
          const chatIds = snapshot.docs.map(doc => doc.ref.parent.parent.id);
          
          if (chatIds.length === 0) {
            chatsContainer.innerHTML = '<p>Нет активных чатов</p>';
            return;
          }

          Promise.all(chatIds.map(chatId => 
            db.collection('chats').doc(chatId).get()
          )).then(chatDocs => {
            chatsContainer.innerHTML = '';
            chatDocs.forEach(chatDoc => {
              if (chatDoc.exists) {
                const chat = chatDoc.data();
                const chatElement = document.createElement('div');
                chatElement.className = 'chat-item';
                chatElement.style.padding = '10px';
                chatElement.style.border = '1px solid #ddd';
                chatElement.style.margin = '5px 0';
                chatElement.style.borderRadius = '6px';
                chatElement.style.cursor = 'pointer';
                chatElement.innerHTML = `
                  <strong>Чат с ${chat.participantNames?.find(name => name !== currentUser.email) || 'компанией'}</strong>
                  <br><small>Создан: ${new Date(chat.createdAt?.toDate()).toLocaleDateString()}</small>
                `;
                chatElement.onclick = () => openChat(chatDoc.id, chat);
                chatsContainer.appendChild(chatElement);
              }
            });
          });
        });
    }

    window.acceptInvitation = function(invitationId) {
      db.collection('invitations').doc(invitationId).get()
        .then(doc => {
          const invitation = doc.data();
          
          // Создаем чат
          return db.collection('chats').add({
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            participantNames: [invitation.employerEmail, invitation.employeeEmail],
            lastMessage: 'Чат начат',
            lastMessageAt: firebase.firestore.FieldValue.serverTimestamp()
          });
        })
        .then(chatRef => {
          // Добавляем участников в чат
          return Promise.all([
            db.collection('chats').doc(chatRef.id).collection('participants').doc(invitation.employerId).set({
              userId: invitation.employerId,
              email: invitation.employerEmail,
              role: 'employer',
              joinedAt: firebase.firestore.FieldValue.serverTimestamp()
            }),
            db.collection('chats').doc(chatRef.id).collection('participants').doc(currentUser.uid).set({
              userId: currentUser.uid,
              email: currentUser.email,
              role: 'employee',
              joinedAt: firebase.firestore.FieldValue.serverTimestamp()
            }),
            db.collection('invitations').doc(invitationId).update({
              status: 'accepted',
              chatId: chatRef.id,
              acceptedAt: firebase.firestore.FieldValue.serverTimestamp()
            })
          ]);
        })
        .then(() => {
          alert('Приглашение принято! Чат создан.');
          showActiveChats(); // Переключаемся на чаты
        })
        .catch(error => {
          console.error('Ошибка принятия приглашения:', error);
          alert('Ошибка принятия приглашения');
        });
    };

    window.declineInvitation = function(invitationId) {
      db.collection('invitations').doc(invitationId).update({
        status: 'declined',
        declinedAt: firebase.firestore.FieldValue.serverTimestamp()
      })
      .then(() => {
        alert('Приглашение отклонено');
      })
      .catch(error => {
        console.error('Ошибка отклонения приглашения:', error);
        alert('Ошибка отклонения приглашения');
      });
    };
  }

  // Функция открытия чата (общая для работника и компании)
  function openChat(chatId, chatData) {
    const mainContent = document.getElementById('main-content');
    currentChatId = chatId;

    mainContent.innerHTML = `
      <section id="chat-section">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
          <h2>💬 Чат с ${chatData.participantNames?.find(name => name !== currentUser.email) || 'участником'}</h2>
          <button onclick="loadSection('${currentUser.role}', '${currentUser.uid}')" style="background: #6c757d; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">← Назад</button>
        </div>
        <div id="chat-messages" style="height: 400px; border: 1px solid #ddd; border-radius: 8px; padding: 15px; overflow-y: auto; background: white; margin-bottom: 15px;"></div>
        <div style="display: flex; gap: 10px;">
          <input type="text" id="message-input" placeholder="Введите сообщение..." style="flex: 1; padding: 10px; border: 1px solid #ddd; border-radius: 6px;">
          <button onclick="sendMessage()" style="background: #1a3c6e; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer;">Отправить</button>
        </div>
      </section>
    `;

    loadChatMessages(chatId);
    
    // Добавляем обработчик Enter для отправки сообщения
    document.getElementById('message-input').addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        sendMessage();
      }
    });
  }

  window.sendMessage = function() {
    const messageInput = document.getElementById('message-input');
    const messageText = messageInput.value.trim();

    if (!messageText || !currentChatId) return;

    // Добавляем сообщение в чат
    db.collection('chats').doc(currentChatId).collection('messages').add({
      text: messageText,
      senderId: currentUser.uid,
      senderEmail: currentUser.email,
      senderRole: currentUser.role,
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(() => {
      // Обновляем последнее сообщение в чате
      db.collection('chats').doc(currentChatId).update({
        lastMessage: messageText,
        lastMessageAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      messageInput.value = '';
    })
    .catch(error => {
      console.error('Ошибка отправки сообщения:', error);
      alert('Ошибка отправки сообщения');
    });
  };

  function loadChatMessages(chatId) {
    const messagesContainer = document.getElementById('chat-messages');
    
    db.collection('chats').doc(chatId).collection('messages')
      .orderBy('timestamp', 'asc')
      .onSnapshot(snapshot => {
        messagesContainer.innerHTML = '';
        
        snapshot.forEach(doc => {
          const message = doc.data();
          const messageElement = document.createElement('div');
          messageElement.style.marginBottom = '10px';
          messageElement.style.padding = '8px 12px';
          messageElement.style.borderRadius = '8px';
          messageElement.style.maxWidth = '70%';
          messageElement.style.wordWrap = 'break-word';
          
          if (message.senderId === currentUser.uid) {
            // Мои сообщения - справа
            messageElement.style.marginLeft = 'auto';
            messageElement.style.backgroundColor = '#1a3c6e';
            messageElement.style.color = 'white';
          } else {
            // Сообщения собеседника - слева
            messageElement.style.backgroundColor = '#f1f3f4';
            messageElement.style.color = '#333';
          }
          
          messageElement.innerHTML = `
            <div style="font-weight: bold; font-size: 12px;">${message.senderEmail}</div>
            <div>${message.text}</div>
            <div style="font-size: 10px; opacity: 0.7; text-align: right;">${new Date(message.timestamp?.toDate()).toLocaleTimeString()}</div>
          `;
          
          messagesContainer.appendChild(messageElement);
        });
        
        // Прокручиваем вниз
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      });
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