import { TextField, Button, Select, MenuItem, InputLabel, Autocomplete } from '@mui/material';
import styles from './InventoryConsole.module.css';
import { useEffect, useState } from 'react';
import APIService from '../../services/APIService';

const AddProductModal = ({ type }) => {
    const productAttributes = [
        { id: 'name', value: 'Product Name' },
        { id: 'description', value: 'Description' },
        { id: 'price', value: 'Price per unit' },
        { id: 'total_qty', value: 'Total in hand quantity' }
    ];
    const [captureProduct, setCaptureProduct] = useState({
        name: '', description: '', price: '', total_qty: '', category: ''
    });
    const [category, setCategory] = useState('');
    const [showMsg, setShowMsg] = useState('');
    const [categoryList, setCategoryList] = useState([]);

    const addProductData = (key, value) => {
        setShowMsg('');
        setCaptureProduct(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const fetchCategories = () => {
        APIService().fetchCategories().then((data) => {
            if (data?.success) {
                setCategoryList((prev) => data?.categories);
            }
        }).catch((err) => console.log(err));
    };

    useEffect(() => {
        if (type === 'product') {
            fetchCategories();
        }
        console.log(captureProduct)
    }, [type, captureProduct]);

    const saveProduct = () => {
        if (Object.values(captureProduct).some(value => (value === '' || value === null))) {
            setShowMsg('Please fill in all the details');
            return;
        }
        APIService().saveProduct(captureProduct).then((data) => {
            if (data?.success) {
                setShowMsg('Product added successfully');
                setCaptureProduct({
                    name: '', description: '', price: '', total_qty: '', category: ''
                });                
            }
            else{
                setShowMsg('Product with the name already exists!!!');
            }
            setTimeout(() => {
                setShowMsg('');                    
            }, 2000);
        }).catch((err) => console.log(err));
    };

    const saveCategory = () => {
        if (category === '') {
            setShowMsg('Please fill in all the details');
            setTimeout(() => {
                setShowMsg('');
            }, 1000);
            return;
        }
        APIService().saveCategory(category).then((data) => {
            if (data.success) {
                setShowMsg('Category added successfully');
                setTimeout(() => {
                    setShowMsg('');
                    setCategory('');
                }, 1000);
            } else {
                setShowMsg('Category already exists!');
                setTimeout(() => {
                    setShowMsg('');
                }, 1000);
            }
        }).catch((err) => {
            console.log(err);
        });
    };

    
    const renderProductForm = () => (
        <>
          
            <div className={styles.modal_item} key="category">
                <div className={styles.modal_item_label}>
                    Category
                </div>
                <div className={styles.modal_item_input}>
                <Autocomplete
                    value = {captureProduct.category}
                    onChange={(e,value)=>{
                        addProductData('category',value)
                    }}
                    disablePortal
                    options={categoryList}
                    sx={{ width: "100%" }}
                    renderInput={(params) => <TextField {...params} label="Select Category" />}
                    />
                </div>
            </div>

            {productAttributes.map((item) => (
                <div className={styles.modal_item} key={item.id}>
                    <div className={styles.modal_item_label}>
                        {item.value}
                    </div>
                    <div className={styles.modal_item_input}>
                        <TextField
                            fullWidth='100%'
                            variant='outlined'
                            type={item.id === "price" || item.id === "total_qty" ? "number" : "text"}
                            onChange={(e) => addProductData(item.id, e.target.value)}
                            value={captureProduct[item.id]}
                        />
                    </div>
                </div>
            ))}
            <Button variant='contained' onClick={saveProduct}>Save</Button>
        </>
    );

    const renderCategoryForm = () => (
        <>
            <div className={styles.modal_item} key='category'>
                <div className={styles.modal_item_label}>
                    Category
                </div>
                <div className={styles.modal_item_input}>
                    <TextField
                        variant='outlined'
                        type="text"
                        onChange={(e) => setCategory(e.target.value)}
                        value={category}
                    />
                </div>
            </div>
            <Button variant='contained' onClick={saveCategory}>Save</Button>
        </>
    );

    return (
        <div className={styles.modal_content} onClick={(e) => e.stopPropagation()}>
            {showMsg && <div className={styles.message}>{showMsg}</div>}
            {type === 'product' ? renderProductForm() : renderCategoryForm()}
        </div>
    );
};

export default AddProductModal;
