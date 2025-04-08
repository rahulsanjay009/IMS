const APIService = () => {

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
      };
      
      const fetchProducts = async () => {
        const url = 'http://localhost:8000/inventory/products'
        return await makeRequest(url,'GET')
      }

      const saveProduct = async (product) => {
        const url = 'http://localhost:8000/inventory/create_product'
        return await makeRequest(url,'POST',product)
      }

      const saveCategory = async (category) => {
        const url = 'http://localhost:8000/inventory/create_category'
        return await makeRequest(url,'POST',{'category':category})
      }

      const fetchCategories = async () => {
        const url = 'http://localhost:8000/inventory/categories'
        return await makeRequest(url,'GET')
      }

      const saveOrder = async (order) => {
        const url = 'http://localhost:8000/inventory/create_order'
        return await makeRequest(url,'POST',order)
      }

      const fetchOrders = async () => {
        const url = 'http://localhost:8000/inventory/orders'
        return await makeRequest(url,'GET');
      }

      const fetchAvailability = async (from, to ) => {
        const url = 'http://localhost:8000/inventory/check_product_availability'
        console.log({from,to})
        return await makeRequest(url,'POST',{from,to});
      }
      return {
              fetchProducts, 
              saveProduct, 
              saveCategory,
              fetchCategories,
              saveOrder,
              fetchOrders,
              fetchAvailability
            }
}

export default APIService;