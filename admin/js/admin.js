/**
 * Admin Panel JavaScript
 */

(function($) {
    'use strict';
    
    $(document).ready(function() {
        // Drag & drop upload
        var $uploadZone = $('.ssg-upload-zone');
        
        $uploadZone.on('dragover', function(e) {
            e.preventDefault();
            $(this).addClass('drag-over');
        });
        
        $uploadZone.on('dragleave', function(e) {
            e.preventDefault();
            $(this).removeClass('drag-over');
        });
        
        $uploadZone.on('drop', function(e) {
            e.preventDefault();
            $(this).removeClass('drag-over');
            
            var files = e.originalEvent.dataTransfer.files;
            handleFiles(files);
        });
        
        function handleFiles(files) {
            // Upload işlemi
            console.log('Uploading files:', files);
        }
    });
    
})(jQuery);