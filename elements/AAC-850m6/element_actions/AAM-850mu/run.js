function(instance, properties, context) {
    // Create debounce function if it doesn't exist
    if (!instance.data.debounceTimer) {
        instance.data.debounceTimer = null;
        instance.data.isProcessing = false;
    }

    // Clear any existing timer
    if (instance.data.debounceTimer) {
        clearTimeout(instance.data.debounceTimer);
    }

    // Get current input value safely for initial check
    const currentValue = instance.data.$elements.input ? instance.data.$elements.input.val() : '';
    const minChars = properties.min_chars || instance.data.defaultProperties.min_chars || 3;

    // Show loading indicator immediately when typing, if we have enough characters
    if (currentValue && currentValue.length >= minChars) {
        instance.data.$elements.loadingIndicator.fadeIn(100); // Plus rapide pour une meilleure réactivité
        if (instance.data.showLogs) console.log("Showing loading indicator immediately on input");
    }

    //Load any data 
    console.log("EVENT TRIGGERED - Starting debounce");

    //Do the operation with debounce
    instance.data.debounceTimer = setTimeout(async function() {
        // If already processing, don't start a new request
        if (instance.data.isProcessing) {
            return;
        }

        instance.data.isProcessing = true;
        
        try {
            if (instance.data.showLogs) {
                console.log("Starting get_suggestion function after debounce");
                console.log("Properties:", properties);
            }

            // Get current input value safely
            const currentValue = instance.data.$elements.input ? instance.data.$elements.input.val() : '';
            
            // Get properties with proper defaults
            const minChars = properties.min_chars || instance.data.defaultProperties.min_chars || 3;
            const maxSuggestions = properties.max_suggestions || instance.data.defaultProperties.max_suggestions || 5;
            const suggestionLength = properties.suggestionLength || instance.data.defaultProperties.suggestionLength || 150;
            const model = properties.model || instance.data.defaultProperties.model || 'gpt-3.5-turbo';
            const textprompt = properties.textprompt || instance.data.defaultProperties.textprompt || '';
            
            if (instance.data.showLogs) {
                console.log("Using properties:", {
                    minChars,
                    maxSuggestions,
                    suggestionLength,
                    model,
                    hasTextPrompt: !!textprompt,
                    textprompt: textprompt
                });
            }

            // If input is empty or too short, hide suggestions
            if (!currentValue || currentValue.length < minChars) {
                if (instance.data.showLogs) console.log("Input too short, hiding suggestions");
                if (instance.data.$elements.suggestionsList) {
                    instance.data.$elements.suggestionsList.hide();
                }
                instance.data.hideLoading();
                instance.publishState('suggestions', []);
                instance.data.isProcessing = false;
                return;
            }

            // Extract the last sentence or recent words for focused context
            const getLastSentenceOrWords = (text) => {
                // Try to get the last sentence first
                const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
                const lastSentence = sentences.length > 0 ? sentences[sentences.length - 1].trim() : '';
                
                // If no complete sentence, get last N words
                if (!lastSentence) {
                    const words = text.trim().split(/\s+/);
                    return words.slice(-15).join(' '); // Get last 15 words if no sentence
                }
                return lastSentence;
            };

            const lastContext = getLastSentenceOrWords(currentValue);

            // First, analyze the context change with a separate API call
            const apiKey = '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';
            const contextAnalysisResponse = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-3.5-turbo',
                    messages: [
                        {
                            role: "system",
                            content: `You are a context analysis assistant. Your task is to:
1. Analyze the last part of the text
2. Identify if there's a context/topic change
3. Extract the new context/topic if it exists
4. Return a JSON response with:
   - newContext: true/false
   - focusedTopic: the new topic or current topic
   - relevantContext: the most relevant part of text for generating suggestions`
                        },
                        {
                            role: "user",
                            content: `Analyze this text and identify the current context/topic, especially if it changes at the end:
Full text: "${currentValue}"
Last part: "${lastContext}"`
                        }
                    ],
                    temperature: 0.3,
                    max_tokens: 200
                })
            });

            if (!contextAnalysisResponse.ok) throw new Error(`Context Analysis API Error: ${contextAnalysisResponse.status}`);
            const contextAnalysis = await contextAnalysisResponse.json();
            
            let contextInfo;
            try {
                contextInfo = JSON.parse(contextAnalysis.choices[0].message.content);
            } catch (e) {
                console.warn("Failed to parse context analysis, using default", e);
                contextInfo = {
                    newContext: false,
                    focusedTopic: lastContext,
                    relevantContext: lastContext
                };
            }

            if (instance.data.showLogs) {
                console.log("Context Analysis:", contextInfo);
            }

            // Enhanced system prompt with custom context from textprompt and context analysis
            const systemPrompt = 
                `You are an AI assistant specializing in text completion with two distinct aspects:\n\n` +
                `1. CONTEXT DEFINITION:\n` +
                `Base Context: ${textprompt}\n` +
                `Current Focus: ${contextInfo.focusedTopic}\n\n` +
                `Context Rules:\n` +
                `- STRICTLY generate suggestions that align with the current focus: "${contextInfo.focusedTopic}"\n` +
                `- Each suggestion must be contextually relevant and appropriate\n` +
                `- Maintain thematic consistency with the ${contextInfo.newContext ? 'new' : 'current'} context\n` +
                `- Focus on COMPLETING the text naturally\n` +
                `- Consider what elements are missing or needed to complete the thought\n` +
                `- Pay SPECIAL ATTENTION to any context changes or new topics\n\n` +
                `2. STYLE ADAPTATION (from user's input):\n` +
                `- EXACTLY match the language of the input text\n` +
                `- Mirror the writing style from what the user has typed\n` +
                `- Match vocabulary level and expressions from the input\n` +
                `- Adapt tone and formality to match the input text\n` +
                `- Ensure natural flow from the existing text\n\n` +
                `Technical requirements:\n` +
                `1. Provide EXACTLY ${maxSuggestions} different text continuations\n` +
                `2. Each suggestion MUST be at least ${suggestionLength} characters long\n` +
                `3. Use appropriate grammar and punctuation\n` +
                `4. Format output as numbered list\n` +
                `5. NEVER repeat what has already been written`;

            // Calculate tokens needed (approximately 4 characters per token for safety)
            const maxTokens = Math.ceil(suggestionLength * maxSuggestions * 1.5);

            // Enhanced user prompt with context-aware formatting
            const userPrompt = 
                `Continue this text with EXACTLY ${maxSuggestions} different natural completions.\n\n` +
                `Context Information:\n` +
                `- Current Topic: ${contextInfo.focusedTopic}\n` +
                `- Context Changed: ${contextInfo.newContext ? 'Yes' : 'No'}\n` +
                `- Relevant Context: "${contextInfo.relevantContext}"\n\n` +
                `Full text for reference: "${currentValue}"\n\n` +
                `CRITICAL REQUIREMENTS:\n` +
                `1. Each suggestion must be a DIRECT CONTINUATION focusing on: ${contextInfo.focusedTopic}\n` +
                `2. Use EXACTLY the same language as the input text\n` +
                `3. Match the style of what the user has typed\n` +
                `4. Maintain consistent tone with the input\n` +
                `5. Provide EXACTLY ${maxSuggestions} numbered suggestions\n` +
                `6. Each suggestion MUST be at least ${suggestionLength} characters\n` +
                `7. Stay focused on the ${contextInfo.newContext ? 'new' : 'current'} topic\n` +
                `8. DO NOT repeat any part of the input text\n` +
                `9. Ensure each suggestion flows naturally\n` +
                `10. If the context has changed, focus on the new topic\n\n` +
                `Format your response exactly like this:\n` +
                `1. [First natural continuation about ${contextInfo.focusedTopic}]\n` +
                `2. [Second natural continuation about ${contextInfo.focusedTopic}]\n` +
                `... and so on until ${maxSuggestions}`;

            if (instance.data.showLogs) {
                console.log("System Prompt:", systemPrompt);
                console.log("User Prompt:", userPrompt);
                console.log("Context Info:", contextInfo);
            }

            // Call ChatGPT API with optimized parameters
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: model,
                    messages: [
                        {
                            role: "system",
                            content: systemPrompt
                        },
                        {
                            role: "user",
                            content: userPrompt
                        }
                    ],
                    temperature: 0.7,
                    max_tokens: maxTokens,
                    presence_penalty: 0.3,
                    frequency_penalty: 0.3,
                    n: 1,
                    top_p: 0.9
                })
            });

            if (!response.ok) throw new Error(`API Error: ${response.status}`);
            const data = await response.json();

            if (instance.data.showLogs) console.log("API response received:", data);

            // Update total tokens used
            const tokensUsed = data.usage.total_tokens || 0;
            const currentTotalTokens = instance.data.totalTokensUsed || 0;
            instance.publishState('totalTokensUsed', currentTotalTokens + tokensUsed);
            if (instance.data.showLogs) console.log("Total tokens used updated:", currentTotalTokens + tokensUsed);

            // Process suggestions with improved filtering
            const suggestions = data.choices[0].message.content
                .split('\n')
                .map(s => s.trim())
                .filter(s => s.length > 0)
                .map(s => {
                    // Clean up the suggestion
                    s = s.replace(/^\d+[\.\)]\s*/, '')  // Remove numbering
                        .replace(/^[-•*]\s*/, '')   // Remove bullet points
                        .replace(/^["']|["']$/g, '') // Remove quotes
                        .trim();
                    
                    // Add space if needed
                    if (!/[\s]/.test(currentValue.slice(-1)) && !/^[,;.!?]/.test(s)) {
                        s = ' ' + s;
                    }
                    
                    // Don't add space before punctuation
                    s = s.replace(/\s+([,;.!?])/g, '$1');
                    
                    return s;
                })
                .filter(s => s.length >= Math.min(50, suggestionLength)) // Ensure minimum length
                .filter(s => !currentValue.toLowerCase().includes(s.toLowerCase()))
                .filter((s, index, self) => self.indexOf(s) === index)
                .slice(0, maxSuggestions);

            if (instance.data.showLogs) {
                console.log("Processed suggestions:", suggestions);
                console.log("Number of suggestions:", suggestions.length);
                console.log("Expected suggestions:", maxSuggestions);
            }

            // If we don't have enough suggestions, try to get more
            if (suggestions.length < maxSuggestions) {
                console.warn(`Got ${suggestions.length} suggestions, expected ${maxSuggestions}`);
            }

            // Update suggestions list
            const $suggestionsList = instance.data.$elements.suggestionsList;
            $suggestionsList.empty();

            suggestions.forEach((suggestion, index) => {
                const $item = $('<div>')
                    .addClass('suggestion-item')
                    .html(`<span class="completion-text">${suggestion}</span>`);

                $suggestionsList.append($item);
            });

            // Show suggestions if we have any
            if (suggestions.length > 0) {
                $suggestionsList.fadeIn(200);
                if (instance.data.showLogs) console.log("Suggestions displayed");
                
                // Call the callback if it exists
                if (typeof instance.data.onSuggestionsReceived === 'function') {
                    instance.data.onSuggestionsReceived(suggestions);
                }
            } else {
                $suggestionsList.hide();
                if (instance.data.showLogs) console.log("No suggestions to display");
                
                // Call the callback with empty array if it exists
                if (typeof instance.data.onSuggestionsReceived === 'function') {
                    instance.data.onSuggestionsReceived([]);
                }
            }

            // Update states
            instance.publishState('suggestions', suggestions);
            instance.data.hideLoading();

        } catch (error) {
            console.error("Error in get_suggestion:", error);
            instance.publishState('error', error.message);
            instance.data.hideLoading();
            instance.data.$elements.suggestionsList.hide();
        } finally {
            instance.data.isProcessing = false;
        }
    }, 500); // Reduced to 500ms debounce
} 