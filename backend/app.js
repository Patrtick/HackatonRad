document.getElementById('employer-btn').addEventListener('click', () => {
  loadSection('employer');
});

document.getElementById('employee-btn').addEventListener('click', () => {
  loadSection('employee');
});

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