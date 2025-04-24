import { useState } from 'react';
import styles from './HomePage.module.css'
import { Button } from '@mui/material';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

const HomePage = () => {

    const [component,setComponent] = useState('S');
    const navigate = useNavigate();

    return (
        <div>
            <div>
                <Button className ={styles.nav_button}
                    variant={(component == 'S')?'contained' : 'outlined'}
                    onClick={() => {navigate('/scheduledPickups'); setComponent('S')}}
                    > 
                    Scheduled Pickups
                </Button>
                <Button className ={styles.nav_button}
                    variant={(component == 'O')?'contained' : 'outlined'}
                    onClick={() => {navigate('/orders'); setComponent('O')}}
                    > 
                    Orders 
                </Button>
                <Button className = {styles.nav_button}
                    variant={(component == 'I')?'contained' : 'outlined'}
                    onClick={() => {navigate('/inventory'); setComponent('I')}} 
                    > 
                    Inventory 
                </Button>


            </div>
            
            <Outlet/>
            
        </div>
    )
}

export default HomePage;