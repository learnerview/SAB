#!/bin/bash
# PostgreSQL Automated Backup Script for SAB
# Creates hourly backups with retention policy

set -euo pipefail

# Configuration (override via environment variables)
DB_HOST="${DB_HOST:-postgres}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-sab}"
DB_USER="${DB_USER:-sab}"
DB_PASSWORD="${DB_PASSWORD:-}"
BACKUP_DIR="${BACKUP_DIR:-/backups}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/sab_backup_${TIMESTAMP}.sql"
COMPRESSED_FILE="${BACKUP_FILE}.gz"
RETENTION_DAYS=7
LOG_FILE="/backups/backup.log"

# Function to log messages
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Function to cleanup old backups
cleanup_old_backups() {
    log "Cleaning up backups older than ${RETENTION_DAYS} days..."
    find "$BACKUP_DIR" -name "sab_backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete
    log "Cleanup completed"
}

# Function to verify backup
verify_backup() {
    local file="$1"
    if [[ -f "$file" && -s "$file" ]]; then
        local size=$(stat -c%s "$file")
        log "Backup verified: $file (Size: $size bytes)"
        return 0
    else
        log "ERROR: Backup verification failed for $file"
        return 1
    fi
}

# Function to create backup
create_backup() {
    log "Starting backup process..."
    
    # Create backup directory if it doesn't exist
    mkdir -p "$BACKUP_DIR"
    
    # Set PostgreSQL password
    export PGPASSWORD="$DB_PASSWORD"
    
    # Create database backup
    log "Creating backup: $BACKUP_FILE"
    if pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" > "$BACKUP_FILE"; then
        log "Backup created successfully"
        
        # Compress backup
        log "Compressing backup..."
        if gzip "$BACKUP_FILE"; then
            log "Backup compressed successfully: $COMPRESSED_FILE"
            
            # Verify backup
            if verify_backup "$COMPRESSED_FILE"; then
                log "Backup process completed successfully"
                return 0
            else
                log "ERROR: Backup verification failed"
                return 1
            fi
        else
            log "ERROR: Failed to compress backup"
            return 1
        fi
    else
        log "ERROR: Failed to create backup"
        return 1
    fi
}

# Function to backup database schema only
create_schema_backup() {
    local schema_file="${BACKUP_DIR}/sab_schema_${TIMESTAMP}.sql"
    log "Creating schema backup: $schema_file"
    
    export PGPASSWORD="$DB_PASSWORD"
    if pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" --schema-only > "$schema_file"; then
        gzip "$schema_file"
        log "Schema backup completed: ${schema_file}.gz"
    else
        log "ERROR: Failed to create schema backup"
    fi
}

# Function to check database connectivity
check_database() {
    if [[ -z "$DB_PASSWORD" ]]; then
        log "ERROR: DB_PASSWORD environment variable is required"
        return 1
    fi

    export PGPASSWORD="$DB_PASSWORD"
    if pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME"; then
        log "Database connectivity check passed"
        return 0
    else
        log "ERROR: Database connectivity check failed"
        return 1
    fi
}

# Main execution
main() {
    log "=== PostgreSQL Backup Script Started ==="
    
    # Check database connectivity
    if ! check_database; then
        log "ERROR: Cannot connect to database. Exiting."
        exit 1
    fi
    
    # Create main backup
    if create_backup; then
        # Create schema backup (daily)
        if [[ $(date +%H) -eq 00 ]]; then
            create_schema_backup
        fi
        
        # Cleanup old backups
        cleanup_old_backups
        
        log "=== Backup process completed successfully ==="
    else
        log "ERROR: Backup process failed"
        exit 1
    fi
}

# Execute main function
main "$@"
