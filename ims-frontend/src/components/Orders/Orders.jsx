import { Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Box } from '@mui/material';
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
  const navigate = useNavigate();

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
    };
    APIService().saveOrderToDB(orderToSave).then((res) => {
      if (res?.success) {
        setEditable((prev) => {
          const updated = [...prev];
          updated[idx] = true;
          return updated;
        });
      } else {
        console.log("Save failed");
      }
    }).catch((err) => console.log(err));
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

  return (
    <div className={styles.order_layout}>
      {showProductModal && (
        <div className={inventoryStyles.modal} onClick={() => setShowProductModal(false)}>
          <AddProductToOrder addProductToOrder={addProductToOrder} currentItems={orders[currentOrderIdx]?.items} />
        </div>
      )}
      <Box mb={3}>
        <Button variant='contained' onClick={() => navigate('/addOrder')} startIcon={<AddCircleIcon />}>Add Order</Button>
      </Box>

      <TableContainer component={Paper} sx={{ overflowX: "auto" }}>
        <Table sx={{ minWidth: 650 }} aria-label="scrollable table">
          <TableHead>
            <TableRow className={styles.text_nowrap}>
              <TableCell>Order ID</TableCell>
              <TableCell>Customer Name</TableCell>
              <TableCell>Customer Phone</TableCell>
              <TableCell>Send Email</TableCell>
              <TableCell>Pick up Date</TableCell>
              <TableCell>Drop off Date</TableCell>
              <TableCell>Payment Status</TableCell>
              <TableCell>Items Ordered</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {orders.map((order, idx) => (
              <TableRow key={order?.order_number}>
                <TableCell>{order?.order_number}</TableCell>
                <TableCell>{order?.customer_name}</TableCell>
                <TableCell>{order?.customer_phone}</TableCell>
                <TableCell><Button onClick={() => console.log(order?.order_number)}>Send Email</Button></TableCell>
                <TableCell>{formatDate(order.from_date)}</TableCell>
                <TableCell>{formatDate(order.to_date)}</TableCell>
                <TableCell>
                  {order.is_paid ? 'Paid' : 'Not Paid'}
                  <TextField
                    value={order?.comments}
                    disabled={editable[idx]}
                    sx={{ width: '200px' }}
                    placeholder="Add comments"
                    variant="outlined"
                    multiline
                    rows={2}
                    margin="dense"
                  />
                </TableCell>
                <TableCell>
                  {order?.items.length > 0 && (
                    <TableContainer>
                      <Table>
                        <TableBody>
                          <TableRow>
                            {order.items.map((item) => (
                              <TableCell key={item.product_id} className={styles.text_nowrap}>
                                {item.product_name}
                                <Box display="flex" gap={1}>
                                  <input
                                    type="number"
                                    value={item.quantity}
                                    disabled={editable[idx]}
                                    style={{ width: '40px', margin: '0 8px' }}
                                    onChange={(e) => updateOrder(idx, item?.product_id, parseInt(e.target.value))}
                                  />
                                  {!editable[idx] && (
                                    <Button                                      
                                      disableRipple
                                      sx={{ all: 'unset', cursor:'pointer' }}
                                      onClick={() => removeItemFromOrderAtIdx(idx, item.product_id)}
                                    >
                                      <DeleteOutlineIcon/>
                                    </Button>
                                  )}
                                </Box>
                              </TableCell>
                            ))}
                          </TableRow>
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
    </div>
  );
};

export default Orders;
