#!/bin/sh

# Delete all resources and get fresh copy from dist into the documentation root
rm -rf bower_components
rm -rf fonts
rm -rf images
rm -rf scripts
rm -rf styles
cp -r .public/* .