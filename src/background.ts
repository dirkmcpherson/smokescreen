// This is main process of Electron, started as first thing when your
// app starts. This script is running through entire life of your application.
// It doesn't have any windows which you can see on screen, but we can open
// window from here.

import * as path from 'path';
import * as url from 'url';
import { app, Menu } from 'electron';
import { devMenuTemplate } from './menu/dev_menu_template';
import { editMenuTemplate } from './menu/edit_menu_template';
import createWindow from './helpers/window';
var rp = require('request-promise');
var cheerio = require('cheerio');

// Special module holding environment variables which you declared
// in config/env_xxx.json file.
import env from './env';

var mainWindow;

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

// Scrape and extract next url to visit
var nextURL = `https://www.google.com`;
var browserUpdate = function() {
    console.log('Browser update: ' + nextURL)

    const options = {
        uri: nextURL,
        transform: function (body) {
            return cheerio.load(body);
        }
    };

    rp(options)
        .then(($) => {
            // console.log($());
            // Scrape the page and save the next url
            nextURL = `https://www.sears.com`
            var links = $('a'); //jquery get all hyperlinks
            $(links).each(function(i, link){
              console.log($(link).text() + ':\n  ' + $(link).attr('href'));
            });
        })
        .catch((err) => {
            console.log(err);
        });
}
var browserUpdateIntervalID = null;

app.on('ready', function () {
    setApplicationMenu();

    var mainWindow = createWindow('main', {
        width: 1000,
        height: 600
    });

    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'app.html'),
        protocol: 'file:',
        slashes: true
    }));

    browserUpdateIntervalID = setInterval(browserUpdate, 1000);

    if (env.name === 'development') {
        mainWindow.openDevTools();
    }
});

app.on('window-all-closed', function () {
    app.quit();
});