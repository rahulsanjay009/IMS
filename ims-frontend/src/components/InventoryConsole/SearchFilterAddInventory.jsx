import { TextField, Button, Autocomplete } from "@mui/material";
import styles from './InventoryConsole.module.css'
import { DateTimePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { useEffect, useState } from "react";
import dayjs from 'dayjs'
import APIService from "../../services/APIService";

const SearchFilterAddInventory = ({ addProductModal, retrieveAvailability, filteredProducts }) => {

    const [showMsg, setShowMsg] = useState('')
    const [fromDate, setFromDate] = useState(null)
    const [toDate, setToDate] = useState(null)
    const [products, setProducts] = useState([])
    const [filterProducts, setFilterProducts] = useState([])

    useEffect(() => {
        APIService().fetchProducts().then((res) => {
            if (res?.success)
                setProducts(res.products)
            else
                console.log(res.error)
        }).catch((err) => console.log(err))
    }, [])

    const fetchAvailability = () => {
        if (fromDate == null || toDate == null || fromDate > toDate) {
            setShowMsg('please select valid dates')
            setTimeout(() => {
                setShowMsg('')
            }, 2000)
            return;
        }
        retrieveAvailability(
            fromDate?.format('YYYY-MM-DD HH:mm:ss'),
            toDate?.format('YYYY-MM-DD HH:mm:ss')
        )
    }

    const handleProductChange = (event, newValue) => {
        setFilterProducts(newValue)
        filteredProducts(newValue)
    }

    return (
        <div className={styles.search_filter_layout}>
            {showMsg && <div className={styles.error_msg}>{showMsg}</div>}
            <div style={{display:'flex', alignItems:'center'}}>
                <Autocomplete
                    multiple
                    limitTags={2}
                    id="multiple-limit-tags"
                    options={products}
                    value={filterProducts}
                    getOptionLabel={(option) => option.title || option.name || ""}
                    onChange={handleProductChange}
                    renderInput={(params) => (
                        <TextField {...params} label="Products" placeholder="Favorites" />
                    )}
                    sx={{ width: '500px' }}
                />
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DateTimePicker
                        sx={{ margin: '5px' }}
                        label='Available From'
                        value={fromDate}
                        onChange={(value) => setFromDate(value)}
                    />
                    <DateTimePicker
                        sx={{ margin: '5px' }}
                        label='Available To'
                        value={toDate}
                        onChange={(value) => setToDate(value)}
                    />
                </LocalizationProvider>
                <Button
                    disabled={!fromDate || !toDate}
                    sx={{ margin: '5px' }}
                    variant="contained"
                    onClick={fetchAvailability}
                >
                    Check Availability
                </Button>
                <Button
                    sx={{ margin: '5px' }}
                    variant="contained"
                    onClick={() => addProductModal(true)}
                >
                    Add Product
                </Button>
            </div>
        </div>
    );
}

export default SearchFilterAddInventory;
