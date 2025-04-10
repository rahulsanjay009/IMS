from .models import Product, Category, Customer, OrderItem , Order
from django.http import JsonResponse
from django.db import IntegrityError, transaction
from django.db.models import Sum
from rest_framework.decorators import api_view
from .helper import normalize, get_products_with_available_quantity, generate_order_number
import json
import uuid
from datetime import datetime
from django.shortcuts import get_object_or_404

@api_view(['POST'])
def add_category(request):
    try:
        data = json.loads(request.body)
        name = data.get('name',None)
        category = Category( name = name)
        category.save()
        return JsonResponse({"success":True,'message':'Category added successfully'},status=201)
    except Exception as e:
        return JsonResponse({"success":False,'error':str(e)},status=200)
@api_view(['POST'])
def add_product(request):
    try:
        # Get data from the request (form data from POST)
        data = json.loads(request.body)
        print(data)
        name = data.get('name', None)
        description = data.get('description', None)
        price = data.get('price', None)
        total_qty = data.get('total_qty', None)
        category_text = data.get('category', None)

        if not name:
            return JsonResponse({"success": False, "message": "Product name is required."}, status=400)

        # Check if a product with the same name already exists (case-insensitive)
        if Product.objects.filter(name__iexact=name).exists():
            return JsonResponse({"success": False, "message": "Product with this name already exists."}, status=409)

        category = Category.objects.filter(name__iexact=category_text).first()

        # Create a new Product instance and save it to the database
        product = Product(
            name=name,
            description=description,
            price=price,
            total_qty=total_qty,
            category=category or None,
            image_url=None
        )
        product.save()

        return JsonResponse({"success": True, 'message': 'Product added successfully!'}, status=201)
    except Exception as e:
        return JsonResponse({"success": False, 'error': str(e)}, status=200)

@api_view(['GET'])
def product_list(request):
    try:
        products = Product.objects.all()
        # Create a list of dictionaries with product data
        product_data = normalize('products',products)
        # Return the list of products as a JSON response
        return JsonResponse({"success":True,'products': product_data}, status=200)
    except Exception as e:
        return JsonResponse({"success":False,'error':str(e)},status = 200)
    

@api_view(['POST'])
def create_category(request):
    try:
        data = json.loads(request.body)
        value = data.get('category',None)
        print(value)
        category = Category(name = value)
        category.save()
        return JsonResponse({"success":True,'message':'Product added successfully!'},status = 201)
    except IntegrityError as e:
        # Check if the error is due to UNIQUE constraint violation
        if 'UNIQUE constraint failed' in str(e):
            return JsonResponse({"success":False, "error": "Category with this name already exists."}, status=200)
        else:
            # Handle any other integrity errors (not related to unique constraint)
            return JsonResponse({"success":False,"error": "An error occurred while creating the category."}, status=200)
    except Exception as e:
        print(e)
        return JsonResponse({"success":False,'error':str(e)},status = 200)

@api_view(['GET']) 
def get_categories(request):
    try:
        result_set = Category.objects.all()
        categories = normalize('categories',result_set)
        return JsonResponse({"success":True,"categories":categories},status = 200)
    except Exception as e:
        return JsonResponse({"success":False,'error':str(e)},status = 200)


@api_view(['POST'])
def add_order(request):
    try:
        data = json.loads(request.body)
        print(data)
        customer_name = data.get("customer_name")
        customer_phone = data.get("customer_phone")
        customer_email = data.get("customer_email")
        from_date = data.get("from_date")
        to_date = data.get("to_date")
        is_paid = data.get("paid").lower() == "true"  # Convert to boolean
        products_data = data.get("products", [])
        is_returned = False
        comments = data.get("comments", None)

        # Step 1: Check if customer exists by phone number
        customer, created = Customer.objects.get_or_create(
            phone=customer_phone,
            defaults={"full_name": customer_name, "email": customer_email}
        )
        
        if created:
            print(f"New customer created: {customer_name} ({customer_phone})")
        else:
            print(f"Existing customer found: {customer_name} ({customer_phone})")
            customer.full_name = customer_name
            customer_email = customer_email
            customer.save()

        # Step 2: Create Order
        try:
            date_from = datetime.strptime(from_date, "%Y-%m-%d %H:%M:%S")
            date_to = datetime.strptime(to_date, "%Y-%m-%d %H:%M:%S")
        except ValueError as e:
            return JsonResponse({"success": False, "error": f"Invalid date format: {str(e)}"}, status=200)
        
        # Generate unique order number (you can also create a custom way of generating order number)
        order_number = generate_order_number(customer_phone, customer_name)
        
        # Start the atomic transaction to ensure atomicity
        with transaction.atomic():
            # Create the order object within the atomic block
            order = Order.objects.create(
                number=order_number,
                date_from=date_from,
                date_to=date_to,
                is_paid=is_paid,
                customer=customer,
                comments=comments,
                is_returned=is_returned
            )
            
            # Step 3: Create OrderItems for each product
            for product_data in products_data:            
                product_id = product_data.get("product_id", None)
                quantity = int(product_data.get("quantity"))            

                # Retrieve the product (assuming the name is unique, if not, you may need another way to identify products)
                try:
                    product = Product.objects.get(id=product_id)
                except Product.DoesNotExist:
                    # Rollback the transaction if product is not found
                    transaction.set_rollback(True)
                    return JsonResponse({"success": False, "error": f"Product '{product_id}' not found."}, status=200)
                
                # Calculate the total ordered quantity for this product in the date range
                overlapping_orders = OrderItem.objects.filter(
                    product=product,
                    order__date_from__lte=date_to,  
                    order__date_to__gte=date_from   
                )

                # Calculate the sum of ordered quantities for overlapping orders
                ordered_qty_in_range = overlapping_orders.aggregate(Sum('ordered_qty'))['ordered_qty__sum'] or 0
                
                # Available quantity is the total quantity minus the ordered quantity
                available_qty = product.total_qty - ordered_qty_in_range

                # If the ordered quantity exceeds the available quantity, return an error
                if available_qty < quantity:
                    # Rollback the transaction if there is insufficient stock
                    transaction.set_rollback(True)
                    return JsonResponse({"success": False, "error": f"Not enough stock for product '{product.name}'."}, status=200)

                # Create the OrderItem
                OrderItem.objects.create(
                    order=order,
                    product=product,
                    ordered_qty=quantity
                )

        return JsonResponse({"success": True, "message": "Order has been placed successfully!"}, status=200)

    except Exception as e:
        # Any exception will trigger a rollback and return an error
        return JsonResponse({"success": False, "error": str(e)}, status=200)


@api_view(['GET'])
def get_orders(request):
    try:
        result_set = Order.objects.select_related('customer').all().order_by('-date_from')
        order_list = normalize('orders',result_set)
        return JsonResponse({"success":True,"orders":order_list},status = 200)
    except Exception as e:
        return JsonResponse({"success": False, "error": str(e)}, status=200)
    

@api_view(['POST'])
def check_product_availability(request):
    try:
        data = json.loads(request.body)
        print(data)
        from_date_time = data.get('from',None)
        to_date_time = data.get('to',None)
        if from_date_time is None or to_date_time is None:
            return JsonResponse({"success": False, "error": 'Dates are invalid'}, status=400)
        try:
            date_from = datetime.strptime(from_date_time, "%Y-%m-%d %H:%M:%S")
            date_to = datetime.strptime(to_date_time, "%Y-%m-%d %H:%M:%S")
        except ValueError as e:
            return JsonResponse({"success": False, "error": f"Invalid date format: {str(e)}"}, status=400)
        
        result_data = get_products_with_available_quantity(date_from,date_to)

        return JsonResponse({'success':True, 'availableProducts': result_data},status = 200)
    except Exception as e:
        return JsonResponse({"success": False, "error": str(e)}, status=200)
    

@api_view(['POST'])
def update_order_items(request):
    try:
        data = request.data  # Assumes JSON request
        order_id = data.get("id")
        items_data = data.get("items", [])

        if not order_id:
            return JsonResponse({"success": False, "error": "Order ID is required"}, status=400)

        order = get_object_or_404(Order, id=order_id)
        
        incoming_product_ids = set(item["product_id"] for item in items_data if "product_id" in item)

        # Step 2: Get all current OrderItems for this order
        current_order_items = OrderItem.objects.filter(order=order)

        # Step 3: Delete OrderItems not in the incoming product list
        for order_item in current_order_items:
            if order_item.product.id not in incoming_product_ids:
                order_item.delete()

        for item_data in items_data:
            product_id = item_data.get("product_id")
            quantity = item_data.get("quantity")
            price = item_data.get("price")

            if not product_id or quantity is None or price is None:
                return JsonResponse({
                    "success": False, 
                    "error": "Product ID, quantity, and price are required for each item"
                }, status=400)

            product = get_object_or_404(Product, id=product_id)

            # Update existing item or create new one
            order_item, created = OrderItem.objects.get_or_create(
                order=order,
                product=product,
                defaults={'ordered_qty': quantity}
            )

            if not created:
                order_item.ordered_qty = quantity
                order_item.save()

        return JsonResponse({"success": True, "message": "Order items updated successfully!"}, status=200)

    except Exception as e:
        return JsonResponse({"success": False, "error": str(e)}, status=200)


@api_view(['POST'])
def edit_product(request):
    try:
        data = json.loads(request.body)
        product_id = data.get("id", None)
        name = data.get('name', None)
        description = data.get('description', None)
        price = data.get('price', None)
        total_qty = data.get('total_qty', None)
        category_text = data.get('category', None)

        # Validate required fields
        if not product_id or not name or not price or total_qty is None or not category_text:
            return JsonResponse({"success": False, "error": "Missing required fields"}, status=400)

        # Fetch the product
        product = get_object_or_404(Product, id=product_id)

        # Update the fields
        product.name = name
        product.description = description
        product.price = price
        product.total_qty = total_qty

        # Retrieve the category based on the category name
        try:
            category = Category.objects.get(name__icontains=category_text)
            product.category = category
        except Category.DoesNotExist:
            return JsonResponse({"success": False, "error": "Category not found"}, status=200)

        # Save the updated product
        product.save()

        return JsonResponse({"success": True, "message": "Product updated successfully"}, status=200)
    
    except Exception as e:
        return JsonResponse({"success": False, "error": str(e)}, status=200)


@api_view(['POST'])
def delete_product(request):
    try:
        data = json.loads(request.body)
        product_id = data.get("product_id", None)
        
        # Ensure the product_id is provided
        if not product_id:
            return JsonResponse({"success": False, "error": "Product ID is required"}, status=400)
        
        # Fetch the product and delete it
        product = get_object_or_404(Product, id=product_id)
        product.delete()
        
        return JsonResponse({"success": True, "message": "Product deleted successfully"}, status=200)
    
    except Exception as e:
        return JsonResponse({"success": False, "error": str(e)}, status=500)
