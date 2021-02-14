#!/bin/bash
export POSTGRES_USER:$POSTGRES_USER
export POSTGRES_PASSWORD=$POSTGRES_PASSWORD
export POSTGRES_DB:$POSTGRES_DB
export POSTGRES_HOST:$POSTGRES_HOST

export DATABASE_URL='postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:5432/${POSTGRES_DB}'
echo 'postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:5432/${POSTGRES_DB}'
psql -h $POSTGRES_HOST -U $POSTGRES_USER