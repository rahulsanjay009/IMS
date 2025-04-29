import { useEffect, useState } from "react";
import APIService from "../../services/APIService";
import { Box, IconButton, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField } from "@mui/material";
import styles from '../Orders/Orders.module.css'

const OldOrders = () => {
    const [orders,setOrders] = useState([])
    const [loader,setLoader] = useState(false)
    useEffect(() => {
        setLoader(true)
        APIService().fetchOrders(2).then((res)=>{
            if(res?.success){
                setOrders(res.orders)
            }
            else{
                console.log(res.error)
            }
        }).catch((err) => console.log(err)).finally(()=>{setLoader(false)})
    },[])
    const formatItemsGrid = (items, maxCols = 4) => {
        const rows = [];
        for (let i = 0; i < items.length; i += maxCols) {
          rows.push(items.slice(i, i + maxCols));
        }
        return rows;
      };
      
    const formatSummaryDate1 = (dateString) => {
        const [year, month, day] = dateString.split('-');
        const date = new Date(Number(year), Number(month) - 1, Number(day)); // local time
        const options = { day: '2-digit', month: 'short', year: 'numeric' };
        return date.toLocaleDateString('en-GB', options);
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
    return (
    <>
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
                                                    disabled={true}
                                                    style={{ width: '40px' }}                                         
                                                    />                                                    
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
                                disabled={true}
                                sx={{ width: '200px', margin:'5px' }}
                                placeholder="Add comments"
                                variant="outlined"
                                multiline
                                rows={2}
                                margin="dense"                                
                              />
                             
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
          { loader && <div className='loader-overlay'> <div className='loader'> </div> </div>}
        </>
    )
}

export default OldOrders;