function(instance, context) {
   
    try {
        // Initialize logging state
        instance.data.showLogs = instance.data.showLogs || false;
        
        if (instance.data.showLogs) {
            console.log("Starting plugin initialization");
            console.log("Context:", context);
            console.log("Available keys:", context.keys);
        }

        // Store API key in instance data
        instance.data.apiKey = context.keys ? context.keys['IA auto complete (testing)'] : null;
        
        if (instance.data.showLogs) {
            console.log("API Key status:", instance.data.apiKey ? "Found" : "Not found");
        }

        // Attach update function to instance
        instance.data.update = function(properties) {
            if (instance.data.showLogs) console.log("Update called with properties:", properties);
            if (typeof context.update === 'function') {
                context.update(instance, properties, context);
            }
        };
        
        // Create main container
        const $container = $('<div>')
            .addClass('autocomplete-container')
            .css({
                position: 'relative',
                width: '100%',
                maxWidth: '100%',
                minHeight: '100%',
                height: 'auto',
                fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                borderRadius: '12px',
                transition: 'all 0.3s ease',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
            });

        // Create input wrapper for proper positioning
        const $inputWrapper = $('<div>')
            .css({
                position: 'relative',
                width: '100%',
                display: 'flex',
                alignItems: 'center'
            });

        // Create loading indicator
        const $loadingIndicator = $('<div>')
            .addClass('loading-indicator')
            .html(`
                <div class="loading-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            `)
            .css({
                display: 'none',
                position: 'absolute',
                top: '50%',
                right: '12px',
                transform: 'translateY(-50%)',
                zIndex: 1000,
                pointerEvents: 'none'
            });

        // Create suggestions list with adjusted positioning
        const $suggestionsList = $('<div>')
            .addClass('suggestions-list')
            .css({
                display: 'none',
                position: 'fixed',
                maxHeight: '300px',
                overflowY: 'auto',
                background: '#ffffff',
                border: 'none',
                borderRadius: '12px',
                zIndex: 9999,
                boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                padding: '8px',
                backdropFilter: 'blur(8px)',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                transition: 'all 0.2s ease-in-out'
            });

        // Create input with improved style - now using textarea
        const $input = $('<textarea>')
            .addClass('input-field')
            .attr({
                placeholder: 'Start typing...',
                rows: 1
            })
            .css({
                width: '100%',
                padding: '16px',
                paddingRight: '40px',  // Make room for loading indicator
                fontSize: '16px',
                border: '1px solid #e1e1e1',
                borderRadius: '12px',
                backgroundColor: '#ffffff',
                color: '#2d3436',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                outline: 'none',
                boxSizing: 'border-box',
                resize: 'none',
                overflow: 'hidden',
                minHeight: '56px',
                lineHeight: '1.5'
            });

        // Function to auto-resize textarea
        const autoResize = () => {
            $input[0].style.height = 'auto';
            $input[0].style.height = ($input[0].scrollHeight) + 'px';
        };

        // Function to update container height
        const updateContainerHeight = () => {
            const totalHeight = $input.outerHeight(true) + 
                ($suggestionsList.is(':visible') ? $suggestionsList.outerHeight(true) : 0);
            
            $container.css('height', 'auto');
            instance.canvas.css('height', totalHeight + 20); // Add some padding
            
            if (instance.data.showLogs) {
                console.log("Updated container height:", totalHeight);
            }
        };

        // Function to update suggestions list position
        const updateSuggestionsPosition = () => {
            const inputRect = $input[0].getBoundingClientRect();
            $suggestionsList.css({
                top: `${inputRect.bottom + 8}px`,
                left: `${inputRect.left}px`,
                width: `${inputRect.width}px`
            });
        };

        // Update position on scroll and resize
        $(window).on('scroll resize', updateSuggestionsPosition);
        $input.on('focus', updateSuggestionsPosition);

        // Add auto-resize event listeners
        $input
            .on('input', () => {
                autoResize();
                updateContainerHeight();
            })
            .on('change', () => {
                autoResize();
                updateContainerHeight();
            })
            .on('mouseenter', function() {
                $(this).css({
                    borderColor: '#d1d1d1',
                    backgroundColor: '#ffffff'
                });
            })
            .on('mouseleave', function() {
                if (!$(this).is(':focus')) {
                    $(this).css({
                        borderColor: '#e1e1e1',
                        backgroundColor: '#f8f9fa'
                    });
                }
            })
            .on('focus', () => {
                $(this).css({
                    borderColor: '#007AFF',
                    backgroundColor: '#ffffff',
                    boxShadow: '0 0 0 4px rgba(0,122,255,0.15)'
                });
                autoResize();
                updateContainerHeight();
            })
            .on('blur', function() {
                $(this).css({
                    borderColor: '#e1e1e1',
                    backgroundColor: '#f8f9fa',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                });
                autoResize();
            });

        // Update height when suggestions list visibility changes
        const originalFadeIn = $suggestionsList.fadeIn;
        $suggestionsList.fadeIn = function(duration) {
            originalFadeIn.call(this, duration);
            setTimeout(updateContainerHeight, duration || 0);
            return this;
        };

        const originalHide = $suggestionsList.hide;
        $suggestionsList.hide = function() {
            originalHide.call(this);
            updateContainerHeight();
            return this;
        };

        // Initial height update
        setTimeout(() => {
            autoResize();
            updateContainerHeight();
        }, 0);

        // Style global for responsive and animations
        const responsiveStyle = `
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(-10px); }
                to { opacity: 1; transform: translateY(0); }
            }

            @keyframes shimmer {
                0% { background-position: -1000px 0; }
                100% { background-position: 1000px 0; }
            }

            @keyframes pulse {
                0% { transform: scale(1); opacity: 0.6; }
                50% { transform: scale(1.1); opacity: 1; }
                100% { transform: scale(1); opacity: 0.6; }
            }

            @keyframes typing {
                0% { opacity: 0.3; transform: scale(0.8); }
                50% { opacity: 1; transform: scale(1.1); }
                100% { opacity: 0.3; transform: scale(0.8); }
            }

            @keyframes slideIn {
                from { transform: translateX(-10px); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }

            @keyframes glow {
                0% { box-shadow: 0 0 5px rgba(0,122,255,0.2); }
                50% { box-shadow: 0 0 15px rgba(0,122,255,0.4); }
                100% { box-shadow: 0 0 5px rgba(0,122,255,0.2); }
            }

            .loading-dots {
                display: flex;
                align-items: center;
                gap: 4px;
                margin-left: 8px;
                padding: 4px 8px;
                background: rgba(0,122,255,0.1);
                border-radius: 12px;
                transition: all 0.3s ease;
            }

            .loading-dots span {
                width: 4px;
                height: 4px;
                background: #007AFF;
                border-radius: 50%;
                display: inline-block;
                animation: typing 1.2s infinite;
                box-shadow: 0 0 5px rgba(0,122,255,0.3);
            }

            .suggestion-item {
                position: relative;
                overflow: hidden;
                animation: slideIn 0.3s ease;
                animation-fill-mode: both;
            }

            .suggestion-item:nth-child(1) { animation-delay: 0.1s; }
            .suggestion-item:nth-child(2) { animation-delay: 0.2s; }
            .suggestion-item:nth-child(3) { animation-delay: 0.3s; }
            .suggestion-item:nth-child(4) { animation-delay: 0.4s; }
            .suggestion-item:nth-child(5) { animation-delay: 0.5s; }

            .suggestion-item::after {
                content: '';
                position: absolute;
                top: 0;
                right: 0;
                width: 60px;
                height: 100%;
                background: linear-gradient(to left, 
                    rgba(255,255,255,1) 0%,
                    rgba(255,255,255,0.8) 50%,
                    rgba(255,255,255,0) 100%
                );
                pointer-events: none;
                opacity: 0;
                transition: opacity 0.3s ease;
            }

            .suggestion-item:hover::after {
                opacity: 1;
            }

            .suggestion-item.loading::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: linear-gradient(
                    90deg,
                    rgba(255,255,255, 0) 0%,
                    rgba(0,122,255, 0.15) 50%,
                    rgba(255,255,255, 0) 100%
                );
                animation: shimmer 2s infinite linear;
            }

            .completion-text {
                position: relative;
                display: inline-flex;
                align-items: center;
                padding: 4px 8px;
                border-radius: 6px;
                transition: all 0.3s ease;
                font-weight: 500;
            }

            .suggestion-item:hover .completion-text {
                background: rgba(0,122,255,0.1);
                transform: translateX(8px);
            }

            .suggestion-item:hover .completion-text::after {
                content: '⌘';
                font-size: 12px;
                color: #007AFF;
                opacity: 0;
                margin-left: 8px;
                font-family: -apple-system;
                animation: fadeIn 0.3s ease forwards;
            }

            .suggestion-item.selected .completion-text {
                background: rgba(0,122,255,0.15);
                transform: translateX(8px);
            }

            .autocomplete-container {
                width: 100% !important;
                max-width: 100% !important;
                background: #ffffff;
                padding: 8px;
                margin: 0;
                border-radius: 8px;
                position: relative;
            }

            .input-field {
                width: 100% !important;
                box-sizing: border-box !important;
                background: #ffffff !important;
                padding: 12px !important;
                font-size: 16px !important;
                border: 1px solid #e1e1e1 !important;
                border-radius: 8px !important;
                color: #2d3436 !important;
                transition: border-color 0.2s ease !important;
            }

            .input-field:focus {
                border-color: #007AFF !important;
                outline: none !important;
            }

            .suggestions-list {
                width: 100% !important;
                margin: 4px 0 0 0 !important;
                padding: 4px !important;
                background: #ffffff !important;
                border: 1px solid #e1e1e1 !important;
                border-radius: 8px !important;
            }

            .suggestion-item {
                margin: 2px 0 !important;
                padding: 8px 12px !important;
                border-radius: 6px !important;
                background: #ffffff !important;
                transition: background-color 0.2s ease;
            }

            .suggestion-item:hover {
                background: #f8f9fa !important;
            }

            .suggestion-item.selected {
                background: #f1f7ff !important;
            }

            .completion-text {
                color: #2d3436 !important;
                font-size: 14px !important;
                font-weight: normal !important;
                line-height: 1.4 !important;
                padding: 2px 4px !important;
            }

            @media (max-width: 768px) {
                .autocomplete-container {
                    padding: 6px;
                }

                .input-field {
                    padding: 10px !important;
                }

                .suggestions-list {
                    margin: 4px 0 0 0 !important;
                    padding: 4px !important;
                }

                .suggestion-item {
                    margin: 2px 0 !important;
                    padding: 8px 10px !important;
                }
            }
        `;
        $('<style>').text(responsiveStyle).appendTo('head');

        // Update textarea styles for more subtle borders
        const textareaStyle = `
            .input-field {
                width: 100% !important;
                min-height: 56px !important;
                padding: 16px !important;
                font-size: 16px !important;
                line-height: 1.5 !important;
                border: 1px solid #e1e1e1 !important;
                border-radius: 12px !important;
                background-color: #ffffff !important;
                color: #2d3436 !important;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
                box-shadow: 0 1px 3px rgba(0,0,0,0.05) !important;
                outline: none !important;
                box-sizing: border-box !important;
                resize: none !important;
                overflow: hidden !important;
                font-family: inherit !important;
            }

            .input-field:focus {
                border-color: #007AFF !important;
                background-color: #ffffff !important;
                box-shadow: 0 0 0 2px rgba(0,122,255,0.1) !important;
            }

            .input-field:hover {
                border-color: #d1d1d1 !important;
                box-shadow: 0 2px 5px rgba(0,0,0,0.05) !important;
            }

            .autocomplete-container {
                display: flex !important;
                flex-direction: column !important;
                gap: 8px !important;
            }

            .suggestions-list {
                margin-top: 8px !important;
                max-height: 300px !important;
                overflow-y: auto !important;
                border-radius: 12px !important;
                box-shadow: 0 4px 12px rgba(0,0,0,0.1) !important;
            }
        `;

        $('<style>').text(textareaStyle).appendTo('head');

        // Style for suggestions
        const suggestionStyle = `
            .suggestion-item {
                padding: 12px 16px;
                cursor: pointer;
                display: flex;
                align-items: center;
                margin: 4px 0;
                border-radius: 8px;
                transition: all 0.2s ease;
                background: transparent;
            }
            .suggestion-item:hover {
                background-color: rgba(0, 122, 255, 0.1);
                transform: translateX(4px);
            }
            .suggestion-item .completion-text {
                color: #333;
                font-size: 14px;
                line-height: 1.4;
                transition: all 0.2s ease;
            }
            .suggestion-item:hover .completion-text {
                color: #007AFF;
            }
            .suggestion-item.selected {
                background-color: rgba(0, 122, 255, 0.15);
                transform: translateX(4px);
            }
            .suggestions-list {
                animation: floatIn 0.3s ease-out;
            }
            @keyframes floatIn {
                from {
                    opacity: 0;
                    transform: translateY(-8px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            .suggestions-list::-webkit-scrollbar {
                width: 8px;
            }
            .suggestions-list::-webkit-scrollbar-track {
                background: transparent;
            }
            .suggestions-list::-webkit-scrollbar-thumb {
                background: rgba(0, 0, 0, 0.1);
                border-radius: 4px;
            }
            .suggestions-list::-webkit-scrollbar-thumb:hover {
                background: rgba(0, 0, 0, 0.2);
            }
        `;
        $('<style>').text(suggestionStyle).appendTo('head');

        // Update container structure
        $inputWrapper
            .append($input)
            .append($loadingIndicator)
            .append($suggestionsList);

        $container.append($inputWrapper);

        // Update the styles for better positioning
        const containerStyle = `
            .autocomplete-container {
                position: relative !important;
                width: 100% !important;
                max-width: 100% !important;
                background: #ffffff;
                padding: 8px;
                margin: 0;
                border-radius: 8px;
                z-index: 1;
            }

            .suggestions-list {
                position: absolute !important;
                top: calc(100% + 4px) !important;
                left: 0 !important;
                right: 0 !important;
                width: 100% !important;
                background: #ffffff !important;
                border: 1px solid #e1e1e1 !important;
                border-radius: 12px !important;
                box-shadow: 0 4px 12px rgba(0,0,0,0.1) !important;
                z-index: 9999 !important;
                padding: 8px !important;
                margin: 0 !important;
                overflow-y: auto !important;
            }

            .suggestion-item {
                padding: 8px 12px !important;
                margin: 4px 0 !important;
                cursor: pointer !important;
                border-radius: 8px !important;
                transition: all 0.2s ease !important;
            }

            .suggestion-item:hover {
                background-color: #f8f9fa !important;
            }

            .suggestion-item.selected {
                background-color: #f1f7ff !important;
            }

            .completion-text {
                display: block !important;
                width: 100% !important;
                font-size: 14px !important;
                color: #333 !important;
                line-height: 1.4 !important;
            }
        `;

        $('<style>').text(containerStyle).appendTo('head');

        if (instance.data.showLogs) console.log("UI elements created and configured");

        // Store jQuery references in instance.data
        instance.data.$elements = {
            container: $container,
            inputWrapper: $inputWrapper,
            input: $input,
            loadingIndicator: $loadingIndicator,
            suggestionsList: $suggestionsList
        };

        // Add container to Bubble canvas
        instance.canvas.append($container);

        if (instance.data.showLogs) console.log("Container added to Bubble canvas");

        // Initialize states
        instance.publishState('text', '');
        instance.publishState('suggestions', []);
        instance.publishState('selectedSuggestion', '');
        instance.publishState('error', null);
        instance.publishState('totalTokensUsed', 0);

        // Store default properties in instance.data
        instance.data.defaultProperties = {};

        // Initialize previous values tracking system
        instance.data.previousValues = {};

        // Add lock and queue system for suggestions
        instance.data.suggestionLock = false;
        instance.data.suggestionQueue = [];
        instance.data.lastSuggestionTime = 0;
        instance.data.minSuggestionInterval = 300; // ms

        // Function to process suggestion queue
        const processSuggestionQueue = async () => {
            if (instance.data.suggestionLock || instance.data.suggestionQueue.length === 0) {
                return;
            }

            const now = Date.now();
            if (now - instance.data.lastSuggestionTime < instance.data.minSuggestionInterval) {
                setTimeout(processSuggestionQueue, instance.data.minSuggestionInterval);
                return;
            }

            instance.data.suggestionLock = true;
            const nextSuggestion = instance.data.suggestionQueue.shift();

            try {
                instance.data.lastSuggestionTime = Date.now();
            } catch (error) {
                console.error("Error processing suggestion:", error);
                instance.data.hideLoading();
            } finally {
                instance.data.suggestionLock = false;
                if (instance.data.suggestionQueue.length > 0) {
                    processSuggestionQueue();
                }
            }
        };

        // Add input event with debounce
        let debounceTimer;
        $input.on('input', function() {
            const currentValue = $(this).val();
            if (instance.data.showLogs) console.log("Input event triggered with value:", currentValue);
            
            // Show loading indicator immediately
            instance.data.$elements.loadingIndicator.fadeIn(100);
            
            // Clear previous timer
            clearTimeout(debounceTimer);
            
            // Trigger the input event with the current text value
            instance.triggerEvent('inputtext', function() {
                instance.publishState('text', currentValue);
            });
            
            // Set new timer
            debounceTimer = setTimeout(() => {
                if (instance.data.showLogs) console.log("Debounce completed, updating text:", currentValue);
                
                // Publish text state
                instance.publishState('text', currentValue);
                
            }, 300);
        });

        // Add callback system for suggestions
        instance.data.onSuggestionsReceived = null;

        // Keyboard navigation with queue support
        let selectedIndex = -1;
        $input.on('keydown', function(e) {
            const $items = $suggestionsList.find('.suggestion-item');
            const isLoading = instance.data.isProcessing;
            
            switch(e.keyCode) {
                case 9: // Tab
                    e.preventDefault();
                    if (!isLoading) {
                        // Set up callback for when suggestions are received
                        instance.data.onSuggestionsReceived = function(suggestions) {
                            if (suggestions && suggestions.length > 0) {
                                // Simulate click on the first suggestion
                                const firstSuggestion = suggestions[0];
                                const currentText = $input.val();
                                const newText = currentText + (currentText.endsWith(' ') ? '' : ' ') + firstSuggestion;
                                
                                // Update the input value
                                $input.val(newText);
                                
                                // Set cursor position at the end
                                const newCursorPos = newText.length;
                                $input[0].setSelectionRange(newCursorPos, newCursorPos);
                                
                                // Update states
                                instance.publishState('text', newText);
                                instance.publishState('selectedSuggestion', firstSuggestion);
                                
                                // Stop all operations
                                stopAllOperations();
                                
                                // Trigger auto-resize
                                autoResize();
                            }
                            // Reset callback
                            instance.data.onSuggestionsReceived = null;
                        };
                        
                        // Show loading indicator
                        instance.data.$elements.loadingIndicator.fadeIn(200);
                        
                        // Trigger get_suggestion via inputtext event
                        instance.triggerEvent('inputtext', function() {
                            instance.publishState('text', $input.val());
                        });
                    } else {
                        // Show visual feedback that we're loading
                        instance.data.$elements.loadingIndicator.fadeIn(200).fadeOut(200).fadeIn(200);
                    }
                    break;
                case 40: // Down arrow
                    e.preventDefault();
                    if (!isLoading) {
                        selectedIndex = Math.min(selectedIndex + 1, $items.length - 1);
                    }
                    break;
                case 38: // Up arrow
                    e.preventDefault();
                    if (!isLoading) {
                        selectedIndex = Math.max(selectedIndex - 1, -1);
                    }
                    break;
                case 13: // Enter
                    e.preventDefault();
                    if (selectedIndex >= 0 && !isLoading) {
                        $items.eq(selectedIndex).click();
                    }
                    break;
                case 27: // Escape
                    e.preventDefault();
                    $suggestionsList.hide();
                    selectedIndex = -1;
                    break;
            }

            if (!isLoading) {
                $items.removeClass('selected');
                if (selectedIndex >= 0) {
                    $items.eq(selectedIndex).addClass('selected');
                    // Scroll into view if needed
                    const $selected = $items.eq(selectedIndex);
                    const container = $suggestionsList[0];
                    const selectedTop = $selected[0].offsetTop;
                    const selectedHeight = $selected.outerHeight();
                    const containerHeight = $suggestionsList.height();
                    const scrollTop = container.scrollTop;

                    if (selectedTop < scrollTop) {
                        container.scrollTop = selectedTop;
                    } else if (selectedTop + selectedHeight > scrollTop + containerHeight) {
                        container.scrollTop = selectedTop + selectedHeight - containerHeight;
                    }
                }
            }
        });

        // Function to completely stop all operations
        const stopAllOperations = () => {
            // Clear all timers
            if (debounceTimer) {
                clearTimeout(debounceTimer);
            }
            
            // Clear suggestion queue and reset lock
            instance.data.suggestionQueue = [];
            instance.data.suggestionLock = false;
            
            // Hide suggestions and loading
            $suggestionsList.hide();
            instance.data.hideLoading();
            
            // Reset selection
            selectedIndex = -1;
            
            // Clear any pending animations
            $suggestionsList.stop(true, true);
            
            // Update container height
            updateContainerHeight();
        };

        // Document click handler to close suggestions
        $(document).on('mousedown', function(e) {
            const $target = $(e.target);
            const isInput = $target.is($input);
            const isSuggestion = $target.closest('.suggestions-list').length > 0;
            const isLoadingIndicator = $target.closest('.loading-indicator').length > 0;
            
            if (!isInput && !isSuggestion && !isLoadingIndicator) {
                if (instance.data.showLogs) console.log("Click outside container, stopping all operations");
                stopAllOperations();
                $input.blur(); // Remove focus from input
            }
        });

        // Add escape key handler to close suggestions
        $input.on('keydown', function(e) {
            if (e.keyCode === 27) { // Escape key
                e.preventDefault();
                stopAllOperations();
                $(this).blur();
            }
        });

        // Update the suggestions list update logic in the click handler
        $suggestionsList.on('click', '.suggestion-item', function() {
            const completionText = $(this).find('.completion-text').text();
            const $input = instance.data.$elements.input;
            const currentText = $input.val();
            
            if (instance.data.showLogs) console.log("Suggestion clicked:", {
                completionText: completionText,
                currentText: currentText
            });

            // Add selected class temporarily
            $(this).addClass('selected');
            
            // Preserve existing text and add completion
            const newText = currentText + (currentText.endsWith(' ') ? '' : ' ') + completionText;
            
            // Update the input value
            $input.val(newText);
            
            // Set cursor position at the end
            const newCursorPos = newText.length;
            $input[0].setSelectionRange(newCursorPos, newCursorPos);
            
            // Update states
            instance.publishState('text', newText);
            instance.publishState('selectedSuggestion', completionText);
            
            // Stop all operations
            stopAllOperations();
            
            // Trigger auto-resize
            autoResize();
            
            // Reset callback since we've handled the suggestion manually
            instance.data.onSuggestionsReceived = null;
        });

        // Update the input event handler to use the stop function
        $input.on('blur', function() {
            // Small delay to allow click events to process
            setTimeout(() => {
                const isSuggestionClicked = $('.suggestion-item:hover').length > 0;
                if (!isSuggestionClicked) {
                    stopAllOperations();
                }
            }, 200);
        });

        // Modify suggestion handler to add loading effect
        instance.data.showLoading = function() {
            if (!$suggestionsList.is(':visible')) return; // Don't show loading if suggestions are hidden
            instance.data.$elements.container.addClass('loading');
            instance.data.$elements.loadingIndicator.fadeIn(200);
        };

        instance.data.hideLoading = function() {
            instance.data.$elements.container.removeClass('loading');
            instance.data.$elements.loadingIndicator.fadeOut(200);
        };

        // Add loading effect to suggestions
        $suggestionsList.on('mouseenter', '.suggestion-item', function() {
            $(this).addClass('loading');
        }).on('mouseleave', '.suggestion-item', function() {
            $(this).removeClass('loading');
        });

        if (instance.data.showLogs) console.log("Events configured");
        if (instance.data.showLogs) console.log("Auto-completion plugin initialized successfully!");

        // Add loading dots animation style
        const loadingDotsStyle = `
            .loading-dots {
                display: flex;
                align-items: center;
                gap: 3px;
            }

            .loading-dots span {
                width: 4px;
                height: 4px;
                background-color: #007AFF;
                border-radius: 50%;
                display: inline-block;
                animation: bounce 1.4s infinite ease-in-out both;
            }

            .loading-dots span:nth-child(1) {
                animation-delay: -0.32s;
            }

            .loading-dots span:nth-child(2) {
                animation-delay: -0.16s;
            }

            @keyframes bounce {
                0%, 80%, 100% { 
                    transform: scale(0);
                    opacity: 0.3;
                }
                40% { 
                    transform: scale(1);
                    opacity: 1;
                }
            }
        `;

        $('<style>').text(loadingDotsStyle).appendTo('head');
    } catch (error) {
        console.error("Error in initialize:", error);
        instance.publishState('error', error.message);
    }

}; 