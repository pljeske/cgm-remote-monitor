function create(env, ctx) {
    const express = require('express');

    const path = require('path');

    const dbhelper = require("./updatedb.js")

    const isDev = process.env.NODE_ENV !== 'production';
    const PORT = Number(process.env.PORT) + 2 || 1339;

    const app = express();

    // Priority serve any static files.
    app.use(express.static(path.resolve(__dirname, '../frontend/build')));

    //this is for debugging  
    app.use(function (req, res, next) {
        if (isDev) {
            res.header('Access-Control-Allow-Origin', '*');
            res.header(
                'Access-Control-Allow-Headers',
                'Origin, X-Requested-With, Content-Type, Accept'
            );
        }
        next();
    });

    // Answer API requests with param ("/addtocount/pod/10") 
    // For params instead of /:sdgf/:dfsf ("/addtocount?nr=23&type=omnipod") see: https://stackoverflow.com/a/17008027

    const validTypes = ["pod", "sensor", "insulin"];
    app.get('/getcount/:typ', async function (req, res) {
        res.set('Content-Type', 'application/json');
        let typ = req.params.typ;
        if (!validTypes.includes(typ)) {
            res.send('{"message":"Not a valid call!"}');
            return;
        }
        let count = await dbhelper.getCount(typ);
        res.send('{"Count":"' + count + '"}');
    });

    app.get('/getlastlogs/:typ/:nr', async function (req, res) {
        res.set('Content-Type', 'application/json');
        let typ = req.params.typ;
        let nr = req.params.nr;
        if (!validTypes.includes(typ) || isNaN(+nr)) {
            res.send('{"message":"Not a valid call!"}');
            return;
        }
        let lastActions = await dbhelper.getLastActions(typ, nr);
        res.send(JSON.stringify(lastActions));
    });

    const delaytime = 10;
    var lastCall = new Date();
    var lastType = '';
    var lastVal = '';
    var lastOp = '';
    var lastId = '';

    function validateCall(type, val, op, id, source) {

        var isValid = true;
        if (id && lastId === id) { //frontend sets id on calls
            console.log("Api received multiple calls...");
            isValid = false;

        } else if (source && source === "email"
            && type === lastType
            && val === lastVal
            && op === lastOp
            && lastCall > (new Date()).setSeconds((new Date()).getSeconds() - delaytime)
        ) {
            console.log("too early, at least " + delaytime + "s between api-calls (prevent douplicates)");
            isValid = false;
        } else {
            lastCall = new Date();
        }
        lastType = type;
        lastVal = val;
        lastOp = op;
        if (id) {
            lastId = id;
        }
        return isValid;
    }

    app.get('/addtocount', async function (req, res) {

        let typ = req.query.typ;
        let nr = req.query.nr
        let id = req.query.id;
        let source = req.query.source;

        console.log(req.query);
        console.log(typ + ":" + nr);

        res.set('Content-Type', 'application/json');
        if (!validTypes.includes(typ) || isNaN(+nr)) {
            res.send('{"message":"Not a valid call!"}');
            return;
        }

        if (!validateCall(typ, nr, "add", id, source)) {
            console.log("Too soon!");
            let count = await dbhelper.getCount(typ);
            res.send('{"message":"Multiple calls to API registered! Wait at least 10s between link-clicks of same link to prevent douplicates!", '
                + '"Info":"Your action might still have been registered ok!", '
                + '"Current count": ' + count + '}');
            return;
        }

        await dbhelper.updatedb(nr, typ, source);
        let count = await dbhelper.getCount(typ);
        res.send('{"message":"' + nr + ' ' + typ + 's added to ' + typ + '-stash",'
            + '"Current count": ' + count + '}');

    });

    app.get('/setcount', async function (req, res) {
        let typ = req.query.typ;
        let nr = req.query.nr
        let id = req.query.id;
        let source = req.query.source;

        console.log(req.query);
        console.log(typ + ":" + nr);

        res.set('Content-Type', 'application/json');

        if (!validTypes.includes(typ) || isNaN(+nr)) {
            res.send('{"message":"Not a valid call!"}');
            return;
        }

        if (!validateCall(typ, nr, "set", id, source)) {
            console.log("Too soon!");
            let count = await dbhelper.getCount(typ);
            res.send('{"message":"Multiple calls to API registered! Wait at least 10s between link-clicks of same link to prevent douplicates!", '
                + '"Info":"Your action might still have been registered ok!", '
                + '"Current count": ' + count + '}');
            return;
        }

        await dbhelper.updatedb(nr, typ, source, true);
        res.send('{"message":"Stash count of type: ' + typ + ' is reset!", "Current count": ' + nr + '}');
    });


    // All remaining requests return the React app, so it can handle routing.
    app.get('*', function (request, response) {
        response.sendFile(path.resolve(__dirname, '../frontend/build', 'index.html'));
    });

    app.listen(PORT, function () {
        console.error(`Node ${isDev ? 'dev server' : 'cluster worker ' + process.pid}: listening on port ${PORT}`);
    });


    return app;
}

module.exports = create;