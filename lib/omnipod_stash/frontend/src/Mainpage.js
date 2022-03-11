import axios from 'axios';
import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { BallTriangle } from 'react-loader-spinner'

export default function Mainpage({ Typ }) {
    const navigate = useNavigate();
    const [nrToAdd, setNrToAdd] = useState();
    const [nrTotal, setNrTotal] = useState();
    const [totalCount, setTotalCount] = useState("-");
    const [lastActions, setLastActions] = useState();
    const [isLoading, setIsLoading] = useState(true);

    const nrOfLogsToShow = 10;

    //var localserver = "/omnipodstash";
    const urlPath = window.location.pathname.split("/").filter(e => e);
    var localserver = urlPath.length == 0 ? "" : "/" + urlPath[0];
    // if(window.location.host == "localhost:1339"){
    //     localserver = "";
    // }
    if (window.location.host == "localhost:3000") {
        localserver = "http://localhost:1339";
    }
    console.log("pathname: " + window.location.pathname);
    console.log("localserver: " + localserver);

    useEffect(async () => {
        setIsLoading(true);
        setLastActions(null);
        await getCount();
    }, [navigate]) //run only on navigation change!    

    useEffect(async () => {
        await getlastlogs(nrOfLogsToShow);
    }, [totalCount])

    const updateCountAddition = async (e) => {
        setLastActions(null);
        setIsLoading(true);
        setNrToAdd("");

        try {
            var add = nrToAdd;
            if (e != null) {
                add = e;
            }
            console.log("adding " + add);
            if (isNaN(+add)) {
                console.log("not a number!");
                alert("Not a number!")
                return;
            }
            await axios.get(localserver + '/addtocount', { params: { typ: Typ, nr: add, source: 'web', id: new Date() } });
            await getCount();
        } catch (e) {
            console.log(e);
        } finally {
            setIsLoading(false);
        }
    };
    const setCountTotal = async () => {
        setIsLoading(true);
        setLastActions(null);
        setNrTotal("");

        try {
            let countTotal = nrTotal;
            if (isNaN(+countTotal)) {
                console.log("not a number!");
                alert("Not a number!")
                return;
            }
            const res = await axios.get(localserver + '/setcount', { params: { typ: Typ, nr: countTotal, source: 'web', id: new Date() } });
            await getCount();
        } catch (e) {
            console.log(e);
        } finally {
            setIsLoading(false);
        }
    };
    const getCount = async () => {

        try {
            console.log("getCount of: " + Typ);
            console.log('/getcount/' + Typ);
            const res = await axios.get(localserver + '/getcount/' + Typ);

            if (res.data.Count !== undefined) {
                console.log("Count: " + res.data.Count);
                setTotalCount(res.data.Count);
            }

        } catch (e) {
            console.log(e);
        } finally {
            setIsLoading(false);
        }
    };
    const getlastlogs = async (nrOfLogs) => {
        try {
            setLastActions(null);
            console.log("getLastLogs of: " + Typ);
            console.log('/getlastlogs/' + Typ + '/' + nrOfLogs);
            const res = await axios.get(localserver + '/getlastlogs/' + Typ + '/' + nrOfLogs);

            if (res.data !== undefined) {
                //console.log("lastLogs: " + res.data);
                setLastActions(res.data);
            }

        } catch (e) {
            console.log(e);
        }
    };
    function dateToString(d) {
        d = new Date(d);
        return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2)
            + " " + ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2) + ":" + ("0" + d.getSeconds()).slice(-2);
    }

    return (
        <>
            <div>
                <button
                    onClick={() => navigate((localserver.includes("http") ? "" : localserver) + '/pod')}
                    disabled={Typ == "pod"}
                    className="tabBtn">Pods</button>
                <button
                    onClick={() => navigate((localserver.includes("http") ? "" : localserver) + '/sensor')}
                    disabled={Typ == "sensor"}
                    className="tabBtn">Sensors</button>
                <button
                    onClick={() => navigate((localserver.includes("http") ? "" : localserver) + '/insulin')}
                    disabled={Typ == "insulin"}
                    className="tabBtn">Insulin</button>
            </div>
            <br />
            <text style={{ fontSize: "40px" }}>
                In storage
            </text>
            <text style={{ fontSize: "70px" }}>
                {isLoading ? <BallTriangle color="#00BFFF" height={80} width={80} /> : totalCount}
            </text>
            <br />

            <div className="logg" style={{ textAlign: 'center' }}>
                {lastActions && !isLoading ?
                    <>
                        Last detected {Typ} change
                        <br />
                        {dateToString(lastActions[0]?.LastKnownChange)}
                    </> : <><br /><br /></>
                }
            </div>
            <br />
            <div style={{ textAlign: 'center' }}>
                <div title={"adds x-number of " + Typ + "s to stash (negative or positive number)"}>
                    <p style={{ marginBottom: '-20px', marginTop: '-10px' }}>Add/Remove {Typ}s</p>
                    <br />
                    <input type="text"
                        autoFocus
                        value={nrToAdd}
                        onChange={(e) => setNrToAdd(e.target.value)}
                    />
                    <button
                        onClick={() => updateCountAddition(null)}
                        disabled={isLoading} >OK</button>
                </div>
                <br />
                <div title={"Sets current number of " + Typ + "s in stash (positive number)"}>
                    <p style={{ marginBottom: '-20px', marginTop: '-10px' }}>Set total nr of {Typ}s</p>
                    <br />
                    <input type="text"
                        value={nrTotal}
                        onChange={(e) => setNrTotal(e.target.value)}
                    />
                    <button
                        onClick={setCountTotal}
                        disabled={isLoading} >OK</button>
                </div>
            </div>
            <br />
            <div title={"Same as Add " + Typ + "s above, but with predefined values"}>
                <p style={{ textAlign: 'center' }}>Quick-add</p>
                <button onClick={() => updateCountAddition(-1)} disabled={isLoading}>-1</button>
                <button onClick={() => updateCountAddition(1)} disabled={isLoading}>1</button>
                <button onClick={() => updateCountAddition(5)} disabled={isLoading}>5</button>

                <br />
                <br />
                <button onClick={() => updateCountAddition(10)} disabled={isLoading}>10</button>
                <button onClick={() => updateCountAddition(20)} disabled={isLoading}>20</button>
                <button onClick={() => updateCountAddition(40)} disabled={isLoading}>40</button>
            </div>

            <br />
            <br />
            History
            <div className="logg" >
                {lastActions?.map((it) => <text >{dateToString(it.date)}, count: {it.Count}, ({it.diff < 0 ? it.diff : "+" + it.diff}, {it.Source})<br /> </text>)}
            </div>
            <br />
            {/* <text>Email to: {process.env.EMAIL_TO}</text>
            <text>Send email when count is less than: {Typ == "pods" ? process.env.PODLIMIT : process.env.SENSORLIMIT}</text> */}
        </>
    )
}
