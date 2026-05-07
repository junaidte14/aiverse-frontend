class AIVerseWidget {
    constructor(config = {}) {
        this.iframe = null;
        this.config = {
            guestAllowed: false,
            provider: 'groq',
            model: 'llama-3.3-70b-versatile',
            primaryColor: '#9333ea',
            position: 'bottom-right',
            title: 'AI Assistant',
            ...config,
        };
        this.baseUrl = 'https://iversana.vercel.app';
        this.init();
        this.setupListeners(); // Listen for resize events from React
    }

    init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.render());
        } else {
            this.render();
        }
    }

    setupListeners() {
        window.addEventListener('message', (event) => {
            if (event.data.type === 'WIDGET_RESIZE' && this.iframe) {
                this.iframe.style.width = event.data.width;
                this.iframe.style.height = event.data.height;
                this.iframe.style.pointerEvents = 'auto';
            }
        });
    }

    buildWidgetUrl() {
        const params = new URLSearchParams();
        Object.keys(this.config).forEach(key => {
            if (this.config[key] !== undefined) params.append(key, this.config[key]);
        });
        return `${this.baseUrl}/widget?${params.toString()}`;
    }

    render() {
        this.iframe = document.createElement('iframe');
        this.iframe.src = this.buildWidgetUrl();
        this.iframe.setAttribute('allowtransparency', 'true');
        this.iframe.setAttribute('frameborder', '0');

        // Start with small dimensions (the bubble size)
        Object.assign(this.iframe.style, {
            position: 'fixed',
            bottom: '0',
            right: this.config.position === 'bottom-left' ? 'auto' : '0',
            left: this.config.position === 'bottom-left' ? '0' : 'auto',
            width: '56px',  // Start small
            height: '56px', // Start small
            border: 'none',
            zIndex: '999999',
            background: 'transparent',
            colorScheme: 'none',
            transition: 'width 0.3s, height 0.3s' // Smooth resizing
        });

        document.body.appendChild(this.iframe);
    }
}

window.AIVerseWidget = AIVerseWidget;