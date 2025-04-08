import { useEffect, useState } from 'react';
import styles from './InventoryConsole.module.css'
import AddIcon from '@mui/icons-material/Add';
import {TableCell, TableContainer, TableHead, TableRow, Paper, Table, TableBody, Button} from '@mui/material';
import APIService from '../../services/APIService';
import SearchFilterAddInventory from './SearchFilterAddInventory';
import AddProductModal from './AddProductModal';

const InventoryConsole = () => {

    const [products, setProducts] = useState([]);
    const [showAddProductModal,setShowAddProductModal] = useState(false)
    const [showAddCategory,setShowAddCategory] = useState(false);
    useEffect(()=>{
        APIService().fetchProducts().then((res) => {
            if(res.success){
                setProducts(res?.products);
            }
        }).catch((err) => console.log(err))
    },[])
    const addProductModal = (value) => {
        setShowAddProductModal(value)
        console.log(showAddProductModal)
    }
    const retrieveAvailability = (fromDate, toDate) => {
        APIService().fetchAvailability(fromDate,toDate).then((res) => {
            if(res?.success){
                const availabilityDict =  res?.availableProducts.reduce((acc, item) => {
                    acc[item.product_id] = item.available_qty;
                    return acc;
                }, {});
                const updatedProducts = products.map(product => {
                    const availableQty = availabilityDict[product.id] || 0;  // Default to 0 if no availability is found
                    return { ...product, available_qty: availableQty };
                });
                setProducts(updatedProducts)           
            }
            console.log(res)
        }).catch((err) => console.log(err))
    }
    return (
        <div className=''>
            <SearchFilterAddInventory addProductModal={addProductModal} retrieveAvailability={retrieveAvailability}/>
            
            {showAddProductModal && (
            <div className={styles.modal} onClick={() => setShowAddProductModal(false)}>
                <AddProductModal type='product'/>
            </div>)}
            
            {showAddCategory && (
            <div className={styles.modal} onClick={() => setShowAddCategory(false)}>
                <AddProductModal type='category'/>
            </div>)}

            <div className={styles.inventory_layout}>            
                <TableContainer component={Paper}>
                    <Table sx={{minWidth: 650}}>                    
                        <TableHead>
                            <TableRow>
                                <TableCell> S.NO </TableCell>
                                <TableCell> Product </TableCell>
                                <TableCell 
                                    className={styles.category_cell}
                                >     
                                    Category 
                                    <Button onClick={() => setShowAddCategory(true)}><AddIcon className={styles.plus_icon}/> </Button>
                                </TableCell>
                                <TableCell> Price per unit </TableCell>
                                <TableCell> Total Qty </TableCell>
                                <TableCell> Available Qty </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {products?.map((item,idx)=>(
                                <TableRow>
                                    <TableCell> {idx + 1} </TableCell>
                                    <TableCell> {item?.name} </TableCell>
                                    <TableCell> {item?.category} </TableCell>
                                    <TableCell> {item?.price} </TableCell>
                                    <TableCell> {item?.total_qty} </TableCell>
                                    <TableCell> { item?.available_qty  || 0} </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </div>
        </div>
    )
}

export default InventoryConsole;