#!/bin/sh

# MySQL Backup Script for MoneyMoni
# Runs daily at 3:00 AM JST, keeps 7 generations

BACKUP_DIR="/db_backups"
DATE=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/family_budget_$DATE.sql"
LOG_FILE="$BACKUP_DIR/backup.log"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Log start
echo "$(date '+%Y-%m-%d %H:%M:%S') - Starting backup..." >> "$LOG_FILE"

# Create backup
mysqldump -h "$MYSQL_HOST" -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" \
    --single-transaction \
    --routines \
    --triggers \
    --events \
    --add-drop-database \
    --databases "$MYSQL_DATABASE" > "$BACKUP_FILE"

# Check if backup was successful
if [ $? -eq 0 ]; then
    echo "$(date '+%Y-%m-%d %H:%M:%S') - Backup successful: $BACKUP_FILE" >> "$LOG_FILE"
    
    # Compress the backup
    gzip "$BACKUP_FILE"
    BACKUP_FILE="$BACKUP_FILE.gz"
    
    echo "$(date '+%Y-%m-%d %H:%M:%S') - Backup compressed: $BACKUP_FILE" >> "$LOG_FILE"
    
    # Keep only the last 7 backups
    find "$BACKUP_DIR" -name "family_budget_*.sql.gz" -type f -mtime +7 -delete
    
    # Log cleanup
    REMAINING=$(find "$BACKUP_DIR" -name "family_budget_*.sql.gz" -type f | wc -l)
    echo "$(date '+%Y-%m-%d %H:%M:%S') - Cleanup complete. $REMAINING backup files remaining." >> "$LOG_FILE"
    
else
    echo "$(date '+%Y-%m-%d %H:%M:%S') - Backup failed!" >> "$LOG_FILE"
    rm -f "$BACKUP_FILE" 2>/dev/null
    exit 1
fi

# Rotate log file if it gets too large (>1MB)
if [ -f "$LOG_FILE" ] && [ $(stat -c%s "$LOG_FILE" 2>/dev/null || echo 0) -gt 1048576 ]; then
    mv "$LOG_FILE" "$LOG_FILE.old"
    echo "$(date '+%Y-%m-%d %H:%M:%S') - Log rotated" > "$LOG_FILE"
fi

echo "$(date '+%Y-%m-%d %H:%M:%S') - Backup process completed" >> "$LOG_FILE"
