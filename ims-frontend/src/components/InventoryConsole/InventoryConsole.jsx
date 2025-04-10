import { useEffect, useState } from 'react';
import styles from './InventoryConsole.module.css'
import AddIcon from '@mui/icons-material/Add';
import {TableCell, TableContainer, TableHead, TableRow, Paper, Table, TableBody, Button, TextField} from '@mui/material';
import APIService from '../../services/APIService';
import SearchFilterAddInventory from './SearchFilterAddInventory';
import AddProductModal from './AddProductModal';

const InventoryConsole = () => {
    const [editingProduct, setEditingProduct] = useState(null);
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

    // Edit product handler
    const handleEditProduct = (product) => {
        setEditingProduct({ ...product }); // Set the current product as the editing state
    };
    
    // Save edited product
    const saveEditedProduct = (updatedProduct) => {
        console.log(updatedProduct)
        APIService().editProduct(updatedProduct).then((res) => {
        if (res.success) {
            console.log(res)
            const updatedProducts = products.map((product) =>
            product.id === updatedProduct.id ? updatedProduct : product
            );
            setProducts(updatedProducts);
            setEditingProduct(null); // Close the edit mode
        } else {
            console.log(res.error);
        }
        }).catch((err) => console.log(err));
    };
    
    // Delete product handler
    const handleDeleteProduct = (productId) => {
        APIService().deleteProduct(productId).then((res) => {
        if (res.success) {
            // Remove the deleted product from the list
            setProducts((prevProducts) => prevProducts.filter((product) => product.id !== productId));
        } else {
            console.log('Failed to delete product');
        }
        }).catch((err) => console.log(err));
    };
  
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
                            {products?.map((item, idx) => (
                                <TableRow key={item.id}>
                                <TableCell> {idx + 1} </TableCell>
                                <TableCell>
                                    {editingProduct?.id === item.id ? (
                                    <TextField
                                        value={editingProduct?.name}
                                        onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                                    />
                                    ) : (
                                    item.name
                                    )}
                                </TableCell>
                                <TableCell>
                                    {editingProduct?.id === item.id ? (
                                    <TextField
                                        value={editingProduct?.category}
                                        onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                                    />
                                    ) : (
                                    item.category
                                    )}
                                </TableCell>
                                <TableCell>
                                    {editingProduct?.id === item.id ? (
                                    <TextField
                                        value={editingProduct?.price}
                                        onChange={(e) => setEditingProduct({ ...editingProduct, price: e.target.value })}
                                    />
                                    ) : (
                                    item.price
                                    )}
                                </TableCell>
                                <TableCell>
                                    {editingProduct?.id === item.id ? (
                                    <TextField
                                        value={editingProduct?.total_qty}
                                        onChange={(e) => setEditingProduct({ ...editingProduct, total_qty: e.target.value })}
                                    />
                                    ) : (
                                    item.total_qty
                                    )}
                                </TableCell>
                                <TableCell>
                                    {
                                        item.available_qty
                                    }
                                </TableCell>
                                <TableCell>
                                    {editingProduct?.id === item.id ? (
                                    <Button onClick={() => saveEditedProduct(editingProduct)}>Save</Button>
                                    ) : (
                                    <Button onClick={() => handleEditProduct(item)}>Edit</Button>
                                    )}
                                    <Button onClick={() => handleDeleteProduct(item.id)}>Delete</Button>
                                </TableCell>
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