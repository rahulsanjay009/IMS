import { Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Box, Snackbar } from '@mui/material';
import styles from './Orders.module.css';
import { useEffect, useState } from 'react';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import { useNavigate } from 'react-router-dom';
import APIService from '../../services/APIService';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import AddProductToOrder from './AddProductToOrder';
import inventoryStyles from '../InventoryConsole/InventoryConsole.module.css';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';

const Orders = () => {
    const [orders, setOrders] = useState([]);
    const [showProductModal, setShowProductModal] = useState(false);
    const [editable, setEditable] = useState([]);
    const [currentOrderIdx, setCurrentOrderIdx] = useState(null);
    const [errorMsg,setErrorMsg] = useState('')
    const navigate = useNavigate();
    const [sendEmail,setSendEmail] = useState(false)
    const [email,setEmail] = useState('')
    const [flagOrderToEmail, setFlagOrderToEmail] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = () => {
    APIService().fetchOrders().then((data) => {
      if (data?.success) {
        setOrders(data?.orders);
        setEditable(new Array(data?.orders.length).fill(true));
      }
    }).catch((err) => console.log(err));
  };

  const formatDate = (date) => {
    const options = { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: '2-digit', 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: true 
    };
    return new Date(date).toLocaleString('en-US', options);
  };

  const saveOrderToDB = (idx) => {
    const orderToSave = {
      id: orders[idx]?.order_id,
      items: orders[idx]?.items,
      comments: orders[idx]?.comments
    };
    console.log(orderToSave)
    APIService().saveOrderToDB(orderToSave).then((res) => {
      if (res?.success) {
        setEditable((prev) => {
          const updated = [...prev];
          updated[idx] = true;
          return updated;
        });
        setErrorMsg('Updated Order Succesfully!')
      } else {
        setErrorMsg(res?.error)
      }
    }).catch((err) => console.log(err));

  };

  const formatSummaryDate = (date) => {
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: '2-digit'
    };
    return new Date(date).toLocaleDateString('en-US', options);
  };

  const computePivotTotals = () => {
    const totals = {};
    const allProducts = new Set();
  
    orders.forEach(order => {
      const dateKey = formatSummaryDate(order.from_date);
  
      if (!totals[dateKey]) {
        totals[dateKey] = {};
      }
  
      order.items.forEach(item => {
        allProducts.add(item.product_name);
  
        if (!totals[dateKey][item.product_name]) {
          totals[dateKey][item.product_name] = 0;
        }
        totals[dateKey][item.product_name] += item.quantity;
      });
    });
  
    return { totals, productList: Array.from(allProducts) };
  };
  
  
  const addProductToOrder = (product) => {
    if (currentOrderIdx === null) return;
    setOrders((prevOrders) => {
      const updatedOrders = [...prevOrders];
      const order = updatedOrders[currentOrderIdx];
      const existingIndex = order.items.findIndex(item => item.product_id === product.product_id);

      if (existingIndex !== -1) {
        order.items[existingIndex].quantity = product.quantity;
      } else {
        order.items.push({
          product_id: product.product_id,
          product_name: product.product_name,
          quantity: product.quantity,
          price: product.price,
        });
      }
      return updatedOrders;
    });
    handleEditToggle(currentOrderIdx, false)
    setShowProductModal(false);
    setCurrentOrderIdx(null);
  };

  const updateOrder = (idx, product_id, quantity) => {
    const updatedOrders = [...orders];
    const orderToUpdate = updatedOrders[idx];
    const itemIndex = orderToUpdate.items.findIndex(item => item.product_id === product_id);

    if (itemIndex !== -1) {
      orderToUpdate.items[itemIndex].quantity = quantity;
      setOrders(updatedOrders);
    }
  };

  const removeItemFromOrderAtIdx = (idx, product_id) => {
    setOrders((prev) => {
      const updatedOrders = [...prev];
      updatedOrders[idx].items = updatedOrders[idx].items.filter(item => item.product_id !== product_id);
      return updatedOrders;
    });
  };

  const handleEditToggle = (idx, status) => {
    setEditable((prev) => {
      const updated = [...prev];
      updated[idx] = status;
      return updated;
    });
  };

  const updateOrderComments = (idx, comments) => {
    setOrders((prev) => {
        const updatedOrders = [...prev]
        updatedOrders[idx].comments = comments 
        return updatedOrders
    })
  }

  const sendConfirmation = () => {
    if(email === ''||flagOrderToEmail===null)
        return;

    APIService().sendConfirmation(email, flagOrderToEmail).then((res)=>{
        if(res.success){
            setErrorMsg('Order Confirmation sent!!!')
            setSendEmail(false)
        }
        else{
            setErrorMsg(res.error)
        }
    }).catch((err)=>{console.log(err)})
  }

  const formatItemsRowWise = (items, numRows = 3) => {
    const columns = Math.ceil(items.length / numRows);
    const rows = Array.from({ length: numRows }, (_, i) =>
      Array.from({ length: columns }, (_, j) => items[j * numRows + i]).filter(Boolean)
    );
    return rows;
  };
  
  
  
  return (
    <div className={styles.order_layout}>
      {showProductModal && (
        <div className={inventoryStyles.modal} onClick={() => setShowProductModal(false)}>
          <AddProductToOrder addProductToOrder={addProductToOrder} currentItems={orders[currentOrderIdx]?.items} />
        </div>
      )}

    {sendEmail && (
        <div className={inventoryStyles.modal} onClick={() => setSendEmail(false)}>
            <div className={inventoryStyles.modal_content} onClick={(e) => e.stopPropagation()}>
                <TextField type="email" onChange={(e)=>{setEmail(e.target.value)}} />
                <Button onClick={sendConfirmation}>SEND</Button>
            </div>
        </div>
      )}
      <Box mb={3}>
        <Button variant='contained' onClick={() => navigate('/addOrder')} startIcon={<AddCircleIcon />}>Add Order</Button>
      </Box>

      <Snackbar
        open={errorMsg!==''}
        autoHideDuration={5000}
        onClose={() => setErrorMsg('')}
        message={errorMsg}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      />
      <TableContainer component={Paper} sx={{ overflowX: "auto" }}>
        <Table sx={{ minWidth: 650 }} aria-label="scrollable table">
          <TableHead>
            <TableRow className={styles.text_nowrap}>
              <TableCell>Order Details</TableCell>
              <TableCell>Comments</TableCell>
              <TableCell>Items Ordered</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {orders.map((order, idx) => (
              <TableRow key={order?.order_number}>
                <TableCell sx={{ minWidth: 250, maxWidth: 300, width: '25%' }}>
                    <Box display="flex" flexDirection="column" alignItems="flex-start">
                        <Box><strong>Order #:</strong> {order?.order_number}</Box>
                        <Box><strong>Name:</strong> {order?.customer_name}</Box>
                        <Box><strong>Phone:</strong> {order?.customer_phone}</Box>
                        <Box><strong>Pick-up:</strong> {formatDate(order.from_date)}</Box>
                        <Box><strong>Drop-off:</strong> {formatDate(order.to_date)}</Box>
                        <Box><strong>Status:</strong> {order.is_paid ? 'Paid' : 'Not Paid'}</Box>
                        <Button 
                        size="small" 
                        variant="outlined" 
                        sx={{ mt: 1 }} 
                        onClick={() => {
                            setSendEmail(true);
                            setFlagOrderToEmail(order?.order_id);
                        }}
                        >
                        Send Email
                        </Button>
                    </Box>
                    </TableCell>

                <TableCell>
                    <TextField
                    value={order?.comments}
                    disabled={editable[idx]}
                    sx={{ width: '200px' }}
                    placeholder="Add comments"
                    variant="outlined"
                    multiline
                    rows={2}
                    margin="dense"
                    onChange={(e) => updateOrderComments(idx, e.target.value)}
                  />
                </TableCell>                
                <TableCell>
                    {order?.items.length > 0 && (
                        <TableContainer>
                        <Table size="small">
                            <TableBody>
                            {formatItemsRowWise(order.items, 3).map((rowItems, rowIdx) => (
                                <TableRow key={rowIdx}>
                                {rowItems.map((item) => (
                                    <TableCell key={item.product_id} className={styles.text_nowrap}>
                                    <Box fontWeight="bold">{item.product_name}</Box>
                                    <Box display="flex" alignItems="center" gap={1}>
                                        <input
                                        type="number"
                                        value={item.quantity}
                                        disabled={editable[idx]}
                                        style={{ width: '40px' }}
                                        onChange={(e) => updateOrder(idx, item.product_id, parseInt(e.target.value))}
                                        />
                                        {!editable[idx] && (
                                        <Button
                                            disableRipple
                                            sx={{ all: 'unset', cursor: 'pointer' }}
                                            onClick={() => removeItemFromOrderAtIdx(idx, item.product_id)}
                                        >
                                            <DeleteOutlineIcon />
                                        </Button>
                                        )}
                                    </Box>
                                    </TableCell>
                                ))}
                                </TableRow>
                            ))}
                            </TableBody>
                        </Table>
                        </TableContainer>
                    )}
                </TableCell>


                <TableCell>
                  <Box display="flex" gap={1}>
                    <Button
                      variant="contained"
                      disableRipple
                      onClick={() => handleEditToggle(idx, false)}
                      sx={{ backgroundColor: 'orange' }}
                    >
                      <EditIcon />
                    </Button>
                    <Button
                      variant="contained"
                      disableRipple
                      onClick={() => { setCurrentOrderIdx(idx); setShowProductModal(true); }}
                      sx={{ backgroundColor: 'green' }}
                    >
                      <AddCircleIcon />
                    </Button>
                    <Button
                      variant="contained"
                      disableRipple
                      onClick={() => saveOrderToDB(idx)}
                      sx={{ backgroundColor: 'blue' }}
                    >
                      <SaveIcon />
                    </Button>
                    <Button
                      variant="contained"
                      disableRipple
                      onClick={() => handleEditToggle(idx, true)}
                      sx={{ backgroundColor: 'red' }}
                    >
                      <CancelIcon />
                    </Button>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>      
        {/* Pivot Summary Table */}
        <Box mt={2}>
        <h3>Summary: Total Quantity of Products Sold by Date</h3>
        <TableContainer component={Paper}>
            <Table>
            <TableHead>
                <TableRow>
                <TableCell>Date</TableCell>
                {computePivotTotals().productList.map((product) => (
                    <TableCell key={product}>{product}</TableCell>
                ))}
                </TableRow>
            </TableHead>
            <TableBody>
                {Object.entries(computePivotTotals().totals).map(([date, productTotals]) => (
                <TableRow key={date}>
                    <TableCell>{date}</TableCell>
                    {computePivotTotals().productList.map((product) => (
                    <TableCell key={product}>
                        {productTotals[product] || '-'}
                    </TableCell>
                    ))}
                </TableRow>
                ))}
            </TableBody>
            </Table>
        </TableContainer>
        </Box>


    </div>
  );
};

export default Orders;
