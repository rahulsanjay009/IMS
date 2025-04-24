const APIService = () => {
    const API_END_POINT = 'https://chinnisanjay2504.pythonanywhere.com'
    // const API_END_POINT = 'http://localhost:8000'
    const makeRequest = async (url, method, body = null) => {
        // Set the headers for the request, assuming JSON data
        const headers = {
          'Content-Type': 'application/json',
        };
      
        const options = {
          method: method.toUpperCase(), 
          headers: headers,
        };
      
        if (body) {
          options.body = JSON.stringify(body);
        }
        try {
          const response = await fetch(url, options);
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          const data = await response.json();
          return data;
        } catch (error) {
          return { success: false, error: error.message };
        }
      }
      const fetchProducts = async () => {
        const url = `${API_END_POINT}/inventory/products`
        return await makeRequest(url,'GET')
      }

      const saveProduct = async (product) => {
        const url = `${API_END_POINT}/inventory/create_product`
        return await makeRequest(url,'POST',product)
      }

      const saveCategory = async (category) => {
        const url = `${API_END_POINT}/inventory/create_category`
        return await makeRequest(url,'POST',{'category':category})
      }

      const fetchCategories = async () => {
        const url = `${API_END_POINT}/inventory/categories`
        return await makeRequest(url,'GET')
      }

      const saveOrder = async (order) => {
        const url = `${API_END_POINT}/inventory/create_order`
        return await makeRequest(url,'POST',order)
      }

      const fetchOrders = async () => {
        const url = `${API_END_POINT}/inventory/orders`
        return await makeRequest(url,'GET');
      }

      const fetchAvailability = async (from, to ) => {
        const url = `${API_END_POINT}/inventory/check_product_availability`
        return await makeRequest(url,'POST',{from,to})
      }

      const saveOrderToDB = async (order) => {
        const url = `${API_END_POINT}/inventory/update_order`
        return await makeRequest(url,'POST',order)
      }

      const editProduct = async (product) => {
        const url = `${API_END_POINT}/inventory/edit_product`
        return await makeRequest(url, 'POST',product)
      }

      const deleteProduct = async (product_id) => {
        const url = `${API_END_POINT}/inventory/delete_product`
        return await makeRequest(url, 'POST',{product_id})
      }
      
      const sendConfirmation = async (email, order_id) => {
        const url = `${API_END_POINT}/inventory/send_order_confirmation`
        return await makeRequest(url, 'POST',{order_id,email})       
      }

      const confirmReturn = async (order_id) => {
        const url = `${API_END_POINT}/inventory/confirm_order_return`
        return await makeRequest(url, 'POST',{order_id})       
      }
      
      const deleteOrder = async (order_id) => {
        const url = `${API_END_POINT}/inventory/erase_order`
        return await makeRequest(url, 'POST',{order_id})       
      }

    return {
            fetchProducts, 
            saveProduct, 
            saveCategory,
            fetchCategories,
            saveOrder,
            fetchOrders,
            fetchAvailability,
            saveOrderToDB,
            editProduct,
            deleteProduct,
            sendConfirmation,
            confirmReturn,
            deleteOrder
          }
    
}

export default APIService;