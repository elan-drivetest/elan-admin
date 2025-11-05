Admin Refund Requests


GET
/v1/admin/refund-requests


Parameters
Cancel
Name	Description
limit
number
(query)
Number of items per page

10
cursor
string
(query)
Cursor for pagination

cursor
direction
string
(query)
Pagination direction


forward
orderBy
string
(query)
Column to order by

created_at
orderDirection
string
(query)
Order direction


desc
search
string
(query)
Search term

search
baseUrl
string
(query)
Base URL for pagination links

http://localhost:8001/v1/rides/<route-name>
status
string
(query)
Filter by refund request status


pending
customer_id
number
(query)
Filter by customer ID

customer_id
booking_id
number
(query)
Filter by booking ID

booking_id
startDate
string($date-time)
(query)
Filter by start date

startDate
endDate
string($date-time)
(query)
Filter by end date

endDate
customerName
string
(query)
Filter by customer name

customerName
Execute
Clear
Responses
Curl

curl -X 'GET' \
  'https://api-dev.elanroadtestrental.ca/v1/admin/refund-requests?limit=10&direction=forward&orderBy=created_at&orderDirection=desc&baseUrl=http%3A%2F%2Flocalhost%3A8001%2Fv1%2Frides%2F%3Croute-name%3E&status=pending' \
  -H 'accept: application/json'
Request URL
https://api-dev.elanroadtestrental.ca/v1/admin/refund-requests?limit=10&direction=forward&orderBy=created_at&orderDirection=desc&baseUrl=http%3A%2F%2Flocalhost%3A8001%2Fv1%2Frides%2F%3Croute-name%3E&status=pending
Server response
Code	Details
200	
Response body
Download
{
  "data": [],
  "meta": {
    "limit": 10,
    "hasNextPage": false,
    "hasPreviousPage": false
  }
}
Response headers
 access-control-allow-credentials: true 
 alt-svc: h3=":443"; ma=2592000 
 content-length: 75 
 content-security-policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://static.elanroadtestrental.ca; img-src 'self' data: https://static.elanroadtestrental.ca; font-src 'self' data:; connect-src 'self' https: wss: ws:; 
 content-type: application/json; charset=utf-8 
 cross-origin-embedder-policy: unsafe-none 
 cross-origin-opener-policy: same-origin 
 cross-origin-resource-policy: same-origin 
 date: Sat,25 Oct 2025 11:19:34 GMT 
 etag: W/"4b-Nn1OnXkQJawHVIn/Zt1iCWGOpZw" 
 origin-agent-cluster: ?1 
 referrer-policy: strict-origin-when-cross-origin 
 strict-transport-security: max-age=31536000; includeSubDomains; preload 
 vary: Origin 
 via: 1.1 Caddy 
 x-content-type-options: nosniff 
 x-dns-prefetch-control: off 
 x-download-options: noopen 
 x-frame-options: DENY 
 x-permitted-cross-domain-policies: none 
 x-xss-protection: 1; mode=block 
Responses
Code	Description	Links
200	
Media type

application/json
Controls Accept header.
Example Value
Schema
[
  {
    "id": 0,
    "booking_id": 1,
    "customer_id": 1,
    "customer_name": "John Doe",
    "customer_email": "john@doe.com",
    "customer_phone_number": "+1234567890",
    "customer_address": "123 Main St",
    "payment_transaction_id": 100,
    "amount": 100,
    "refund_percentage": 100,
    "request_date": "2023-01-01",
    "status": "pending",
    "processed_at": "2023-01-01",
    "stripe_refund_id": "string",
    "refund_reason": "string",
    "metadata": {},
    "admin_notes": "string",
    "created_at": "2025-10-25T11:19:33.143Z",
    "updated_at": "2025-10-25T11:19:33.143Z"
  }
]
No links


GET
/v1/admin/refund-requests/{id}


Parameters
Try it out
Name	Description
id *
number
(path)
id
Responses
Code	Description	Links
200	
Media type

application/json
Controls Accept header.
Example Value
Schema
{
  "id": 0,
  "booking_id": 1,
  "customer_id": 1,
  "customer_name": "John Doe",
  "customer_email": "john@doe.com",
  "customer_phone_number": "+1234567890",
  "customer_address": "123 Main St",
  "payment_transaction_id": 100,
  "amount": 100,
  "refund_percentage": 100,
  "request_date": "2023-01-01",
  "status": "pending",
  "processed_at": "2023-01-01",
  "stripe_refund_id": "string",
  "refund_reason": "string",
  "metadata": {},
  "admin_notes": "string",
  "created_at": "2025-10-25T11:19:51.478Z",
  "updated_at": "2025-10-25T11:19:51.478Z"
}

PATCH
/v1/admin/refund-requests/{id}


Parameters
Try it out
Name	Description
id *
number
(path)
id
Request body

application/json
Example Value
Schema
{
  "status": "approved",
  "refund_percentage": 80,
  "admin_notes": "Approved based on policy guidelines"
}
Responses
Code	Description	Links
200	
Media type

application/json
Controls Accept header.
Example Value
Schema
{
  "id": 0,
  "booking_id": 1,
  "customer_id": 1,
  "customer_name": "John Doe",
  "customer_email": "john@doe.com",
  "customer_phone_number": "+1234567890",
  "customer_address": "123 Main St",
  "payment_transaction_id": 100,
  "amount": 100,
  "refund_percentage": 100,
  "request_date": "2023-01-01",
  "status": "pending",
  "processed_at": "2023-01-01",
  "stripe_refund_id": "string",
  "refund_reason": "string",
  "metadata": {},
  "admin_notes": "string",
  "created_at": "2025-10-25T11:20:01.873Z",
  "updated_at": "2025-10-25T11:20:01.873Z"
}
No links
