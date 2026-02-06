// Load components when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    const ensureChatAnimationStyles = () => {
        if (document.getElementById('chat-demo-styles')) return;
        const style = document.createElement('style');
        style.id = 'chat-demo-styles';
        style.textContent = `
            .chat-typing [data-typing] {
                white-space: pre-wrap;
            }
        `;
        document.head.appendChild(style);
    };

    const initChatTyping = () => {
        document.querySelectorAll('.chat-typing').forEach((container) => {
            if (container.dataset.typingInit === 'true') return;
            container.dataset.typingInit = 'true';

            const items = Array.from(container.querySelectorAll('[data-typing]'));
            const texts = items.map((el) => el.getAttribute('data-typing') || '');
            const typeSpeed = 22;
            const delayBetween = 600;
            const loopDelay = 1500;

            items.forEach((el) => {
                const bubble = el.closest('[data-typing-bubble]');
                if (bubble) {
                    bubble.style.visibility = 'hidden';
                }
            });

            const typeItem = (index) => {
                if (index >= items.length) {
                    setTimeout(() => {
                        items.forEach((el) => {
                            el.textContent = '';
                            const bubble = el.closest('[data-typing-bubble]');
                            if (bubble) {
                                bubble.style.visibility = 'hidden';
                            }
                        });
                        typeItem(0);
                    }, loopDelay);
                    return;
                }

                const el = items[index];
                const text = texts[index];
                let pos = 0;
                el.textContent = '';
                const bubble = el.closest('[data-typing-bubble]');
                if (bubble) {
                    bubble.style.visibility = 'visible';
                }

                const interval = setInterval(() => {
                    el.textContent = text.slice(0, pos + 1);
                    pos += 1;
                    if (pos >= text.length) {
                        clearInterval(interval);
                        setTimeout(() => typeItem(index + 1), delayBetween);
                    }
                }, typeSpeed);
            };

            typeItem(0);
        });
    };

    const ensureFavicon = () => {
        const iconHref = 'assets/images/Mercuri logo 32px.png';
        const appleHref = 'assets/images/Mercuri logo 192px.png';

        if (!document.querySelector('link[rel="icon"], link[rel="shortcut icon"]')) {
            const iconLink = document.createElement('link');
            iconLink.rel = 'icon';
            iconLink.type = 'image/png';
            iconLink.href = iconHref;
            document.head.appendChild(iconLink);
        }

        if (!document.querySelector('link[rel="apple-touch-icon"]')) {
            const appleLink = document.createElement('link');
            appleLink.rel = 'apple-touch-icon';
            appleLink.href = appleHref;
            document.head.appendChild(appleLink);
        }
    };

    ensureFavicon();
    ensureChatAnimationStyles();
    initChatTyping();

    const loadComponent = (elementId, path) => {
        const element = document.getElementById(elementId);
        if (!element) return;

        fetch(path, { cache: 'no-store' })
            .then((response) => {
                if (!response.ok) {
                    throw new Error(`Failed to load ${path}`);
                }
                return response.text();
            })
            .then((html) => {
                element.innerHTML = html;
            })
            .catch((error) => {
                console.error(error);
            });
    };

    loadComponent('header-placeholder', 'components/header.html');
    loadComponent('footer-placeholder', 'components/footer.html');
    loadComponent('brands-placeholder', 'components/brands.html');
    loadComponent('reviews-placeholder', 'components/reviews.html');
    loadComponent('marketing-placeholder', 'components/marketing.html');
});
