import './App.css';
import HomePage from './components/HomePage/HomePage';
import InventoryConsole from './components/InventoryConsole/InventoryConsole';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Orders from './components/Orders/Orders';
import ScheduledPickups from './components/ScheduledPickups/ScheduledPickups';

function App() {
  return (
    <Router>
      <Routes>
        
        <Route path="/" element={<HomePage />} >
          <Route index element={<Navigate to="/scheduledPickups" />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/inventory" element ={<InventoryConsole/>} />
          <Route path='/scheduledPickups' element = {<ScheduledPickups/>}/>
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
