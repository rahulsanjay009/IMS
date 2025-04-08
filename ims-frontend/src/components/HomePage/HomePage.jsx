import { useState } from 'react';
import InventoryConsole from '../InventoryConsole/InventoryConsole';
import Orders from '../Orders/Orders';
import styles from './HomePage.module.css'
import { Button } from '@mui/material';

const HomePage = () => {
    
    const [component,setComponent] = useState('');
    return (
        <div className='home-layout'>
            <div>
                <Button 
                    variant='contained'
                    onClick={() => setComponent('inventory')} 
                    color={(component == 'inventory')? "success":'primary'}> 
                    Inventory 
                </Button>
                <Button 
                    variant='contained'
                    onClick={() => setComponent('orders')}
                    color={(component == 'orders')? "success":'primary'}> 
                    Orders 
                </Button>
            </div>
            {(component == 'inventory') && <InventoryConsole/>}
            {(component == 'orders') && <Orders/>}
            
        </div>
    )
}

export default HomePage;