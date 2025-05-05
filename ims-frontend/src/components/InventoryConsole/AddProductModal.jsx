import { TextField, Button,  Autocomplete } from '@mui/material';
import styles from './InventoryConsole.module.css';
import { useEffect, useState } from 'react';
import APIService from '../../services/APIService';

const AddProductModal = ({ type, updateMessage, updateShowAddCategory }) => {
    const productAttributes = [
        { id: 'name', value: 'Product Name' },
        { id: 'description', value: 'Description' },
        { id: 'price', value: 'Price per unit' },
        { id: 'total_qty', value: 'Total in hand quantity' }
    ];
    const [image, setImage] = useState(null);
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
        // console.log(captureProduct)
    }, [type, captureProduct]);

    const saveProduct = async () => {
        // Check if any product field is empty
        const requiredFields = ['name', 'description', 'price', 'total_qty', 'category'];
        const hasEmptyFields = requiredFields.some(key => !captureProduct[key]);
    
        if (hasEmptyFields || !image) {
            setShowMsg('Please fill in all the details and upload an image.');
            setTimeout(() => setShowMsg(''), 2000);
            return;
        }
    
        try {
            const uploadResult = await uploadImageToCloudinary(image);
            if (uploadResult.success) {
                const updatedProduct = {
                    ...captureProduct,
                    image_url: uploadResult.url
                };
                const res = await APIService().saveProduct(updatedProduct);
                if (res.success) {
                    updateMessage('Product added successfully');
                    setCaptureProduct({
                        name: '', description: '', price: '', total_qty: '', category: ''
                    });
                    setImage(null);
                    updateShowAddCategory(false);
                } else {
                    setShowMsg('Product with the name already exists!!!');
                }
            } else {
                setShowMsg('Image upload failed');
            }
        } catch (err) {
            console.error(err);
            setShowMsg('An error occurred. Please try again.');
        }
    
        setTimeout(() => setShowMsg(''), 2000);
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

    const uploadImageToCloudinary = async (file) => {
        if (!file) return { success: false };
    
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', 'unsigned_preset'); // Replace with your preset
    
        try {
            const response = await fetch('https://api.cloudinary.com/v1_1/dmm4awbwm/image/upload', {
                method: 'POST',
                body: formData,
            });
    
            const data = await response.json();
            console.log(data)
            if (data.secure_url) {
                return { success: true, url: data.secure_url };
            } else {
                return { success: false };
            }
        } catch (error) {
            console.error('Upload failed:', error);
            return { success: false };
        }
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
            <div className={styles.modal_item} key={"image"}>
                <div className={styles.modal_item_label}>
                    {"Image"}
                </div>
                <div className={styles.modal_item_input}>
                    <TextField
                        fullWidth='100%'
                        variant='outlined'
                        type={"file"}
                        onChange={(e) => setImage(e.target.files[0])}                        
                    />
                </div>
            </div>
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
