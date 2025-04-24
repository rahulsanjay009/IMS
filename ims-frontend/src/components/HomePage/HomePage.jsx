import { useState } from 'react';
import styles from './HomePage.module.css'
import { Button } from '@mui/material';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

const HomePage = () => {
    const location = useLocation();
    const path = ((location.pathname == '/orders')? 'O' : 'I') || ''
    const [component,setComponent] = useState(path);
    const navigate = useNavigate();

    return (
        <div>
            <div>
                <Button className = {styles.nav_button}
                    variant={(component == 'I')?'contained' : 'outlined'}
                    onClick={() => {navigate('/inventory'); setComponent('I')}} 
                    > 
                    Inventory 
                </Button>
                <Button className ={styles.nav_button}
                    variant={(component == 'O')?'contained' : 'outlined'}
                    onClick={() => {navigate('/orders'); setComponent('O')}}
                    > 
                    Orders 
                </Button>
            </div>
            
            <Outlet/>
            
        </div>
    )
}

export default HomePage;