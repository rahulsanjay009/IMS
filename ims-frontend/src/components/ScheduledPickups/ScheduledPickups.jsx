import { useEffect, useState } from "react";
import APIService from "../../services/APIService";
import { Box, Card, CardContent, Divider, Grid, Typography } from "@mui/material";

const ScheduledPickups = () => {
    const [orders,setOrders] = useState([])
    const formatSummaryDate = (dateString) => {
        const normalizedString = dateString.replace(/Z$/, ''); // strip trailing 'Z' if present
        const localDate = new Date(normalizedString);
        return localDate.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: '2-digit'
        });
      };
    useEffect(()=>{
        APIService().fetchOrders(1).then((res)=>{
            if(res?.success)
                setOrders(res?.orders);
            else
                console.log("error")
        })
    },[])
    return (<Box mt={4} marginLeft={1.5}>
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
            <Card key={pickupDate} sx={{ mb: 3, boxShadow: 3 }} >
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
    
)
}

export default ScheduledPickups