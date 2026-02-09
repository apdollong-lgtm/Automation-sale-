const state = {
  me: null,
  orders: [],
  stock: [],
  shipments: [],
  users: [],
};

const i18n = {
  th: {
    loading: 'กำลังโหลด...',
  },
  en: {
    loading: 'Loading...',
  },
};

function getText(key) {
  const locale = window.APP_CONFIG.locale || 'th';
  return (i18n[locale] && i18n[locale][key]) || key;
}

function showPage(route) {
  document.querySelectorAll('.page').forEach(page => page.classList.add('hidden'));
  const target = document.getElementById(`page-${route}`);
  if (target) target.classList.remove('hidden');
  document.querySelectorAll('.nav-link').forEach(link => link.classList.toggle('active', link.dataset.route === route));
}

function initRouter() {
  const route = window.location.hash.replace('#', '') || 'dashboard';
  showPage(route);
  window.addEventListener('hashchange', () => {
    const next = window.location.hash.replace('#', '') || 'dashboard';
    showPage(next);
  });
}

function callApi(funcName, payload) {
  return new Promise((resolve, reject) => {
    google.script.run.withSuccessHandler(resolve).withFailureHandler(reject)[funcName](payload);
  });
}

async function loadMe() {
  const me = await callApi('getMe');
  state.me = me;
  const userInfo = document.getElementById('user-info');
  userInfo.textContent = me.name || me.email || getText('loading');
  if (me.requiresPin && !me.email) {
    document.getElementById('pin-modal').classList.remove('hidden');
  }
  return me;
}

async function loadDashboard() {
  const orders = await callApi('listOrders', {});
  const shipments = await callApi('listShipments', {});
  document.getElementById('dash-orders').textContent = orders.length;
  document.getElementById('dash-shipments').textContent = shipments.length;
}

async function loadOrders() {
  const orders = await callApi('listOrders', {});
  state.orders = orders;
  const tbody = document.getElementById('orders-body');
  tbody.innerHTML = '';
  orders.forEach(order => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${order.OrderId}</td>
      <td>${order.CustomerId}</td>
      <td>${order.Status}</td>
      <td><button class="btn secondary" data-id="${order.OrderId}">ดู</button></td>
    `;
    tbody.appendChild(row);
  });
}

async function loadStock() {
  const stock = await callApi('listStock', {});
  state.stock = stock;
  const tbody = document.getElementById('stock-body');
  tbody.innerHTML = '';
  stock.forEach(item => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${item.SKU}</td>
      <td>${item.WarehouseId}</td>
      <td>${item.Lot}</td>
      <td>${item.OnHandQty}</td>
    `;
    tbody.appendChild(row);
  });
}

async function loadShipments() {
  const shipments = await callApi('listShipments', {});
  state.shipments = shipments;
  const tbody = document.getElementById('shipments-body');
  tbody.innerHTML = '';
  shipments.forEach(item => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${item.ShipmentId}</td>
      <td>${item.OrderId}</td>
      <td>${item.Carrier}</td>
      <td>${item.Status}</td>
    `;
    tbody.appendChild(row);
  });
}

async function loadUsers() {
  try {
    const users = await callApi('listUsers', {});
    state.users = users;
    const tbody = document.getElementById('users-body');
    tbody.innerHTML = '';
    users.forEach(user => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${user.Email}</td>
        <td>${user.Role}</td>
        <td>${user.Name}</td>
      `;
      tbody.appendChild(row);
    });
  } catch (error) {
    document.getElementById('users-body').innerHTML = `<tr><td colspan="3">${error.message}</td></tr>`;
  }
}

function bindEvents() {
  document.getElementById('pin-submit').addEventListener('click', async () => {
    const pin = document.getElementById('pin-input').value;
    await callApi('loginWithPin', pin);
    document.getElementById('pin-modal').classList.add('hidden');
    await loadMe();
  });

  document.getElementById('orders-body').addEventListener('click', async event => {
    if (event.target.matches('button')) {
      const orderId = event.target.dataset.id;
      const detail = await callApi('getOrder', orderId);
      document.getElementById('order-detail-id').textContent = detail.order.OrderId;
      document.getElementById('order-detail-status').textContent = detail.order.Status;
      document.getElementById('order-detail-items').textContent = detail.items.map(item => `${item.SKU} x ${item.Qty}`).join(', ');
      showPage('order-detail');
    }
  });
}

async function init() {
  document.getElementById('user-info').textContent = getText('loading');
  initRouter();
  bindEvents();
  await loadMe();
  await loadDashboard();
  await loadOrders();
  await loadStock();
  await loadShipments();
  await loadUsers();
}

window.addEventListener('load', init);
