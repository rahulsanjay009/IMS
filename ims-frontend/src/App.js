import './App.css';
import HomePage from './components/HomePage/HomePage';
import InventoryConsole from './components/InventoryConsole/InventoryConsole';
import { HashRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Orders from './components/Orders/Orders';
import ScheduledPickups from './components/ScheduledPickups/ScheduledPickups';
import OldOrders from './components/OldOrders/OldOrders';

function App() {
  return (
    <Router>
      <Routes>
        
        <Route path="/" element={<HomePage />} >
          <Route index element={<Navigate to="/scheduledPickups" />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/inventory" element ={<InventoryConsole/>} />
          <Route path='/scheduledPickups' element = {<ScheduledPickups/>}/>
          <Route path='/oldOrders' element = {<OldOrders/>} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
