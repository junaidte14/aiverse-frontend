/**
 * Widget Loader Script
 * This file will be bundled separately for external embedding
 */

interface WidgetConfig {
    collection?: string;
    provider?: string;
    model?: string;
    guestAllowed?: boolean;
    initialMessage?: string;
    primaryColor?: string;
    position?: 'bottom-right' | 'bottom-left';
    title?: string;
    apiUrl?: string;
}

class AIVerseWidget {
    private iframe: HTMLIFrameElement | null = null;
    private config: WidgetConfig;
    private baseUrl: string;

    constructor(config: WidgetConfig = {}) {
        this.config = {
            guestAllowed: true,
            provider: 'groq',
            model: 'llama-3.3-70b-versatile',
            primaryColor: '#9333ea',
            position: 'bottom-right',
            title: 'AI Assistant',
            apiUrl: import.meta.env.VITE_API_URL || 'https://junaidte14-aiverse.hf.space/api/v1/',
            ...config,
        };

        this.baseUrl = import.meta.env.VITE_API_URL || 'https://junaidte14-aiverse.hf.space/api/v1/';
        this.init();
    }

    private init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.render());
        } else {
            this.render();
        }
    }

    private buildWidgetUrl(): string {
        const params = new URLSearchParams();

        if (this.config.collection) params.append('collection', this.config.collection);
        if (this.config.provider) params.append('provider', this.config.provider);
        if (this.config.model) params.append('model', this.config.model);
        if (this.config.guestAllowed !== undefined)
            params.append('guestAllowed', this.config.guestAllowed.toString());
        if (this.config.initialMessage) params.append('initialMessage', this.config.initialMessage);
        if (this.config.primaryColor) params.append('primaryColor', this.config.primaryColor);
        if (this.config.position) params.append('position', this.config.position);
        if (this.config.title) params.append('title', this.config.title);

        return `${this.baseUrl}/widget?${params.toString()}`;
    }

    private render() {
        // Create iframe
        this.iframe = document.createElement('iframe');
        this.iframe.src = this.buildWidgetUrl();
        this.iframe.style.position = 'fixed';
        this.iframe.style.bottom = '10px';
        this.iframe.style.right = this.config.position === 'bottom-left' ? 'auto' : '0';
        this.iframe.style.left = this.config.position === 'bottom-left' ? '0' : 'auto';
        this.iframe.style.width = '350px';
        this.iframe.style.height = '350px';
        this.iframe.style.pointerEvents = 'auto';
        this.iframe.style.border = 'none';
        this.iframe.style.zIndex = '999999';
        this.iframe.style.pointerEvents = 'none';

        // Make only the widget interactive
        this.iframe.onload = () => {
            if (this.iframe) {
                this.iframe.style.pointerEvents = 'auto';
            }
        };

        document.body.appendChild(this.iframe);
    }

    public destroy() {
        if (this.iframe && this.iframe.parentNode) {
            this.iframe.parentNode.removeChild(this.iframe);
            this.iframe = null;
        }
    }
}

// Make it available globally for external HTML files
if (typeof window !== 'undefined') {
    (window as any).AIVerseWidget = AIVerseWidget;
}

export default AIVerseWidget;