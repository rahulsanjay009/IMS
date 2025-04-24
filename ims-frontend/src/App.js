import './App.css';
import HomePage from './components/HomePage/HomePage';
import InventoryConsole from './components/InventoryConsole/InventoryConsole';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Orders from './components/Orders/Orders';

function App() {
  return (
    <Router>
      <Routes>
        
        <Route path="/" element={<HomePage />} >
          <Route path="/orders" element={<Orders />} />
          <Route path="/inventory" element ={<InventoryConsole/>} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
