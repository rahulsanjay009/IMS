import { Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material'
import styles from './Orders.module.css'
import { useEffect, useState } from 'react'
import AddOrder from './AddOrder'
import inventoryStyles from '../InventoryConsole/InventoryConsole.module.css'
import { useNavigate } from 'react-router-dom'
import APIService from '../../services/APIService'

const Orders = () => {
    const [orders, setOrders] = useState([])
    const [showMsg,setShowMsg] = useState('');
    const navigate = useNavigate();
    const fetchOrders = () => {
        APIService().fetchOrders().then((data) => {
            if(data?.success){
                setOrders(data?.orders)
            }
        }).catch((err) => console.log(err))
    }
    useEffect(()=>{
        fetchOrders()
    },[])
    function formatDate(date) {
        const options = { 
            weekday: 'short', 
            year: 'numeric', 
            month: 'short', 
            day: '2-digit', 
            hour: '2-digit', 
            minute: '2-digit', 
            hour12: true 
        };
    
        // Using toLocaleString to format the date
        return new Date(date).toLocaleString('en-US', options);
    }
    const sendOrderEmail = (value = null) => {
        console.log(value)
    }
    return (
        <div className={styles.order_layout}>
            
            <div>
                <Button variant='contained' onClick={() => navigate('/addOrder')}> Add Order</Button>
            </div>
            <TableContainer component={Paper}>
                <Table sx={{ minWidth: 650 }} aria-label="orders table">
                    <TableHead>
                        <TableRow>
                        <TableCell>Order ID</TableCell>
                        <TableCell>Customer Name</TableCell>
                        <TableCell>Customer Phone</TableCell>
                        <TableCell>Send Email</TableCell>
                        <TableCell>Pick up Date</TableCell>
                        <TableCell>Drop off date</TableCell>
                        <TableCell>Payment Status</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {orders.map((order) => (
                        <TableRow key={order?.order_number}>
                            <TableCell>{order?.order_number}</TableCell>
                            <TableCell>{order?.customer_name}</TableCell>
                            <TableCell>{order?.customer_phone}</TableCell>
                            <TableCell><Button onClick={()=>sendOrderEmail(order?.order_number)}>Send Email</Button></TableCell>
                            <TableCell>{formatDate(order.from_date)}</TableCell>
                            <TableCell>{formatDate(order.to_date)}</TableCell>
                            <TableCell>{order.is_paid ? 'Paid' : 'Not Paid'}</TableCell>
                        </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </div>
    )
}

export default Orders