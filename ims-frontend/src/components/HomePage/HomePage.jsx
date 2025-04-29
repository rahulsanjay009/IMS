import { useState } from 'react';
import styles from './HomePage.module.css'
import { Button } from '@mui/material';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

const HomePage = () => {
    const location = useLocation()
    const path = location.pathname
    const paths = {'/':'S','/scheduledPickups':'S','/orders':'O','/oldOrders':'OO','/inventory':'I'}
    const [component,setComponent] = useState(paths[path]);
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
                   Current Orders 
                </Button>
                <Button className = {styles.nav_button}
                    variant={(component == 'OO')?'contained' : 'outlined'}
                    onClick={() => {navigate('/oldOrders'); setComponent('OO')}} 
                    > 
                    Old Orders 
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