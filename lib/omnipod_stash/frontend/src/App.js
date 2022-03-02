import './App.css';

import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Mainpage from './Mainpage';
import "react-loader-spinner/dist/loader/css/react-spinner-loader.css";

function App() {
  return (
    <div className="App">
      <header className="App-header">
      </header>
      <body>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Mainpage Typ="pod" />} />
            <Route path="/pod" element={<Mainpage Typ="pod" />} />
            <Route path="/sensor" element={<Mainpage Typ="sensor" />} />
            <Route path="/insulin" element={<Mainpage Typ="insulin" />} />
          </Routes>
        </BrowserRouter>
      </body>
    </div>
  );
}

export default App;
