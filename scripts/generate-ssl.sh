#!/bin/bash
# SSL Certificate Generation Script for SAB
# Creates self-signed certificates for development/testing
# For production, replace with Let's Encrypt certificates

set -euo pipefail

# Configuration
CERT_DIR="./nginx/ssl"
KEY_FILE="${CERT_DIR}/sab.key"
CERT_FILE="${CERT_DIR}/sab.crt"
PKCS12_FILE="${CERT_DIR}/keystore.p12"
DOMAIN="sab.local"
ORG_NAME="SAB Inc"
COUNTRY="US"
STATE="California"
CITY="San Francisco"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to log messages
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}"
}

log_warn() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

log_error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
}

# Function to create certificate directory
create_cert_dir() {
    log "Creating certificate directory..."
    mkdir -p "$CERT_DIR"
    chmod 700 "$CERT_DIR"
}

# Function to generate private key
generate_private_key() {
    log "Generating private key..."
    openssl genrsa -out "$KEY_FILE" 2048
    chmod 600 "$KEY_FILE"
    log "Private key generated: $KEY_FILE"
}

# Function to generate certificate signing request
generate_csr() {
    log "Generating certificate signing request..."
    openssl req -new -key "$KEY_FILE" -out "${CERT_DIR}/sab.csr" -subj "/C=$COUNTRY/ST=$STATE/L=$CITY/O=$ORG_NAME/OU=IT/CN=$DOMAIN"
}

# Function to generate self-signed certificate
generate_certificate() {
    log "Generating self-signed certificate..."
    openssl x509 -req -in "${CERT_DIR}/sab.csr" -signkey "$KEY_FILE" -out "$CERT_FILE" -days 365 -extensions v3_req -extfile <(
        cat <<EOF
[v3_req]
subjectAltName = @alt_names
[alt_names]
DNS.1 = $DOMAIN
DNS.2 = localhost
DNS.3 = *.sab.local
IP.1 = 127.0.0.1
IP.2 = ::1
EOF
    )
    log "Certificate generated: $CERT_FILE"
}

# Function to generate PKCS12 keystore for Java
generate_pkcs12() {
    log "Generating PKCS12 keystore for Java application..."
    local pkcs12_password="${PKCS12_PASSWORD:-changeit}"
    openssl pkcs12 -export -in "$CERT_FILE" -inkey "$KEY_FILE" -out "$PKCS12_FILE" -name "sab" -password pass:"$pkcs12_password"
    chmod 600 "$PKCS12_FILE"
    log "PKCS12 keystore generated: $PKCS12_FILE"
}

# Function to verify certificates
verify_certificates() {
    log "Verifying certificates..."
    
    # Verify certificate
    if openssl x509 -in "$CERT_FILE" -text -noout > /dev/null 2>&1; then
        log "Certificate verification: PASSED"
    else
        log_error "Certificate verification: FAILED"
        return 1
    fi
    
    # Verify PKCS12
    local pkcs12_password="${PKCS12_PASSWORD:-changeit}"
    if openssl pkcs12 -in "$PKCS12_FILE" -info -passin pass:"$pkcs12_password" > /dev/null 2>&1; then
        log "PKCS12 keystore verification: PASSED"
    else
        log_error "PKCS12 keystore verification: FAILED"
        return 1
    fi
}

# Function to display certificate info
display_cert_info() {
    log "Certificate Information:"
    openssl x509 -in "$CERT_FILE" -text -noout | grep -E "(Subject:|Issuer:|Not Before:|Not After:|DNS:)" | sed 's/^/  /'
    
    log_warn "This is a self-signed certificate for development/testing only."
    log_warn "For production, use Let's Encrypt or a proper CA certificate."
}

# Function to cleanup temporary files
cleanup() {
    rm -f "${CERT_DIR}/sab.csr"
    log "Temporary files cleaned up"
}

# Function to check if OpenSSL is available
check_dependencies() {
    if ! command -v openssl &> /dev/null; then
        log_error "OpenSSL is not installed or not in PATH"
        exit 1
    fi
    log "OpenSSL found: $(openssl version)"
}

# Main execution
main() {
    log "=== SSL Certificate Generation Started ==="
    
    # Check dependencies
    check_dependencies
    
    # Create certificate directory
    create_cert_dir
    
    # Generate certificates
    generate_private_key
    generate_csr
    generate_certificate
    generate_pkcs12
    
    # Verify certificates
    if verify_certificates; then
        display_cert_info
        cleanup
        log "=== SSL Certificate Generation Completed Successfully ==="
        log "Files created:"
        log "  Private Key: $KEY_FILE"
        log "  Certificate: $CERT_FILE"
        log "  PKCS12 Keystore: $PKCS12_FILE"
        log ""
        log "To use these certificates:"
        log "1. Copy them to your nginx/ssl directory"
        log "2. Update nginx.conf to point to these files"
        log "3. Restart nginx service"
    else
        log_error "Certificate generation failed"
        exit 1
    fi
}

# Execute main function
main "$@"
