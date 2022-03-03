import './App.css';

import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Mainpage from './Mainpage';
import "react-loader-spinner/dist/loader/css/react-spinner-loader.css";
function App() {
  const urlPath = window.location.pathname.split("/").filter(e =>  e);
  const localserver = urlPath.length == 0 ? "/" : "/" + urlPath[0] + "/";
  return (
    <div className="App">
      <header className="App-header">
      </header>
      <body>
        <BrowserRouter>
          <Routes>
            <Route path={localserver} element={<Mainpage Typ="pod" />} />
            <Route path={localserver + "pod"} element={<Mainpage Typ="pod" />} />
            <Route path={localserver + "sensor"} element={<Mainpage Typ="sensor" />} />
            <Route path={localserver + "insulin"} element={<Mainpage Typ="insulin" />} />
          </Routes>
        </BrowserRouter>
      </body>
    </div>
  );
}

export default App;
