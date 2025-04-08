import React, { useState, useEffect } from 'react';
import { TextField, Button, Autocomplete, Radio, RadioGroup, FormControlLabel, FormControl, Table, TableHead, TableRow, TableContainer, TableCell, TableBody } from '@mui/material';
import styles from './Orders.module.css';
import APIService from '../../services/APIService';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import DeleteIcon from '@mui/icons-material/Delete';
import dayjs from 'dayjs'
import { format } from 'date-fns';

const AddOrder = () => {
    const initialOrderState = {
        customer_name: '',
        customer_phone: '',
        customer_email: '',  // Optional
        products: [],
        from_date: null,
        to_date: null,
        paid: '',
      }
  const [order, setOrder] = useState(initialOrderState);

  const [productList, setProductList] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    // Fetch products from API
    APIService().fetchProducts().then((data) => {
      if (data?.success) {
        setProductList(data?.products);
      }
    }).catch((err) => console.log(err));
  }, []);

  const addOrderData = (key, value) => {
    setOrder((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const addProduct = () => {
    if (selectedProduct && quantity) {
      const newProduct = { name: selectedProduct.name, quantity };
      setOrder((prev) => ({
        ...prev,
        products: [...prev.products, newProduct],
      }));
      setSelectedProduct(null);
      setQuantity('');
    }
  };

  const removeProduct = (index) => {
    const updatedProducts = order.products.filter((_, idx) => idx !== index);
    setOrder((prev) => ({
      ...prev,
      products: updatedProducts,
    }));
  };

  const addOrder = () => {
    // Validate fields (excluding customer_email)
    const requiredFields = ['customer_name', 'customer_phone', 'from_date', 'to_date', 'paid'];
    const missingFields = requiredFields.filter(field => !order[field]);

    if (missingFields.length > 0) {
      setErrorMessage('Please fill in all required fields');
      return;
    }
    // Format dates into strings before submission
    const formattedOrder = {
    ...order,
    from_date: order.from_date ? dayjs(order.from_date).format('YYYY-MM-DD HH:mm:ss') : '',
    to_date: order.to_date ? dayjs(order.to_date).format('YYYY-MM-DD HH:mm:ss') : '',
    };
    console.log(formattedOrder)
    APIService().saveOrder(formattedOrder).then((data) => {
        if(data?.success){
            setErrorMessage('Order Added Successfully');
            setOrder(initialOrderState); // Reset order state
            setSelectedProduct(null);    // Reset selected product
            setQuantity('');             // Reset quantity
        }
        else{
            setErrorMessage('Order Not Added!!!!');
        }
        console.log(data)
        
    }).catch((err)=>console.log(err))
    setTimeout(()=>setErrorMessage(''),3000);
    
  };

  // Form items configuration (customer email is optional)
  const formItems = [
    { label: 'Customer Name', key: 'customer_name', type: 'text' },
    { label: 'Customer Phone', key: 'customer_phone', type: 'text' },
    { label: 'Customer Email', key: 'customer_email', type: 'email' },  // Optional
  ];

  return (
    <div className={styles.add_order_layout} onClick={(e) => e.stopPropagation()}>
     {/* Error message for required fields */}
     {errorMessage && <div className={styles.error_message}>{errorMessage}</div>} <br/>
      {/* Customer Fields */}
      <div className={styles.add_order_item}>
        {formItems.map((item) => (
          <TextField
            key={item.key}
            fullWidth
            variant="outlined"
            label={item.label}
            type={item.type}
            value={order[item.key]}
            className={styles.add_order_textField}
            onChange={(e) => addOrderData(item.key, e.target.value)}
          />
        ))}
      </div>

      

      {/* Product Fields with Autocomplete in a row */}
      <div className={styles.modal_item}>
        <div className={styles.modal_item_label}>Select Product</div>
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

      {/* Product List Table */}
      {order.products.length > 0 && (
        <div className={styles.modal_item}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ padding: '4px 0' }}>
                  <TableCell>Product</TableCell>
                  <TableCell>Quantity</TableCell>
                  <TableCell>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {order.products.map((item, index) => (
                  <TableRow key={index} sx={{ padding: '4px 0' }}>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>
                      <TextField
                        variant="standard"
                        type="number"
                        value={item.quantity}
                        onChange={(e) => {
                          const updatedProducts = [...order.products];
                          updatedProducts[index] = { ...updatedProducts[index], quantity: e.target.value };
                          setOrder({ ...order, products: updatedProducts });
                        }}
                        className={styles.add_order_textField}
                      />
                    </TableCell>
                    <TableCell>
                      <Button onClick={() => removeProduct(index)} className={styles.add_order_button}>
                        <DeleteIcon />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </div>
      )}

      {/* Date Pickers in a row */}
      <div className={styles.modal_item}>
        <div className={styles.date_picker_row}>
          <div className={styles.date_picker_item}>
            <div className={styles.modal_item_label}>Pick Up Date & Time</div>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DateTimePicker
                value={order.from_date}
                onChange={(newValue) => addOrderData('from_date', newValue)}
                className={styles.add_order_textField}
              />
            </LocalizationProvider>
          </div>
          <div className={styles.date_picker_item}>
            <div className={styles.modal_item_label}>Drop Off Date & Time</div>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DateTimePicker
                value={order.to_date}
                onChange={(newValue) => addOrderData('to_date', newValue)}
                className={styles.add_order_textField}
              />
            </LocalizationProvider>
          </div>
        </div>
      </div>

      {/* Paid Field */}
      <div className={styles.modal_item}>
        <div className={styles.modal_item_label}>Paid?</div>
        <FormControl component="fieldset">
          <RadioGroup
            row
            value={order.paid}
            onChange={(e) => addOrderData('paid', e.target.value)}
          >
            <FormControlLabel value="true" control={<Radio />} label="Yes" />
            <FormControlLabel value="false" control={<Radio />} label="No" />
          </RadioGroup>
        </FormControl>
      </div>

      {/* Submit Button */}
      <Button variant="contained" onClick={addOrder} className={styles.add_order_button}>
        Submit Order
      </Button>
    </div>
  );
};

export default AddOrder;
