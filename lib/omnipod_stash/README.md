# Overview
- This app helps you to keep track of your personal storage of omnipods/sensors and insulin cartridges.
- You manually enters how many pods/sensors/cartridges to add when you stock up, and the app automatically reduces the counter when it tracks a pod- or sensor-change from the NS-database. You'll have to manually enter when you discards an insulin chartidge.
    - This is only tested with AAPS/Omnipod/dexcom G6, which enters this data automatically at every change, but I've heard that ios-loop users enters this manually in NS!? Hopefully it looks the same in the NS-db - othervice I'll need to tweek the code to also cover loop! 
- When one of the three tracked items runs low (less than a threashold value selected by you), you'll get notified with an email telling you to stock up! 
- The email contains direct links to either add 1, 5 or 10 items, or open up the controller web-site where you can click on buttons and see status. 

Email example

![email](./Assets/email.png)

Web-site:

![email](./Assets/website.png)

- The app connects directly to your Nightscout database once a day to search for pod/sensor-changes and saves this info in a separate table (not touching the NS-data!). The table is really light weight and will not affect your db usage noticable!
- You don't need to worry that this app will eat up all of your free dynos in Heroku since it is only active once a day for 30min to check if you need notification or not (plus a fiew 30-mins when you opens upp the site to alter values). Because of this, it takes a while for the site to load when you haven't used it for a while (~20s)...
Fair price to pay for hosting a free site!

OBS if you use one of the links in the email when the app is ideling (sleeping), you will see a blank page for ~20s before you get the response from the server. If using gmail/chrome: the browser tries to be smart and will send the request twice automatically which is kind of bad, so I had to make a rule that email-links cannot be clicked twice within 10s. When this occures, the response is not sure if your request was ok or not, so it will just show you a message and the current count for you to decide if the item was added or not. 


# Installation on Heroku
- If you just want to update, see the [Update](#update)-section
- This installation is done in three easy-to-follow steps: 
    - [App installation](#app-installation) (installation on heroku)
    - [Enter config vars](#enter-config-vars) (give the app your credentials etc)
    - [Heroku Scheduler](#heroku-scheduler) (setup a task that will run once a day to check your status and send email)

## App installation
1. Make a fork of this git-repo to your github 
    - You must be logged in to your github account!
    - Fork button (located top right)
    ![tabs](./Assets/fork.png)
2. log into your account at [heroku.com](https://dashboard.heroku.com/) (same as you use to host NightScout)
3. Click the "New" button (upper right side) => "Create new app"
4. Choose App-name which will be the url to the site for example: mynamediabetesstash (url will be: mynamediabetesstash.herokuapp.com)
5. leave region to United States => create app
6. Open up the "Deploy"-tab
![tabs](./Assets/tabs.png)
7. Scroll down to "Deployment method" (left side) choose GitHub
![deploy method](./Assets/deploy_method.png)
7. Since you're already connected from your Nigtscout-app - click purple "Search" button to list all of your repos, locate the omnipod-stash-fork-repo and hit the "Connect" button that appears next to it.
8. Scroll down and enable the "Enable Automatic Deploy" (to tell Heroku to automatically trigger an installation of your fork when you decide to pull all the update from my github-fork to yours (bug-fixes etc))
![auto deploy](./Assets/auto_deploy.png)
9. Scroll down to the very bottom and hit "Deploy Branch" to install the app on Heroku. 
![deploy](./Assets/deploy_branch.png)

## Enter config vars
Now you need to enter the Config-vars (same as you did with Nightscout)
1. You need the MONGODB_URI that you have entered in Nightscout app, so start by changing to that app:
    - Click "Personal" button on the top left to change app
    - select the Nightscout-app
    - open "Settings"-tab/"Reveal config vars" and copy the MONGODB_URI value ("mongodb+srv://..........)

2. Go back to your omnipod-stash-app and "Settings"-tab/"Reveal config vars" 
3. Add these vars: (key value) => "Add"
    - **HEROKU_APP_NAME** = Same as the one you choose for the app. (mynamediabetesstash in example above!)
    - **FROM** = **ordernewpods** (use this if you do not know what you're doing...)
    - **EMAIL_TO** = (comma separated list of emails to get notification)

    ![config vars](./Assets/config_vars.png)

    Optional parameters (3 is default value for these ones => less than 3 pods/sensors/insulin will send you and email per day!)
    - **LANGUAGE** = ENG (deafults to email text in swedish...)
    - **INSULINLIMIT** = 3
    - **PODLIMIT** = 3
    - **SENSORLIMIT** = 3

## Heroku Scheduler
OBS! Heroku does not promise that the task will be run at every scheduled time! I have noticed that it skipps tasks once in a while, but that's ok, as long as it doesn't skip several days in a row!

To get you app to update/check your stash once a day, you need to setup a Task scheduler.
1. Open the "Resources"-tab and in the Add-ons searchbox type "heroku scheduler" and click on it
2. Make sure you have the "Standard - Free"-plan selected (default) and press "Submit order from" 
3. Click on the newly added "Heroku Scheduler" (opens up new page)
4. "Create job"
5. "Every day at..." - and select a time (obs! UTC = London time!)
6. after the $ paste "runAllTasks" (without the "")
7. click "save job"
![email](./Assets/task.png)

**If you dont want the service to notify you of all three types**, you can **instead** specify the events that you want. 
(remove or reuse/rename the event you created for "runAllEvents")
Rrepete these steps for the ones you'd like to get updates/notifications from: (pod/sensor/insulin)
1. "Create job"
2. "Every day at..." - and select a time 
3. after the $ paste one of the three tasks: 
    - checkPodState
    - checkSensorState
    - checkInsulinState
4. click "save job" and repeat by clicking "Add Job" (top right)

Open your website by clicking the button "Open app" (location: top right) and see if it works to "set count" or "add count" on pods/sensors/insulin

## Update
If you already have this installed and just want to update your fork with my latest commits: 
1. click the button "Fetch upstream" (just under the green "Code"-button located top right-ish)
  - Click the green "Fetch and merge"
2. If you followed the installation above and "Enable Automatic Deploy" - then congratulations: you'red done and will have the updates installed and deployed in 5mins. 
 - If not: 
   - Open your site at [heroku.com](https://dashboard.heroku.com/) 
   - Click the Deploy-tab and scroll down to the very bottom and hit "Deploy Branch" to install.



# Technical Overview (you can stop reading here...)
This app consists of 3 parts: 
1. Api-backend that handles conection to the database
2. A single page app (frontend) that lets the user alter current nr of items
    - calls the api-backend to access the NS-db
3. A Heroku scheduled task that polls the NS-db for pod-changes and updates the count of used pods. 

For now this app does not require a sign in because it only allows the client to update the app-specific table keeping track of the number of pods left in the NS database. Not much fun for a hacker since the only thing you can do with this app is to update your counter of pods so that in worst case scenario you'd get a notification telling you that you're out of pods even if you're not.  

# debug in visual studio code
## debug both frontend and backend in single config: 
select the "Debug All" configuration when debugging with F5-key
NB: create .env file in root, where you put `BROWSER=none` then  "Launch Frontend" won't open an extra browser...
```
{
    "configurations": [
        {
            "name": "Launch backend",
            "type": "node",
            "request": "launch",
            "skipFiles": ["<node_internals>/**"],
            "program": "${workspaceFolder}/server/index.js",
        },
        {
            "name": "Launch Frontend",
            "type": "node",
            "request": "launch",
            "cwd": "${workspaceRoot}/frontend",
            "runtimeExecutable": "npm",
            "runtimeArgs": [
                "run-script", "start"
            ],
            "port": 3000
        },
        {
            "name": "Launch Chrome",
            "request": "launch",
            "type": "pwa-chrome",
            "url": "http://localhost:3000",
            "webRoot": "${workspaceFolder}"
        }
    ],
    "compounds": [
        {
            "name": "Debug All",
            "configurations": ["Launch Frontend", "Launch Frontend", "Launch Chrome"]
        }
    ]
}
```
## To debug the server/index.js only
(breakpoints will not work in the frontend-app!)
1. build the react frontend first with: 
    - `cd frontend`
    - `npm run build` 
2. run use the configuration "Launch backend" (.vscode/launch.json) with f5 (see bellow) no need to manually run "npm start" first!
```
"configurations": [
    {
        "type": "node",
        "request": "launch",
        "name": "Launch backend",
        "skipFiles": ["<node_internals>/**"],
        "program": "${workspaceFolder}/server/index.js",
    }
]
```
## to debug the /frontend-react app 
open the /frontend-folder in different vscode and run its debug config separately!
- run the "Debug Both"-config in the frontend/.vscode/launch.json with f5:
```
"configurations": [
    {
        "name": "Launch Frontend",
        "type": "node",
        "request": "launch",
        "cwd": "${workspaceRoot}",
        "runtimeExecutable": "npm",
        "runtimeArgs": [
            "run-script", "start"
        ],
        "port": 3000
    },
    {
        "name": "Launch Chrome",
        "request": "launch",
        "type": "pwa-chrome",
        "url": "http://localhost:3000",
        "webRoot": "${workspaceFolder}"
    }

    ],
    "compounds": [
        {
            "name": "Debug Both",
            "configurations": ["Launch Frontend", "Launch Chrome"]
        }
    ]
```
# run scheduled task in Heroku
- task needs to be placed under /bin/-folder and without file-ending
- task is a node file and has a start-line of `#! /app/.heroku/node/bin/node` and ´process.exit();´ to close the runner when finnished. 
- When deployed to heroku, test by "More"-button/"Run Console" and run the filename in the "heroku run"-box.'
- test script with breakpoints: 
    - create a copy with file-ending .js
    - remove the first line (`#! /app/.heroku/node/bin/node`)
    - put function-call at end of file (without await)
    - ctrl+shift+p => search "Auto atach" and "Only With Flag" in vscode
        - Restart termial!!!
    - run test: 'node --inspect ./bin/test.js'
