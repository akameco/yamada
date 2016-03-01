'use strict';
const electron = require('electron');
const chokidar = require('chokidar');
const shuffle = require('lodash.shuffle');
const storage = require('electron-json-storage');
const app = electron.app;

const INTERVAL_TIME = process.env.INTERVAL_TIME || 3000;
const EXT_PATTERNS = '/*.{png|jpg|jpeg|gif}';

const WIDTH = 260;
const HEIGHT = 280;

let mainWindow;
let images = [];
let watcher = null;
let timer = null;

function onClosed() {
  mainWindow = null;
}

function createMainWindow() {
  const electronScreen = electron.screen;
  const size = electronScreen.getPrimaryDisplay().workAreaSize;

  const win = new electron.BrowserWindow({
    title: 'yamada',
    width: WIDTH,
    height: HEIGHT,
    x: size.width - WIDTH,
    y: size.height - HEIGHT,
    alwaysOnTop: true,
    frame: false
  });

  initMenu();

  win.loadURL(`file://${__dirname}/index.html`);
  win.on('closed', onClosed);
  return win;
}

function openDirectory() {
  const dialog = electron.dialog;
  const dir = dialog.showOpenDialog(mainWindow, {properties: ['openDirectory']});

  setWindowOnTop();

  if (!dir) {
    return;
  }

  storage.set('config', {imageDir: dir}, err => {
    if (err) {
      console.log(err);
    }
  });

  images = [];
  setupWatcher(dir);
}

// dialogを開くとalwaysOnTopが解除されるため
function setWindowOnTop() {
  setTimeout(() => {
    if (!mainWindow.isAlwaysOnTop()) {
      mainWindow.setAlwaysOnTop(true);
    }
  }, 100);
}

function updateImages(time) {
  let i = 0;
  timer = setInterval(() => {
    sendImage(images[i]);
    i += 1;
    if (i > images.length - 1) {
      i = 0;
    }
  }, time);
}

function sendImage(image) {
  try {
    mainWindow.webContents.send('image', JSON.stringify(image));
  } catch (e) {
    console.log('Error', e);
  }
}

function setupWatcher(dir) {
  if (watcher && watcher.getWatched()) {
    watcher.close();
  }

  watcher = chokidar.watch(dir[0] + EXT_PATTERNS, {ignored: /[\/\\]\./});
  watcher
    .on('all', () => {
      // ファイルに更新がある場合、再シャッフル
      images = shuffle(images);
    })
    .on('add', path => {
      images.push(path);
    })
    .on('unlink', path => images = images.filter(filename => filename !== path))
    .on('ready', () => {
      setTimeout(() => {
        images = shuffle(images);
        sendImage(images[0]);
      }, 10);
    });
}

function initMenu() {
  const Menu = electron.Menu;
  const name = app.getName();
  const menu = Menu.buildFromTemplate([
    {
      label: name,
      submenu: [
        {
          label: 'About ' + name,
          role: 'about'
        },
        {
          type: 'separator'
        },
        {
          label: 'Services',
          role: 'services',
          submenu: []
        },
        {
          type: 'separator'
        },
        {
          label: 'Hide ' + name,
          accelerator: 'Command+H',
          role: 'hide'
        },
        {
          label: 'Hide Others',
          accelerator: 'Command+Alt+H',
          role: 'hideothers'
        },
        {
          label: 'Show All',
          role: 'unhide'
        },
        {
          type: 'separator'
        },
        {
          label: 'Open',
          accelerator: 'Command+O',
          click: openDirectory
        },
        {
          label: 'Alway On Top',
          accelerator: 'Command+T',
          click: () => mainWindow.setAlwaysOnTop(true)
        },
        {
          type: 'separator'
        },
        {
          label: 'Quit',
          accelerator: 'Command+Q',
          click: () => app.quit()
        }
      ]
    }
  ]);
  Menu.setApplicationMenu(menu);
}

app.on('window-all-closed', () => {
  clearInterval(timer);
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (!mainWindow) {
    mainWindow = createMainWindow();
    updateImages(INTERVAL_TIME);
  }
});

app.on('ready', () => {
  mainWindow = createMainWindow();

  storage.get('config', (err, data) => {
    if (err) {
      console.log(err);
    }

    if (data.imageDir) {
      setupWatcher(data.imageDir);
    } else {
      openDirectory();
    }
  });

  updateImages(INTERVAL_TIME);
});
