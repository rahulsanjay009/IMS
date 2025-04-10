import { Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField } from '@mui/material'
import styles from './Orders.module.css'
import { useEffect, useState } from 'react'
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import { useNavigate } from 'react-router-dom'
import APIService from '../../services/APIService'
import AddCircleIcon from '@mui/icons-material/AddCircle';
import AddProductToOrder from './AddProductToOrder'
import inventoryStyles from '../InventoryConsole/InventoryConsole.module.css'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';

const Orders = () => {
    const [orders, setOrders] = useState([])
    const [showMsg,setShowMsg] = useState('');
    const [showProductModal, setShowProductModal] = useState(false)
    const [editable,setEditable] = useState([])
    const navigate = useNavigate();
    const [currentOrderIdx, setCurrentOrderIdx] = useState(null);
    const fetchOrders = () => {
        APIService().fetchOrders().then((data) => {
            if(data?.success){
                setOrders(data?.orders)
                const len = data?.orders.length
                setEditable(Array(len).fill(true))
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
    const updateOrder = (idx, product_id, quantity) => {
        console.log(idx,product_id, quantity)
        const updatedOrders = [...orders];
        const orderToUpdate = updatedOrders[idx];
        const itemIndex = orderToUpdate.items.findIndex(item => item.product_id === product_id);

        if (itemIndex !== -1) {
            orderToUpdate.items[itemIndex].quantity = quantity;
            setOrders(updatedOrders); // Update the state with the modified order
        }
    }

    const saveOrderToDB = (idx) => {
        const orderToSave = {
            id:orders[idx]?.order_id,
            items:orders[idx]?.items
        }
        console.log(orderToSave)
        APIService().saveOrderToDB(orderToSave).then((res)=>{
            if(res?.success){
                setEditable((prev)=>{
                    const updated = [...prev]
                    updated[idx] = true
                    return updated;
                })
            }
            console.log("Not Success")
        }).catch((Err) => console.log(Err))
    }

    const addProductToOrder = (product) => {
        if (currentOrderIdx === null) return;
    
        setOrders(prevOrders => {
            const updatedOrders = [...prevOrders];
            const order = updatedOrders[currentOrderIdx];
    
            const existingIndex = order.items.findIndex(item => item.product_id === product.product_id);
    
            if (existingIndex !== -1) {
                // If product exists, increase quantity
                order.items[existingIndex].quantity = product.quantity;
            } else {
                // Otherwise, add new product
                order.items.push({
                    product_id: product.product_id,
                    product_name: product.product_name,
                    quantity: product.quantity,
                    price:product.price
                });
            }
    
            return updatedOrders;
        });
             
        setShowProductModal(false);
        setCurrentOrderIdx(null);
    };
    const removeItemFromOrderAtIdx = (idx, product_id) => {
        console.log(orders[idx],product_id)
        setOrders((prev) => {
            const updatedOrders = [...prev]            
            updatedOrders[idx].items = updatedOrders[idx].items.filter((item) => (item.product_id !== product_id))
            return updatedOrders
        })
    }
    return (
        <div className={styles.order_layout}>
            { showProductModal && (
                <div className={inventoryStyles.modal} onClick={()=>setShowProductModal(false)}>
                    <AddProductToOrder addProductToOrder={addProductToOrder} currentItems = {orders[currentOrderIdx].items}/>
                </div>)}
            <div>
                <Button variant='contained' onClick={() => navigate('/addOrder')}> Add Order</Button>
            </div>
            <TableContainer component={Paper} sx={{ overflowX: "auto" }}>
                <Table sx={{ minWidth: 650 }} aria-label="scrollable table">
                    <TableHead>
                        <TableRow className={styles.text_nowrap}>
                        <TableCell>Order ID</TableCell>
                        <TableCell>Customer Name</TableCell>
                        <TableCell>Customer Phone</TableCell>
                        <TableCell>Send Email</TableCell>
                        <TableCell>Pick up Date</TableCell>
                        <TableCell>Drop off date</TableCell>
                        <TableCell>Payment Status</TableCell>
                        <TableCell>Items Ordered</TableCell>
                        <TableCell> Edit/Save </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {orders.map((order, idx) => (                    
                        <TableRow key={order?.order_number}>
                            <TableCell>{order?.order_number}</TableCell>
                            <TableCell>{order?.customer_name}</TableCell>
                            <TableCell>{order?.customer_phone}</TableCell>
                            <TableCell className={styles.text_nowrap}><Button onClick={()=>sendOrderEmail(order?.order_number)}>Send Email</Button></TableCell>
                            <TableCell className={styles.text_nowrap}>{formatDate(order.from_date)}</TableCell>
                            <TableCell className={styles.text_nowrap}>{formatDate(order.to_date)}</TableCell>
                            <TableCell>
                                {order.is_paid ? 'Paid' : 'Not Paid'} 
                                <TextField value={order?.comments} disabled={editable[idx]} sx={{width:'200px'}} />
                            </TableCell>
                            <TableCell>
                                {
                                order?.items.length > 0 && (
                                    <TableContainer>
                                        <Table>                                                
                                            <TableBody>
                                                <TableRow>
                                                {order.items.map((item)=>(
                                                    <TableCell className={styles.text_nowrap}>
                                                        {item.product_name} 
                                                        <div className={styles.order_item}>
                                                            <input 
                                                                type='number' 
                                                                value={item.quantity} 
                                                                disabled={editable[idx]} 
                                                                style={{width:'30px'}}
                                                                onChange={(e)=>{updateOrder(idx, item?.product_id, parseInt(e.target.value))}}/>
                                                                {!editable[idx] && <Button className={styles.delete_icon} disableRipple sx={{all:'unset'}} onClick={()=>removeItemFromOrderAtIdx(idx,item.product_id)}><DeleteOutlineIcon /></Button>}
                                                        </div>                                                                
                                                    </TableCell>
                                                ))}
                                                </TableRow>
                                            </TableBody>                                                                
                                        </Table>
                                    </TableContainer>
                                )
                                }
                            </TableCell>        
                            <TableCell className={styles.edit_save}>  
                                <Button disableRipple sx={{all:'unset'}} onClick={()=>{setEditable((prev)=>{ const updated = [...prev]; updated[idx] = false; return updated})}}><EditIcon className={styles.edit_icon}/></Button>
                                <Button disableRipple sx={{all:'unset'}} onClick={()=> {setCurrentOrderIdx(idx); setShowProductModal(true)}}><AddCircleIcon className={styles.add_icon}/></Button>
                                <Button disableRipple sx={{all:'unset'}} onClick={()=>{saveOrderToDB(idx)}}><SaveIcon className={styles.save_icon}/></Button>
                                <Button disableRipple sx={{all:'unset'}} onClick={()=>{setEditable((prev)=>{ const updated = [...prev]; updated[idx] = true; return updated})}}><CancelIcon className={styles.cancel_icon}/></Button>                                
                            </TableCell>                       
                        </TableRow>                            
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </div>
    )
}

export default Orders