// This is main process of Electron, started as first thing when your
// app starts. This script is running through entire life of your application.
// It doesn't have any windows which you can see on screen, but we can open
// window from here.

import * as path from 'path';
import * as url from 'url';
import { app, Menu, BrowserWindow, ipcMain } from 'electron';
import { devMenuTemplate } from './menu/dev_menu_template';
import { editMenuTemplate } from './menu/edit_menu_template';
import createWindow from './helpers/window';
import { Browser } from './browser';

// Special module holding environment variables which you declared
// in config/env_xxx.json file.
import env from './env';

var mainWindow;
var browserWindow;
var transparentWindowOverlay;

var setApplicationMenu = function () {
    var menus: any[] = [editMenuTemplate];
    if (env.name !== 'production') {
        menus.push(devMenuTemplate);
    }
    Menu.setApplicationMenu(Menu.buildFromTemplate(menus));
};

// Save userData in separate folders for each environment.
// Thanks to this you can use production and development versions of the app
// on same machine like those are two separate apps.
if (env.name !== 'production') {
    var userDataPath = app.getPath('userData');
    app.setPath('userData', userDataPath + ' (' + env.name + ')');
}

let browser = new Browser()
var browserUpdateIntervalID = null;

var updatePage = function () 
{
    let currentURL: string = browser.nextURL;
    browser.selectNextURL()
        .then((nextURL) => {
            browserWindow.loadURL(nextURL)
        })
}

var update

app.on('ready', function () {
    setApplicationMenu();


    browserUpdateIntervalID = setInterval(updatePage, 5000);
    const x_start = 0
    const y_start = 0
    const w = 250
    const h = 225

    browserWindow = new BrowserWindow({
        x:x_start,
        y:y_start,
        width:w, 
        height:h,
        show:false,
        icon: path.join(__dirname, 'build/icons/512x512.png')
    })
    transparentWindowOverlay = new BrowserWindow({
        parent: browserWindow, 
        x:x_start,
        y:y_start,
        transparent: true,
        frame: false,
        width: w,
        height: h,
        show: false
    })
    transparentWindowOverlay.setIgnoreMouseEvents(true)
    transparentWindowOverlay.loadURL(url.format({
        pathname: path.join(__dirname, 'app.html'),
        protocol: 'file:',
        slashes: true
    }))
    transparentWindowOverlay.setBrowser
    browserWindow.loadURL(browser.nextURL)

    browserWindow.once('ready-to-show', () => {
        browserWindow.show()
        transparentWindowOverlay.show()
    })

    browserWindow.on('resize', function (e, x, y) {
        // update child container size
        let browserSize = browserWindow.getContentSize();
        transparentWindowOverlay.setContentSize(browserSize[0], browserSize[1], true)
    });

    // if (env.name === 'development') {
    //     mainWindow.openDevTools();
    // }
});

app.on('window-all-closed', function () {
    app.quit();
});
