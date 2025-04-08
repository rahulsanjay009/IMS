from .models import Product, Category, Customer, OrderItem , Order
from django.http import JsonResponse
from django.db import IntegrityError
from django.db.models import Sum
from rest_framework.decorators import api_view
from .helper import normalize, get_products_with_available_quantity
import json
import uuid
from datetime import datetime

@api_view(['POST'])
def add_category(request):
    try:
        data = json.loads(request.body)
        name = data.get('name',None)
        category = Category( name = name)
        category.save()
        return JsonResponse({"success":True,'message':'Category added successfully'},status=201)
    except Exception as e:
        return JsonResponse({"success":False,'error':str(e)},status=500)

@api_view(['POST'])
def add_product(request):
    try:
        # Get data from the request (form data from POST)
        data = json.loads(request.body)
        print(data)
        name = data.get('name',None)
        description = data.get('description',None)
        price = data.get('price',None)
        total_qty = data.get('total_qty',None)
        category_text = data.get('category', None)

        category = Category.objects.filter(name__iexact=category_text).first()
        # Create a new Product instance and save it to the database
        product = Product(
            name=name,
            description=description,
            price=price,
            total_qty=total_qty,
            category = category or None,
            image_url = None
        )
        product.save()

        return JsonResponse({"success":False,'message':'Product added successfully!'},status = 201)
    except Exception as e:
        return JsonResponse({"success":False,'error':str(e)},status = 500)

@api_view(['GET'])
def product_list(request):
    try:
        products = Product.objects.all()
        # Create a list of dictionaries with product data
        product_data = normalize('products',products)
        # Return the list of products as a JSON response
        return JsonResponse({"success":True,'products': product_data}, status=200)
    except Exception as e:
        return JsonResponse({"success":False,'error':str(e)},status = 500)
    

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
            return JsonResponse({"success":False,"error": "An error occurred while creating the category."}, status=500)
    except Exception as e:
        print(e)
        return JsonResponse({"success":False,'error':str(e)},status = 500)

@api_view(['GET']) 
def get_categories(request):
    try:
        result_set = Category.objects.all()
        categories = normalize('categories',result_set)
        return JsonResponse({"success":True,"categories":categories},status = 200)
    except Exception as e:
        return JsonResponse({"success":False,'error':str(e)},status = 500)
    

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
        
        print(data)
        # Step 1: Check if customer exists by phone number
        customer, created = Customer.objects.get_or_create(
            phone=customer_phone,
            defaults={"full_name": customer_name, "email": customer_email}
        )
        
        if created:
            print(f"New customer created: {customer_name} ({customer_phone})")
        else:
            print(f"Existing customer found: {customer_name} ({customer_phone})")

        # Step 2: Create Order
        # Parse the dates from the request (ensure correct format)
        try:
            date_from = datetime.strptime(from_date, "%Y-%m-%d %H:%M:%S")
            date_to = datetime.strptime(to_date, "%Y-%m-%d %H:%M:%S")
        except ValueError as e:
            return JsonResponse({"success": False, "error": f"Invalid date format: {str(e)}"}, status=400)
        
        # Generate unique order number (you can also create a custom way of generating order number)
        order_number = uuid.uuid4().int >> 64  # Simple way to generate a large number (you can improve this)
        
        order = Order.objects.create(
            number=order_number,
            date_from=date_from,
            date_to=date_to,
            is_paid=is_paid,
            customer=customer
        )
        
        # Step 3: Create OrderItems for each product
        for product_data in products_data:
            product_name = product_data.get("name")
            quantity = int(product_data.get("quantity"))

            # Retrieve the product (assuming the name is unique, if not, you may need another way to identify products)
            try:
                product = Product.objects.get(name=product_name)
            except Product.DoesNotExist:
                return JsonResponse({"success": False, "error": f"Product '{product_name}' not found."}, status=400)
            
            # Calculate the total ordered quantity for this product in the date range
            overlapping_orders = OrderItem.objects.filter(
                product=product,
                order__date_from__lte=date_to,  # Orders that start before or on the 'to_date'
                order__date_to__gte=date_from   # Orders that end after or on the 'from_date'
            )

            # Calculate the sum of ordered quantities for overlapping orders
            ordered_qty_in_range = overlapping_orders.aggregate(Sum('ordered_qty'))['ordered_qty__sum'] or 0
            
            # Available quantity is the total quantity minus the ordered quantity
            available_qty = product.total_qty - ordered_qty_in_range

            # If the ordered quantity exceeds the available quantity, return an error
            if available_qty < quantity:
                return JsonResponse({"success": False, "error": f"Not enough stock for product '{product_name}'."}, status=400)

            # Create the OrderItem
            OrderItem.objects.create(
                order=order,
                product=product,
                ordered_qty=quantity
            )

        return JsonResponse({"success": True, "message": "Order has been placed successfully!"}, status=200)

    except Exception as e:
        return JsonResponse({"success": False, "error": str(e)}, status=500)


@api_view(['GET'])
def get_orders(request):
    try:
        result_set = Order.objects.select_related('customer').all()
        order_list = normalize('orders',result_set)
        return JsonResponse({"success":True,"orders":order_list},status = 200)
    except Exception as e:
        return JsonResponse({"success": False, "error": str(e)}, status=500)
    

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
        return JsonResponse({"success": False, "error": str(e)}, status=500)