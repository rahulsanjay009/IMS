import { Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Box, Snackbar, Tooltip, IconButton, Typography, Card, CardContent, Divider, Grid } from '@mui/material';
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
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AddOrder from './AddOrder';

const Orders = () => {
    const [orders, setOrders] = useState([]);
    const [showProductModal, setShowProductModal] = useState(0);
    const [editable, setEditable] = useState([]);
    const [currentOrderIdx, setCurrentOrderIdx] = useState(null);
    const [errorMsg,setErrorMsg] = useState('')        
    const [email,setEmail] = useState('')
    const [flagOrderToEmail, setFlagOrderToEmail] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);
  useEffect(()=>{
    console.log(orders)
  },[orders])
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
    return new Date(date.replace(/Z$/, '')).toLocaleString('en-US', options);
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

  const formatSummaryDate = (dateString) => {
    const normalizedString = dateString.replace(/Z$/, ''); // strip trailing 'Z' if present
    const localDate = new Date(normalizedString);
    return localDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit'
    });
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
    setShowProductModal(0);
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
            setShowProductModal(0)
        }
        else{
            setErrorMsg(res.error)
        }
    }).catch((err)=>{console.log(err)})
  }

  const formatItemsGrid = (items, maxCols = 4) => {
    const rows = [];
    for (let i = 0; i < items.length; i += maxCols) {
      rows.push(items.slice(i, i + maxCols));
    }
    return rows;
  };
  
  
  const deleteOrderFromDB = (order_id) => {
    APIService().deleteOrder(order_id).then((res) => {
        if(res?.success){
            setErrorMsg('Order deleted')
            setOrders(orders.filter((order) => order.order_id !== order_id))        
        }
        else{
            setErrorMsg(res?.error)
        }
    }).catch((err) => console.log(err))
  }
  
  const confirmReturn = (order_id) => {
    APIService().confirmReturn(order_id).then((res) => {
        if(res?.success){
            setErrorMsg('Order confirmed return')
            setOrders(orders.filter((order) => order.order_id !== order_id))        
        }
        else{
            setErrorMsg(res?.error)
        }
    }).catch((err) => console.log(err))
  }
  const orderAdded = () => {
    setShowProductModal(0);
    fetchOrders();
    setErrorMsg('Order Added Succesfully')
    setTimeout(()=>{
        setErrorMsg('')
    },5000)
  }
  const formatSummaryDate1 = (dateString) => {
    const [year, month, day] = dateString.split('-');
    const date = new Date(Number(year), Number(month) - 1, Number(day)); // local time
    const options = { day: '2-digit', month: 'short', year: 'numeric' };
    return date.toLocaleDateString('en-GB', options);
  };
    return (
    <div className={styles.order_layout}>
      {showProductModal == 1 && (
        <div className={inventoryStyles.modal} onClick={() => setShowProductModal(0)}>
          <AddProductToOrder addProductToOrder={addProductToOrder} currentItems={orders[currentOrderIdx]?.items} />
        </div>
      )}
    {showProductModal == 2 && (
        <div className={inventoryStyles.modal} onClick={() => setShowProductModal(0)}>
          <div className={inventoryStyles.modal_content} onClick={(e) => e.stopPropagation()}>
            <AddOrder orderAdded={orderAdded}/>
          </div>
        </div>
      )}
      {showProductModal == 3 && (
        <div className={inventoryStyles.modal} onClick={() => setShowProductModal(0)}>
          <div className={inventoryStyles.modal_content} onClick={(e) => e.stopPropagation()}>
            <TextField type="email" onChange={(e) => setEmail(e.target.value)} />
            <Button onClick={sendConfirmation}>SEND</Button>
          </div>
        </div>
      )}
  
      <Box mb={3}>
        <Button variant="contained" onClick={() => setShowProductModal(2)} startIcon={<AddCircleIcon />}>
          Add Order
        </Button>
      </Box>
  
      <Snackbar
        open={errorMsg !== ''}
        autoHideDuration={5000}
        onClose={() => setErrorMsg('')}
        message={errorMsg}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      />
       
      {
        Object.entries(
          orders.reduce((acc, order) => {
            const dateKey = formatSummaryDate1(order.event_date);
            acc[dateKey] = acc[dateKey] ? [...acc[dateKey], order] : [order];
            return acc;
          }, {})
        ).map(([pickupDate, groupedOrders]) => (
          <Box key={pickupDate} mb={4}>
            <h2 style={{ marginBottom: '16px' }}>{"Events on: "+pickupDate}</h2>
            <TableContainer component={Paper}  sx={{
                    maxHeight: 500, // or whatever fits your layout
                    overflowX: 'auto',
                    '&::-webkit-scrollbar': {
                    height: 6,
                    },
                    '&::-webkit-scrollbar-thumb': {
                    backgroundColor: '#ccc',
                    borderRadius: 3,
                    },
                    '&::-webkit-scrollbar-track': {
                    backgroundColor: '#f0f0f0',
                    },
                }}>
              <Table sx={{ minWidth: 650 }} aria-label="scrollable table">
                <TableHead>
                  <TableRow className={styles.text_nowrap}>
                    <TableCell  sx={{
                                position: 'sticky',
                                left: 0,                                
                                width: '25%',
                                minWidth: 250,
                                maxWidth: 300,                                
                                backgroundColor:'#ffffff', // Matches the row background                                                        
                            }}>Order Details</TableCell>                   
                    <TableCell>Items Ordered</TableCell>
                    <TableCell>Comments</TableCell>
                    <TableCell  > Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {groupedOrders.map((order, idx) => {
                    const globalIdx = orders.findIndex(o => o.order_id === order.order_id);
                    const rowStyle = {
                        backgroundColor: idx % 2 === 0 ? '#f2f2f2' : '#ffffff', // Alternating row colors
                      };
                    return (
                      <TableRow key={order?.order_number}  style={rowStyle}>
                        <TableCell
                            sx={{
                                position: 'sticky',
                                left: 0,
                                zIndex: 3,
                                width: '25%',
                                minWidth: 250,
                                maxWidth: 300,
                                backgroundColor: idx % 2 === 0 ? '#f2f2f2' : '#ffffff', // Matches the row background                                                        
                            }}
                            >
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                <div><strong>Order #:</strong> {order?.order_number}</div>
                                <div><strong>Name:</strong> {order?.customer_name} | <strong>Phone:</strong> {order?.customer_phone}</div>
                                <div><strong>Pick up:</strong> {formatDate(order.from_date)}</div>
                                <div><strong>Drop off:</strong> {formatDate(order.to_date)}</div>
                                <div><strong>Status:</strong> {order.is_paid ? 'Paid' : 'Not Paid'}</div>
                            </div>
                        </TableCell>

                          
  
                        <TableCell>
                            {order?.items.length > 0 && (
                                <TableContainer>
                                <Table size="small">
                                    <TableBody>
                                    {formatItemsGrid(order.items, 4).map((rowItems, rowIdx) => (
                                        <TableRow key={rowIdx}>
                                        {rowItems.map((item) => (
                                            <TableCell key={item.product_id} className={styles.text_nowrap}>
                                            <Box fontWeight="bold">{item.product_name}</Box>
                                            <Box display="flex" alignItems="center" gap={1}>
                                                <input
                                                type="number"
                                                value={item.quantity}
                                                disabled={editable[globalIdx]}
                                                style={{ width: '40px' }}
                                                onChange={(e) =>
                                                    updateOrder(globalIdx, item.product_id, parseInt(e.target.value))
                                                }
                                                />
                                                {!editable[globalIdx] && (
                                                <IconButton
                                                    size="small"
                                                    onClick={() => removeItemFromOrderAtIdx(globalIdx, item.product_id)}
                                                >
                                                    <DeleteOutlineIcon fontSize="small" />
                                                </IconButton>
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
                          <TextField
                            value={order?.comments}
                            disabled={editable[globalIdx]}
                            sx={{ width: '200px', margin:'5px' }}
                            placeholder="Add comments"
                            variant="outlined"
                            multiline
                            rows={2}
                            margin="dense"
                            onChange={(e) => updateOrderComments(globalIdx, e.target.value)}
                          />
                         
                        </TableCell>

                        <TableCell >
                            <Box display="flex" flexDirection="column" gap={1}>
                                {/* Edit group */}
                                <Box display="flex" gap={1}>
                                <Tooltip title="Edit">
                                    <IconButton color="warning" onClick={() => handleEditToggle(globalIdx, false)}>
                                    <EditIcon />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title="Add Product">
                                    <IconButton color="success" onClick={() => { setCurrentOrderIdx(globalIdx); setShowProductModal(1); }}>
                                    <AddCircleIcon />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title="Save">
                                    <IconButton color="primary" onClick={() => saveOrderToDB(globalIdx)}>
                                    <SaveIcon />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title="Cancel">
                                    <IconButton color="error" onClick={() => handleEditToggle(globalIdx, true)}>
                                    <CancelIcon />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title="Confirm Return">
                                    <IconButton color="success" onClick={() => confirmReturn(orders[globalIdx]?.order_id)}>
                                    <CheckCircleIcon />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title="Delete Order">
                                    <IconButton color="warning" onClick={() => deleteOrderFromDB(orders[globalIdx]?.order_id)}>
                                    <DeleteOutlineIcon />
                                    </IconButton>
                                </Tooltip>
                                </Box>

                               

                                {/* Email action */}
                                <Button
                                size="small"
                                variant="outlined"
                                onClick={() => {
                                    setShowProductModal(3);
                                    setFlagOrderToEmail(order.order_id); // `order`, not `order[globalIdx]`
                                }}
                                >
                                Send Email
                                </Button>
                            </Box>
                            </TableCell>

                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
          
        ))
      }

    <Box mt={4}>
        <Typography variant="h5" gutterBottom>
            Scheduled pickups
        </Typography>

        {Object.entries(
            orders.reduce((summary, order) => {
            const pickupDate = formatSummaryDate(order.from_date);
            if (!summary[pickupDate]) {
                summary[pickupDate] = [order];
            } else {
                summary[pickupDate].push(order);
            }
            return summary;
            }, {})
        ).map(([pickupDate, customerSummary]) => {
            const itemTotals = {};
            customerSummary.forEach((order) => {
            order.items.forEach((item) => {
                if (!itemTotals[item.product_name]) {
                itemTotals[item.product_name] = 0;
                }
                itemTotals[item.product_name] += item.quantity;
            });
            });

            return (
            <Card key={pickupDate} sx={{ mb: 3, boxShadow: 3 }}>
                <CardContent>
                <Typography variant="h6" gutterBottom color="primary">
                    {"Pick ups on: " + pickupDate}
                </Typography>

                <Divider sx={{ mb: 2 }} />

                {customerSummary.map((order, idx) => (
                    <Box key={idx} mb={2}>
                    <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                        {order.customer_name.toUpperCase()} | {order.customer_phone}{" "}
                        {order.is_delivery_required && `| ${order.address}`}
                    </Typography>

                    <Grid container spacing={1} mt={0.5}>
                        {order.items.map((item, idx2) => (
                        <Grid item key={idx2}>
                            <Typography variant="body2">
                            {item.product_name}: {item.quantity}
                            </Typography>
                        </Grid>
                        ))}
                    </Grid>
                    </Box>
                ))}

                <Divider sx={{ mt: 2, mb: 1 }} />

                <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
                    Total items to be picked:
                </Typography>
                <Grid container spacing={2} mt={1}>
                    {Object.entries(itemTotals).map(([product, quantity]) => (
                    <Grid item key={product}>
                        <Typography variant="body2">
                        {product}: {quantity}
                        </Typography>
                    </Grid>
                    ))}
                </Grid>
                </CardContent>
            </Card>
            );
        })}
    </Box>




   

</div>
  );
  
};

export default Orders;
