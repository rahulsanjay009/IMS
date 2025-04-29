import React, { useState, useEffect } from 'react';
import { TextField, Button, Autocomplete, Radio, RadioGroup, FormControlLabel, FormControl, Table, TableHead, TableRow, TableContainer, TableCell, TableBody, Snackbar } from '@mui/material';
import styles from './Orders.module.css';
import APIService from '../../services/APIService';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import DeleteIcon from '@mui/icons-material/Delete';
import dayjs from 'dayjs'
import { format } from 'date-fns';
import { DatePicker, TimePicker } from '@mui/x-date-pickers';

const AddOrder = ({orderAdded}) => {
  const initialOrderState = {
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    products: [],
    from_date: null,  
    to_date: null,
    from_date_only: null,  
    from_time_only: dayjs().set('hour', 18).set('minute', 0).set('second', 0),
    to_date_only: null,
    to_time_only: dayjs().set('hour', 18).set('minute', 0).set('second', 0),
    paid: '',
    comments: '',
    event_date:null,
    is_delivery_required:null,
    delivery_address:''
  };
  const formItems = [
    { label: 'Customer Name', key: 'customer_name', type: 'text' },
    { label: 'Customer Phone', key: 'customer_phone', type: 'text' },
    // { label: 'Customer Email', key: 'customer_email', type: 'email' },  // Optional
  ];
  const [order, setOrder] = useState(initialOrderState);
  const [productList, setProductList] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loader,setLoader] = useState(false)
  useEffect(() => {
    // Fetch products from API
    APIService().fetchProducts().then((data) => {
      if (data?.success) {
        setProductList(data?.products);
      }
    }).catch((err) => console.log(err))
  }, []);

  // useEffect(()=>{
  //   // console.log(order.from_date , order.to_date)
  // },[order])
  const addOrderData = (key, value) => {
    setOrder((prev) => ({
      ...prev,
      [key]: value,
    }));
  };
  const combineDateTime = (date, time) => {
    if (!date || !time) return null;
    return dayjs(date)
      .hour(dayjs(time).hour())
      .minute(dayjs(time).minute())
      .second(0);
  };
  
  const addProduct = () => {
    if (selectedProduct && quantity) {
      const newProduct = { name: selectedProduct?.name, product_id: selectedProduct?.id, quantity };
      setOrder((prev) => ({
        ...prev,
        products: [...prev.products, newProduct],
      }));
  
      // Remove selected product from dropdown list
      setProductList((prevList) =>
        prevList.filter((product) => product.id !== selectedProduct.id)
      );
  
      setSelectedProduct(null);
      setQuantity('');
    }
  };
  
  const removeProduct = (index) => {
    const removedProduct = order.products[index];
    const updatedProducts = order.products.filter((_, idx) => idx !== index);
  
    setOrder((prev) => ({
      ...prev,
      products: updatedProducts,
    }));
  
    // Add removed product back to the dropdown list
    setProductList((prevList) => [
      ...prevList,
      { id: removedProduct.product_id, name: removedProduct.name },
    ]);
  };
  

  const addOrder = () => {
    // Validate fields (excluding customer_email)
    const requiredFields = ['customer_name','customer_phone', 'from_date', 'to_date', 'paid', 'event_date', 'products'];
    const missingFields = requiredFields.filter(field => !order[field] || order[field]?.length === 0);
    // console.log(missingFields, order.from_date)
    if (missingFields.length > 0) {
      setErrorMessage('Please fill in the required fields: '+JSON.stringify(missingFields));
      return;
    }
    setLoader(true);
    // Format dates into strings before submission
    const formattedOrder = {
      ...order,
      is_delivery_required: order.is_delivery_required == 'true' ? true : false, 
      from_date: order.from_date ? dayjs(order.from_date).format('YYYY-MM-DD HH:mm:ss') : '',
      to_date: order.to_date ? dayjs(order.to_date).format('YYYY-MM-DD HH:mm:ss') : '',
      event_date: order.event_date ? dayjs(order.event_date).format('YYYY-MM-DD') : '',
    };
    
    // console.log(formattedOrder)
    APIService().saveOrder(formattedOrder).then((data) => {
        if(data?.success){
            setErrorMessage('Order Added Successfully');
            setOrder(initialOrderState); // Reset order state
            setSelectedProduct(null);    // Reset selected product
            setQuantity('');             // Reset quantity
            orderAdded();
        }
        else{
            setErrorMessage(data.error);
        }
        
    }).catch((err)=>console.log(err)).finally(()=>setLoader(false))
  };

 
  const handleDateTimeChange = (key, subKey, value) => {
    const dateKey = `${key}_date_only`;
    const timeKey = `${key}_time_only`;
  
    const newState = {
      ...order,
      [subKey === 'date' ? dateKey : timeKey]: value,
    };
  
    if (key === 'event_date' && subKey === 'date' && value) {
      const eventDate = dayjs(value).set('hour', 18).set('minute', 0).set('second', 0);
      const pickupDate = eventDate.subtract(1, 'day');
  
      setOrder({
        ...newState,
        event_date: value,
        from_date_only: pickupDate,
        from_time_only: pickupDate,
        to_date_only: eventDate,
        to_time_only: eventDate,
        from_date: pickupDate,
        to_date: eventDate,
      });
      return;
    }
  
    const updatedOrder = {
      ...newState,
      from_date: combineDateTime(newState.from_date_only, newState.from_time_only),
      to_date: combineDateTime(newState.to_date_only, newState.to_time_only),
    };
  
    setOrder(updatedOrder);
  };
  
  
  
  return (
    <div className={styles.add_order_layout} onClick={(e) => e.stopPropagation()}>
      {/* Customer Fields */}
      {loader && <div className='loader-overlay'> <div className='loader'> </div></div>} 
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

      <Snackbar
              open={errorMessage!==''}
              autoHideDuration={5000}
              onClose={() => setErrorMessage('')}
              message={errorMessage}
              anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            />

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
            <div className={styles.modal_item_label}>Event Date</div>
            <LocalizationProvider dateAdapter={AdapterDayjs}>                            
              <DatePicker sx={{width:'100%'}}
                value={order.event_date}
                onChange={(val) => handleDateTimeChange('event_date', 'date', val)}
              />                                        
            </LocalizationProvider>
          </div>
          <div className={styles.date_picker_item}>
            <div className={styles.modal_item_label}>Pick Up Date & Time</div>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              
              <div className={styles.modal_item_date_wrap}>
                <DatePicker
                  value={order.from_date_only}
                  onChange={(val) => handleDateTimeChange('from', 'date', val)}
                />
                <TimePicker
                  value={order.from_time_only}
                  onChange={(val) => handleDateTimeChange('from', 'time', val)}
                />
              </div>              
            </LocalizationProvider>
          </div>
          <div className={styles.date_picker_item}>
            <div className={styles.modal_item_label}>Drop Off Date & Time</div>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <div className={styles.modal_item_date_wrap}>
                  <DatePicker
                    value={order.to_date_only}
                    onChange={(val) => handleDateTimeChange('to', 'date', val)}
                    className={styles.add_order_textField}
                  />
                  <TimePicker
                    value={order.to_time_only}
                    onChange={(val) => handleDateTimeChange('to', 'time', val)}
                    className={styles.add_order_textField}
                  />
                </div>
              </LocalizationProvider>
          </div>
        </div>
      </div>

      {/*Delivery Field*/}
      <div className={styles.modal_item}>
        <div className={styles.modal_item_label}>Delivery Required?</div>
        <FormControl component="fieldset">
          <RadioGroup
            row
            value={order.is_delivery_required}
            onChange={(e) => addOrderData('is_delivery_required', e.target.value)}
          >
            <FormControlLabel value="true" control={<Radio />} label="Yes" />
            <FormControlLabel value="false" control={<Radio />} label="No" />
          </RadioGroup>                 
        </FormControl>
        {order.is_delivery_required == 'true' && <TextField
            fullWidth
            variant="outlined"
            label="Add Address"
            type="Text"
            value={order["delivery_address"]}
            className={styles.add_order_textField}
            onChange={(e) => addOrderData("delivery_address", e.target.value)}
          />}        
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
      <div className={styles.modal_item}>
        <TextField
            fullWidth
            variant="outlined"
            label="Comments"
            type="Text"
            value={order["comments"]}
            className={styles.add_order_textField}
            onChange={(e) => addOrderData("comments", e.target.value)}
          />
      </div>   
      {/* Submit Button */}
      <Button variant="contained" onClick={addOrder} className={styles.add_order_button}>
        Submit Order
      </Button>
    </div>
  );
};

export default AddOrder;
