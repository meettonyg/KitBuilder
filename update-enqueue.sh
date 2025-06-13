#!/bin/bash

# This script updates the plugin's enqueuing to use the new modular structure
# after the architectural refactoring.

# Update enqueue script to point to the new files
function update_enqueue() {
  # Update the script enqueue
  wp_enqueue_script( 'media-kit-builder', 
                    plugin_dir_url( __FILE__ ) . 'dist/media-kit-builder.js', 
                    array('jquery'), 
                    MEDIA_KIT_BUILDER_VERSION, 
                    true );
  
  # Update the style enqueue
  wp_enqueue_style( 'media-kit-builder', 
                   plugin_dir_url( __FILE__ ) . 'dist/media-kit-builder.css', 
                   array(), 
                   MEDIA_KIT_BUILDER_VERSION );
}

# Reminder to run npm install and build
echo "Please run the following commands to install dependencies and build the project:"
echo "cd /path/to/media-kit-builder"
echo "npm install"
echo "npm run build"
