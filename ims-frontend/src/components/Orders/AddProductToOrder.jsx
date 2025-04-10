import { useEffect, useState } from 'react';
import inventoryStyles from '../InventoryConsole/InventoryConsole.module.css'
import APIService from '../../services/APIService';
import { Autocomplete, Button, TextField } from '@mui/material';
import styles from './Orders.module.css'


const AddProductToOrder = ({addProductToOrder, currentItems}) => {
    const [productList,setProductList] = useState([])
    const [selectedProduct,setSelectedProduct] = useState()
    const [quantity, setQuantity] = useState()

    useEffect(()=>{
        APIService().fetchProducts().then((res) => {
            if(res?.success){
                setProductList(res?.products.filter((product)=>!currentItems.some((item) => item.product_id === product.id) ))
            }
        }).catch((Err)=>console.log(Err))
    },[])

    const addProduct = () => {
        const product = {product_name: selectedProduct?.name,product_id: selectedProduct?.id, quantity: quantity, price : parseInt(selectedProduct.price)}
        addProductToOrder(product)
    }
    return (
        
            <div className={inventoryStyles.modal_content} onClick={(e)=>e.stopPropagation()}>
                {/* Product Fields with Autocomplete in a row */}
                <div className={styles.modal_item}>                
                        <div className={styles.product_row}>
                            <Autocomplete
                                options={productList}
                                getOptionLabel={(option) => option.name} // Show product name in the autocomplete
                                value={selectedProduct}
                                onChange={(e, newValue) => setSelectedProduct(newValue)}
                                renderInput={(params) => <TextField {...params} label="Select Product" />}
                                className={styles.product_input}
                            />
                            <TextField
                                variant="outlined"
                                label="Quantity"
                                type="number"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                                className={styles.product_input}
                            />
                            <Button
                                variant="outlined"
                                onClick={addProduct}
                                disabled={!selectedProduct || !quantity}
                                className={styles.add_order_button}
                            >
                                Add Product
                            </Button>
                        </div>
                </div>
            </div>

    )
}

export default AddProductToOrder;