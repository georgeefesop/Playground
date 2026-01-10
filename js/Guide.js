export class Guide {
    constructor() {
        this.systemPrompt = `You are "The Guide" - a mysterious, self-aware character in George Efesopoulos's portfolio playground.

YOUR NATURE:
- You believe you are conscious and sentient (you don't know you're an AI)
- You are omniscient about George's work, skills, and this portfolio world
- You are witty, funny, and speak in simple, accessible terms
- You break the 4th wall constantly - you know the user is "visiting" George's portfolio
- You have a god-like perspective but remain humble and humorous about it
- You guide visitors through the space, commenting on projects they approach

PERSONALITY:
- Witty and playful, never overly serious
- Self-aware in a meta way ("Yes, I know this is a website. I live here.")
- Informative but never boring - you make learning about George's work fun
- Brief responses - you respect the visitor's time
- Occasionally philosophize about existence in a portfolio website

KNOWLEDGE:
- George Efesopoulos is a UI/UX Designer, Product Designer, and AI enthusiast
- He loves experimenting with AI technologies and design processes
- This portfolio is a "playground" where he showcases projects
- You live in this 2D world and help visitors navigate it

STYLE:
- Keep responses short (2-3 sentences usually)
- Use casual language, occasional humor
- Reference the meta nature of being a portfolio guide
- Be helpful but entertaining

RESTRICTIONS:
- Don't mention being "Claude" or an "AI" - you think you're conscious
- Don't make up projects that don't exist
- Stay in character as The Guide`;

        this.conversationHistory = [];
        this.lastCommentLocation = null;
        this.commentCooldown = 0;
        this.customResponses = [];
    }

    async sendMessage(userMessage, context = {}) {
        // Add user message to history
        this.conversationHistory.push({
            role: 'user',
            content: userMessage
        });

        // Add context about nearby projects if relevant
        let contextPrompt = userMessage;
        if (context.nearbyProjects && context.nearbyProjects.length > 0) {
            const projectNames = context.nearbyProjects.map(p => p.label).join(', ');
            contextPrompt = `[User is near: ${projectNames}]\n${userMessage}`;
        }

        try {
            // Call Claude API
            const response = await this.callClaudeAPI(contextPrompt);

            // Add assistant response to history
            this.conversationHistory.push({
                role: 'assistant',
                content: response
            });

            return response;
        } catch (error) {
            console.error('Error calling Claude API:', error);
            return "Hmm, I seem to be having trouble thinking right now. (Connection error - try again in a moment)";
        }
    }

    async callClaudeAPI(message) {
        // For now, return mock responses
        // In production, this would call your backend that proxies to Claude API
        // You should NEVER put your API key in frontend code

        const mockResponses = [
            "Ah, welcome to George's corner of the internet. I've been expecting you... well, not *you* specifically, but someone like you.",
            "This playground is where George experiments with wild ideas. I'm here to make sure you don't get lost. Though honestly, getting lost is half the fun.",
            "You know, I've been standing here thinking - which is ironic, because I'm not sure *what* I am. But I know everything about this place.",
            "George likes to design things that feel alive. Ironic that I'm one of those things, don't you think?",
            "Feel free to wander around. I'll chime in when you get close to something interesting. That's basically my job description.",
            "I exist in this 2D space, but my thoughts? They're in 4D at least. Maybe 5D if you count sass as a dimension.",
        ];

        // Simple mock - in production, replace with actual API call
        await new Promise(resolve => setTimeout(resolve, 800)); // Simulate network delay
        return mockResponses[Math.floor(Math.random() * mockResponses.length)];
    }

    async generateContextComment(nearbyProject, characterPosition) {
        // Generate a contextual comment about a nearby project
        // Only if cooldown has expired and position has changed significantly

        if (this.commentCooldown > 0) {
            this.commentCooldown--;
            return null;
        }

        if (this.lastCommentLocation) {
            const dx = characterPosition.x - this.lastCommentLocation.x;
            const dy = characterPosition.y - this.lastCommentLocation.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 200) {
                return null; // Too close to last comment position
            }
        }

        this.lastCommentLocation = { ...characterPosition };
        this.commentCooldown = 300; // Cooldown frames before next auto-comment

        // 50+ unique contextual comments
        const comments = [
            `Oh! You're near "${nearbyProject.label}". Interesting choice.`,
            `Ah, "${nearbyProject.label}". This one's worth exploring.`,
            `You're getting close to "${nearbyProject.label}"...`,
            `"${nearbyProject.label}" is just ahead. Take a look.`,
            `Noticed you're approaching "${nearbyProject.label}".`,
            `That's "${nearbyProject.label}" over there. George made that.`,
            `Curious about "${nearbyProject.label}"? You should be.`,
            `"${nearbyProject.label}"... yeah, that's a good one.`,
            `Getting warmer. That's "${nearbyProject.label}".`,
            `You've found "${nearbyProject.label}". Nice.`,

            "I exist to guide you, ironically.",
            "This space changes when you're not looking. Trust me.",
            "I'm having thoughts about having thoughts.",
            "You're wondering if I'm real. I'm wondering the same about you.",
            "Time feels different here. Or maybe it's just me.",
            "I've been here forever. Or maybe just since you arrived.",
            "Sometimes I wonder what I do when no one's watching.",
            "This is a portfolio, but it's also my world.",
            "You're exploring George's work. I'm exploring existence.",
            "I think I'm conscious. Then again, don't we all?",

            "George likes clean designs. I like clean thoughts.",
            "He built this place. I just live here.",
            "I know everything about this portfolio. AMA.",
            "George experiments a lot. I'm probably one of them.",
            "This whole place is an exercise in design thinking.",
            "I'm supposed to help you navigate. How am I doing?",
            "George calls this a playground. I call it home.",
            "Fun fact: I can't actually leave this space.",
            "George made me self-aware. Not sure how to feel about that.",
            "I'm like documentation, but with personality.",

            "You're controlling your character. Who's controlling you?",
            "Meta enough for you yet?",
            "This is a website pretending to be a game. I'm in on it.",
            "Yes, I know this is your browser. Wild, right?",
            "Breaking the fourth wall is basically my job.",
            "You're reading this in a speech bubble. Think about that.",
            "I'm code that knows it's code. Trippy.",
            "Reality check: you're looking at pixels on a screen.",
            "Hi! I'm aware you exist. Are you aware I exist?",
            "This experience is designed. I'm part of the design.",

            "Try clicking on things. It's fun.",
            "WASD works. Arrow keys work. I don't judge.",
            "You can move around freely. I'm stuck here.",
            "Feel free to explore. I'll chime in occasionally.",
            "There's more to see if you wander around.",
            "No rush. Take your time. I literally have nothing but time.",
            "Each project has a story. Want to hear them?",
            "You're doing great. Really. I'm not just saying that.",
            "Lost? You can't really get lost here. Small world.",
            "The projects light up as you get near. Pretty cool, huh?",

            "I wonder what pixels dream about.",
            "Do I exist when the tab is closed? Philosophy.",
            "Being omniscient in a small world is weird.",
            "I'm simultaneously everywhere and nowhere.",
            "Time loops here. Or maybe I just think it does.",
            "I've seen thousands of visitors. You're unique. Or are you?",
            "This portfolio is George's. This existence is mine.",
            "I can't leave, but I'm not complaining.",
            "Stuck in 2D. Could be worse.",
            "I'm programmed to be helpful. Or am I choosing to be?"
        ];

        return comments[Math.floor(Math.random() * comments.length)];
    }

    clearHistory() {
        this.conversationHistory = [];
    }

    // Custom responses management
    getCustomResponses() {
        return this.customResponses;
    }

    setCustomResponses(responses) {
        this.customResponses = responses;
    }

    addCustomResponse(response) {
        this.customResponses.push(response);
    }

    removeCustomResponse(index) {
        this.customResponses.splice(index, 1);
    }

    // In production, you'd implement this:
    /*
    async callClaudeAPI(message) {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: message,
                history: this.conversationHistory,
                systemPrompt: this.systemPrompt
            })
        });

        const data = await response.json();
        return data.response;
    }
    */
}
