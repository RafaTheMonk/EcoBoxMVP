const screenRoot = document.getElementById('screen-root');
const toastEl = document.getElementById('toast');
const templates = new Map();

document.querySelectorAll('template[data-screen]').forEach((tpl) => {
  templates.set(tpl.dataset.screen, tpl);
});

const numberFormatter = new Intl.NumberFormat('pt-BR');
const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
});

const state = {
  userName: 'Eco Lover',
  coins: 2750,
  monthlyGain: 350,
  monthlyGoal: 5000,
  selectedPointId: 'eco-ambiental',
  tips: [
    {
      title: 'Agende uma coleta',
      description: 'Selecione um ponto e registre a coleta simulada para mostrar o saldo crescendo ao vivo.',
    },
    {
      title: 'Personalize o pitch',
      description: 'Faça login com o nome do cliente ou investidor e deixe tudo mais humano.',
    },
    {
      title: 'Prove o valor rapidamente',
      description: 'Mostre o resgate na loja e como os pontos viram benefícios reais.',
    },
  ],
  points: [
    {
      id: 'eco-ambiental',
      name: 'Eco Ambiental',
      address: 'Av. Sete de Setembro, 123 - Centro, Salvador/BA',
      materials: ['Plástico', 'Vidro', 'Papel', 'Metal'],
      phone: '(71) 99999-0000',
      hours: 'Seg a Sáb, 8h às 18h',
      distance: 1.2,
    },
    {
      id: 'bairro-x',
      name: 'Ponto Bairro X',
      address: 'Rua da Aurora, 88 - Bairro X, Salvador/BA',
      materials: ['Vidro', 'Plástico'],
      phone: '(71) 98888-1111',
      hours: 'Seg a Sex, 9h às 17h',
      distance: 3.4,
    },
    {
      id: 'bairro-y',
      name: 'Estação Bairro Y',
      address: 'Av. Oceânica, 455 - Bairro Y, Salvador/BA',
      materials: ['Metal', 'Papelão'],
      phone: '(71) 97777-2222',
      hours: 'Todos os dias, 7h às 19h',
      distance: 5.1,
    },
  ],
  history: [
    { id: 'h-341', date: '12/11', description: 'Eco Ambiental - Plástico e papel', value: 300 },
    { id: 'h-340', date: '05/11', description: 'Ponto Bairro X - Vidro', value: 150 },
    { id: 'r-220', date: '02/11', description: 'Resgate Ecobag', value: -150 },
    { id: 'h-339', date: '29/10', description: 'Eco Ambiental - Recicláveis', value: 220 },
    { id: 'h-338', date: '20/10', description: 'Estação Bairro Y - Metal', value: 180 },
  ],
  products: [
    {
      id: 'ecobag',
      name: 'Ecobag reforçada',
      category: 'Sustentável',
      cost: 1000,
      description: 'Bolsa de algodão orgânico para incentivar compras sem plástico.',
    },
    {
      id: 'composteira',
      name: 'Mini composteira',
      category: 'Sustentável',
      cost: 4000,
      description: 'Kit compacto para transformar resíduos orgânicos em adubo.',
    },
    {
      id: 'squeeze',
      name: 'Squeeze inox',
      category: 'Brinde',
      cost: 600,
      description: 'Garrafa reutilizável para reduzir descartáveis.',
    },
    {
      id: 'creditos-mobilidade',
      name: 'Créditos de mobilidade',
      category: 'Benefício',
      cost: 1200,
      description: 'Desconto simbólico em transporte parceiro.',
    },
  ],
};

const binders = {
  userName: () => state.userName,
  coins: () => formatCoins(state.coins),
  monthlyGain: () => + Eco,
  monthlyGoal: () => formatCoins(state.monthlyGoal),
  selectedPointName: () => getSelectedPoint().name,
  selectedPointMaterials: () => getSelectedPoint().materials.join(', '),
  selectedPointAddress: () => getSelectedPoint().address,
  selectedPointHours: () => getSelectedPoint().hours,
  selectedPointContact: () => getSelectedPoint().phone,
};

const renderers = {
  welcome: () => {},
  login: () => {},
  signup: () => {},
  home: renderHome,
  map: renderMap,
  'point-details': renderPointDetails,
  wallet: renderWallet,
  history: renderHistory,
  store: renderStore,
};

let currentScreen = 'welcome';
let toastTimeout;

document.addEventListener('click', handleDocumentClick);
document.addEventListener('submit', handleFormSubmit);

loadScreen(currentScreen);

function handleDocumentClick(event) {
  const trigger = event.target.closest('[data-screen-trigger]');
  if (trigger) {
    event.preventDefault();
    loadScreen(trigger.dataset.screenTrigger);
    return;
  }

  const actionTarget = event.target.closest('[data-action]');
  if (actionTarget) {
    event.preventDefault();
    handleAction(actionTarget.dataset.action, actionTarget);
  }
}

function handleFormSubmit(event) {
  const formType = event.target.dataset.authForm;
  if (!formType) {
    return;
  }

  event.preventDefault();
  handleAuth(formType, new FormData(event.target));
}

function loadScreen(id) {
  const template = templates.get(id) || templates.get('welcome');
  if (!template || !screenRoot) {
    return;
  }

  screenRoot.innerHTML = '';
  const fragment = template.content.cloneNode(true);
  screenRoot.appendChild(fragment);
  currentScreen = id;
  applyBindings(screenRoot);

  const renderer = renderers[id];
  if (typeof renderer === 'function') {
    renderer(screenRoot);
  }
}

function refreshCurrentScreen() {
  loadScreen(currentScreen);
}

function applyBindings(root) {
  root.querySelectorAll('[data-bind]').forEach((element) => {
    const binder = binders[element.dataset.bind];
    if (binder) {
      element.textContent = binder();
    }
  });
}

function renderHome(root) {
  const tipsContainer = root.querySelector('[data-list="tips"]');
  renderList(tipsContainer, state.tips, (tip) => {
    const li = document.createElement('li');
    li.innerHTML = <strong></strong><span></span>;
    return li;
  });
}

function renderMap(root) {
  renderPointsList(root.querySelector('[data-list="points"]'));
  syncSelectedPointActions(root);
}

function renderPointDetails(root) {
  const point = getSelectedPoint();
  const chips = root.querySelector('[data-list="selectedPointChips"]');
  renderList(chips, point.materials, (material) => {
    const li = document.createElement('li');
    li.textContent = material;
    return li;
  });
  syncSelectedPointActions(root);
}

function renderWallet(root) {
  const shortHistory = root.querySelector('[data-list="historyShort"]');
  renderHistoryList(shortHistory, state.history.slice(0, 4));
}

function renderHistory(root) {
  renderHistoryList(root.querySelector('[data-list="historyFull"]'), state.history);
}

function renderStore(root) {
  const list = root.querySelector('[data-list="products"]');
  renderList(list, state.products, (product) => {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = 
      <small class="muted"></small>
      <h4></h4>
      <span class="product-note"></span>
      <p> EcoCoins</p>
    ;

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'secondary-btn small';
    button.dataset.action = 'redeem-product';
    button.dataset.productId = product.id;
    button.textContent = state.coins >= product.cost ? 'Resgatar' : 'Saldo insuficiente';
    button.disabled = state.coins < product.cost;
    card.appendChild(button);

    return card;
  });
}

function renderPointsList(container) {
  if (!container) {
    return;
  }

  const sorted = [...state.points].sort((a, b) => a.distance - b.distance);
  renderList(container, sorted, (point) => {
    const li = document.createElement('li');
    li.className = 'point-card';

    const name = document.createElement('strong');
    name.textContent = point.name;
    const address = document.createElement('span');
    address.textContent = point.address;
    const details = document.createElement('span');
    const distance = point.distance.toFixed(1).replace('.', ',');
    details.textContent = ${distance} km • Materiais: ;

    const actions = document.createElement('div');
    actions.className = 'btn-row';

    const focusBtn = document.createElement('button');
    focusBtn.type = 'button';
    focusBtn.className = 'secondary-btn small';
    focusBtn.dataset.action = 'focus-point';
    focusBtn.dataset.pointId = point.id;
    focusBtn.textContent = 'Destacar';

    const detailsBtn = document.createElement('button');
    detailsBtn.type = 'button';
    detailsBtn.className = 'primary-btn small';
    detailsBtn.dataset.action = 'open-point';
    detailsBtn.dataset.pointId = point.id;
    detailsBtn.textContent = 'Detalhes';

    actions.append(focusBtn, detailsBtn);
    li.append(name, address, details, actions);

    return li;
  });
}

function renderHistoryList(container, entries) {
  if (!container) {
    return;
  }

  container.innerHTML = '';
  if (!entries.length) {
    const li = document.createElement('li');
    li.className = 'muted';
    li.textContent = 'Nenhuma movimentação registrada.';
    container.appendChild(li);
    return;
  }

  entries.forEach((entry) => {
    const li = document.createElement('li');
    const wrapper = document.createElement('div');
    const title = document.createElement('strong');
    title.textContent = entry.date;
    const subtitle = document.createElement('span');
    subtitle.textContent = entry.description;
    wrapper.append(title, subtitle);

    const value = document.createElement('span');
    const isPositive = entry.value >= 0;
    value.className = isPositive ? 'positivo' : 'negativo';
    const prefix = isPositive ? '+' : '-';
    value.textContent = ${prefix} Eco;

    li.append(wrapper, value);
    container.appendChild(li);
  });
}

function syncSelectedPointActions(root) {
  const selected = getSelectedPoint();
  if (!selected) {
    return;
  }

  root.querySelectorAll('[data-point-source="selected"]').forEach((element) => {
    element.dataset.pointId = selected.id;
  });
}

function handleAction(action, element) {
  switch (action) {
    case 'simulateDeposit':
      simulateDeposit(resolvePointId(element));
      break;
    case 'focus-point':
      focusPoint(resolvePointId(element));
      break;
    case 'open-point':
      openPoint(resolvePointId(element));
      break;
    case 'redeem-product':
      redeemProduct(element.dataset.productId);
      break;
    default:
      break;
  }
}

function resolvePointId(element) {
  return element?.dataset.pointId || (element?.dataset.pointSource === 'selected' ? state.selectedPointId : undefined);
}

function handleAuth(type, formData) {
  const rawName = (formData.get('name') || '').trim();
  if (rawName) {
    const [firstName] = rawName.split(' ');
    state.userName = firstName;
  }

  showToast(type === 'signup' ? 'Cadastro simulado com sucesso.' : 'Login confirmado.');
  loadScreen('home');
}

function simulateDeposit(pointId) {
  const point = getPoint(pointId) || getSelectedPoint();
  const bonus = getRandomInt(120, 420);
  state.coins += bonus;
  state.monthlyGain += bonus;

  addHistoryEntry({
    id: dep-,
    date: formatDate(new Date()),
    description: ${point.name} - coleta registrada,
    value: bonus,
  });

  showToast(+ EcoCoins adicionados.);
  refreshCurrentScreen();
}

function focusPoint(pointId) {
  const point = setSelectedPoint(pointId);
  if (!point) {
    return;
  }

  showToast(${point.name} atualizado no mapa.);
  refreshCurrentScreen();
}

function openPoint(pointId) {
  const point = setSelectedPoint(pointId);
  if (point) {
    loadScreen('point-details');
  }
}

function redeemProduct(productId) {
  const product = state.products.find((item) => item.id === productId);
  if (!product) {
    return;
  }

  if (state.coins < product.cost) {
    showToast('Saldo insuficiente para este resgate.', 'error');
    return;
  }

  state.coins -= product.cost;

  addHistoryEntry({
    id: edeem-,
    date: formatDate(new Date()),
    description: Resgate ,
    value: -product.cost,
  });

  showToast(Resgate de  confirmado.);
  refreshCurrentScreen();
}

function addHistoryEntry(entry) {
  state.history.unshift(entry);
}

function getPoint(pointId) {
  return state.points.find((point) => point.id === pointId);
}

function getSelectedPoint() {
  return getPoint(state.selectedPointId) || state.points[0];
}

function setSelectedPoint(pointId) {
  const point = getPoint(pointId);
  if (!point) {
    return null;
  }

  state.selectedPointId = point.id;
  return point;
}

function formatCoins(value) {
  return numberFormatter.format(value);
}

function formatDate(date) {
  return dateFormatter.format(date);
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function renderList(container, items, builder) {
  if (!container) {
    return;
  }

  container.innerHTML = '';
  items.forEach((item) => {
    const element = builder(item);
    if (element) {
      container.appendChild(element);
    }
  });
}

function showToast(message, variant = 'success') {
  if (!toastEl) {
    return;
  }

  toastEl.textContent = message;
  toastEl.classList.remove('error');
  if (variant === 'error') {
    toastEl.classList.add('error');
  }
  toastEl.classList.add('is-visible');

  window.clearTimeout(toastTimeout);
  toastTimeout = window.setTimeout(() => {
    toastEl.classList.remove('is-visible');
  }, 3200);
}
