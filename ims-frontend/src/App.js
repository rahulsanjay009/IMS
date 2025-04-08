import './App.css';
import HomePage from './components/HomePage/HomePage';
import InventoryConsole from './components/InventoryConsole/InventoryConsole';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import AddOrder from './components/Orders/AddOrder';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/addOrder" element={<AddOrder />} />
      </Routes>
    </Router>
  );
}

export default App;
