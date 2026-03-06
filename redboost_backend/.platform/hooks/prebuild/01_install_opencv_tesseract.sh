#!/bin/bash
# Install OpenCV and Tesseract dependencies
yum install -y opencv opencv-devel tesseract tesseract-devel
# Install Tesseract language data for English and French
yum install -y tesseract-langpack-eng tesseract-langpack-fra