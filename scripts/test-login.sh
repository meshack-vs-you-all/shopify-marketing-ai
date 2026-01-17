#!/bin/bash
echo "Testing login for admin@marketing.ai..."
curl -v -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@marketing.ai", "password":"password123"}'
echo -e "\n"
