import { TextField, Button } from "@mui/material";
import styles from './InventoryConsole.module.css'
import { DateTimePicker, LocalizationProvider  } from "@mui/x-date-pickers";
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { useEffect, useState } from "react";
import dayjs from'dayjs'

const SearchFilterAddInventory = ({addProductModal, retrieveAvailability}) => {

    const captureSearch = (text) => {
        console.log(text)
    }
    const [showMsg,setShowMsg] = useState('')
    const [fromDate,setFromDate] = useState(null)
    const [toDate,setToDate] = useState(null)
    


    const fetchAvailability = () => {
        if(fromDate == null || toDate == null || fromDate > toDate){
            setShowMsg('please select valid dates')
            setTimeout(()=>{
                setShowMsg('')
            },2000 )
            return;
        }
        retrieveAvailability(fromDate?.format('YYYY-MM-DD HH:mm:ss'), toDate?.format('YYYY-MM-DD HH:mm:ss'))
    }
    return (
        <div className={styles.search_filter_layout}>
            {showMsg}
            <div>
            <TextField id='search' onChange={(e) => captureSearch(e.target.value)}/>            
            <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DateTimePicker label='Available From' value={fromDate} onChange={(value) => setFromDate(value)}/>
                <DateTimePicker label = 'Available To' value={toDate} onChange={(value) => setToDate(value)}/>
            </LocalizationProvider>
            <Button variant="contained" onClick={()=>fetchAvailability()}> Check Availability </Button>
            <Button variant="contained" onClick={()=>addProductModal(true)}> Add Product </Button>
            </div>
        </div>
    );
}

export default SearchFilterAddInventory;