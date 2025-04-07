 function(instance, properties, context) {
    // Update property values
    instance.data.defaultProperties = {
        apiKey: properties.apiKey || null,
        model: properties.model || 'gpt-3.5-turbo',
        max_suggestions: properties.max_suggestions || 5,
        min_chars: properties.min_chars || 3,
        suggestionLength: properties.suggestionLength || 150,
        placeholder: properties.placeholder || 'Start typing...',
        showLogs: properties.showLogs || true,
        textprompt: properties.textprompt || ''
    };

    // Update previous values for comparison
    instance.data.previousValues = {
        text: properties.text || '',
        model: instance.data.defaultProperties.model,
        apiKey: instance.data.defaultProperties.apiKey,
        max_suggestions: instance.data.defaultProperties.max_suggestions,
        min_chars: instance.data.defaultProperties.min_chars,
        suggestionLength: instance.data.defaultProperties.suggestionLength,
        placeholder: instance.data.defaultProperties.placeholder,
        textprompt: instance.data.defaultProperties.textprompt
    };

    // Update input placeholder if it exists
    if (instance.data.$elements && instance.data.$elements.input) {
        instance.data.$elements.input.attr('placeholder', instance.data.defaultProperties.placeholder);
    }
}; 