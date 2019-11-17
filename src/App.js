import React from 'react';
import './App.css';
import FeeTable from './FeeTable.js';
import Footer from "./Footer";

function App() {

  return (
    <div className="App">
      <header className="App-header">


          <FeeTable/>

      </header>
      <footer className="App-footer">
        <Footer/>
      </footer>
    </div>
  );
}


export default App;
