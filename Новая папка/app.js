// Demo client-side logic: SW registration, simple IndexedDB auth, notifications, sound, vibration
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const notifyBtn = document.getElementById('notifyBtn');
const playSoundBtn = document.getElementById('playSoundBtn');
const vibrateBtn = document.getElementById('vibrateBtn');
const infoEl = document.getElementById('info');

const audio = document.getElementById('ding');

// Регистрация service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').then(() => {
    console.log('SW registered');
  }).catch(e => console.warn('SW reg failed', e));
} else {
  console.warn('Service Worker not supported');
}

// IndexedDB: минимальная обёртка
function openDB(){
  return new Promise((res, rej) => {
    const rq = indexedDB.open('demo-pwa-db', 1);
    rq.onupgradeneeded = e => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('auth')) db.createObjectStore('auth', { keyPath: 'id' });
    };
    rq.onsuccess = () => res(rq.result);
    rq.onerror = () => rej(rq.error);
  });
}

async function saveToken(token){
  const db = await openDB();
  const tx = db.transaction('auth','readwrite');
  tx.objectStore('auth').put({ id: 'me', token });
  return tx.complete;
}

async function loadToken(){
  const db = await openDB();
  return new Promise((res, rej) => {
    const r = db.transaction('auth','readonly').objectStore('auth').get('me');
    r.onsuccess = () => res(r.result ? r.result.token : null);
    r.onerror = () => rej(r.error);
  });
}

async function init(){
  try{
    const t = await loadToken().catch(()=>null);
    if (t) {
      onLoggedIn();
      infoEl.textContent = 'Авторизация: токен найден в IndexedDB';
    } else {
      document.getElementById('auth').hidden = false;
      infoEl.textContent = 'Не авторизован';
    }
  }catch(e){
    console.warn(e);
  }
}

function onLoggedIn(){
  document.getElementById('auth').hidden = true;
  document.getElementById('controls').hidden = false;
}

loginBtn.addEventListener('click', async () => {
  const user = (document.getElementById('username').value || 'user').trim();
  const fakeToken = btoa(user + ':' + Date.now());
  await saveToken(fakeToken);
  onLoggedIn();
  infoEl.textContent = 'Вход выполнен (локально)';
});

logoutBtn.addEventListener('click', async () => {
  const db = await openDB();
  const tx = db.transaction('auth','readwrite');
  tx.objectStore('auth').delete('me');
  tx.oncomplete = () => location.reload();
});

notifyBtn.addEventListener('click', async () => {
  if (!('Notification' in window)) { alert('Уведомления не поддерживаются в этом браузере'); return; }
  const perm = await Notification.requestPermission();
  if (perm !== 'granted') { alert('Разрешение на уведомления не дано'); return; }
  new Notification('Привет из DemoPWA', { body: 'Это локальное уведомление' });

  if ('serviceWorker' in navigator && 'PushManager' in window) {
    const sw = await navigator.serviceWorker.ready;
    try {
      const sub = await sw.pushManager.getSubscription();
      if (!sub) {
        console.log('No push subscription yet (example)');
      } else {
        console.log('Already subscribed to push:', sub);
      }
    } catch(e) { console.warn('push subscribe failed', e); }
  }
});

playSoundBtn.addEventListener('click', () => {
  audio.play().catch(e => console.warn('Audio play failed', e));
});

vibrateBtn.addEventListener('click', () => {
  if ('vibrate' in navigator) {
    navigator.vibrate([200,100,200]);
  } else {
    alert('Vibration API не поддерживается (на iOS Safari обычно не работает).');
  }
});

init();