#!/bin/bash
# Install Python 3.9
yum install -y python39 python39-pip

# Upgrade pip
/usr/bin/python3.9 -m pip install --upgrade pip

# Install Python dependencies from requirements.txt
# Copy requirements.txt to a temporary location on the instance
mkdir -p /tmp/redboost
cp /var/app/staging/requirements.txt /tmp/redboost/requirements.txt
cd /tmp/redboost
/usr/bin/python3.9 -m pip install -r requirements.txt

# Install SpaCy French model
/usr/bin/python3.9 -m spacy download fr_core_news_md