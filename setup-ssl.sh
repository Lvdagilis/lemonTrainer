#!/bin/bash

# Create certs directory if it doesn't exist
mkdir -p certs

# Generate self-signed SSL certificate for local development
openssl req -x509 -newkey rsa:4096 -keyout certs/key.pem -out certs/cert.pem -days 365 -nodes -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"

echo "✅ SSL certificates generated in ./certs/"
echo "Note: You'll need to accept the browser warning for self-signed certificates"
