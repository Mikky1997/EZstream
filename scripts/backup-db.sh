#!/bin/bash
# MikkyStream Database Backup Script
# Run this periodically to backup your database

# Configuration
DB_PATH="/var/www/mikkystream/data/mikkystream.db"
BACKUP_DIR="/var/www/mikkystream/backups"
MAX_BACKUPS=7  # Keep last 7 backups

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Generate backup filename with timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/mikkystream_$TIMESTAMP.db"

# Check if database exists
if [ ! -f "$DB_PATH" ]; then
    echo "Error: Database not found at $DB_PATH"
    exit 1
fi

# Create backup using SQLite's backup command (safe for live databases)
sqlite3 "$DB_PATH" ".backup '$BACKUP_FILE'"

if [ $? -eq 0 ]; then
    echo "Backup created: $BACKUP_FILE"
    
    # Compress the backup
    gzip "$BACKUP_FILE"
    echo "Compressed: ${BACKUP_FILE}.gz"
    
    # Remove old backups (keep only the last MAX_BACKUPS)
    cd "$BACKUP_DIR"
    ls -t *.gz 2>/dev/null | tail -n +$((MAX_BACKUPS + 1)) | xargs -r rm --
    
    echo "Backup complete! Keeping last $MAX_BACKUPS backups."
else
    echo "Error: Backup failed!"
    exit 1
fi
