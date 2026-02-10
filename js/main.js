// Load components when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    const initMetaPixel = () => {
        if (window.fbq) return;

        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
        fbq('init', '1625917745253902');
        fbq('track', 'PageView');
        fbq('track', 'ViewContent');

        const metaParams = new URLSearchParams(window.location.search);
        if (metaParams.get('fb_test') === '1') {
            const testEventCode = metaParams.get('fb_test_code');
            const testOptions = testEventCode ? { test_event_code: testEventCode } : undefined;
            fbq('trackCustom', 'MercuriTestEvent', { source: 'fb_test' }, testOptions);
        }
    };

    const setupMetaPixelConversions = () => {
        document.addEventListener('click', (event) => {
            const link = event.target.closest && event.target.closest('a');
            if (!link) return;

            const href = link.getAttribute('href') || '';
            if (href.includes('https://client.mercuri.cx/auth/signup')) {
                if (window.fbq) {
                    fbq('track', 'Lead', { source: 'signup_link' });
                }
            }
        });
    };

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

    const initWhatsAppWidget = () => {
        if (document.getElementById('whatsapp-widget')) return;

        const phoneRaw = '+91 89714 76855';
        const message = 'I have a question about Mercuri';
        const phone = phoneRaw.replace(/[^\d]/g, '');
        if (!phone) return;

        const styleId = 'whatsapp-widget-styles';
        if (!document.getElementById(styleId)) {
            const style = document.createElement('style');
            style.id = styleId;
            style.textContent = `
                .whatsapp-widget {
                    position: fixed;
                    right: 20px;
                    bottom: 20px;
                    z-index: 9999;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    background: #25D366;
                    color: #fff;
                    border-radius: 999px;
                    width: 52px;
                    height: 52px;
                    padding: 0;
                    box-shadow: 0 10px 20px rgba(37, 211, 102, 0.28);
                    font-weight: 700;
                    font-size: 12px;
                    text-decoration: none;
                    transition: transform 180ms ease, box-shadow 180ms ease, opacity 180ms ease;
                }
                .whatsapp-widget:hover {
                    transform: translateY(-2px) scale(1.02);
                    box-shadow: 0 14px 26px rgba(37, 211, 102, 0.38);
                }
                .whatsapp-widget:focus-visible {
                    outline: 2px solid #111827;
                    outline-offset: 3px;
                }
                .whatsapp-widget__icon {
                    width: 24px;
                    height: 24px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    line-height: 1;
                }
                .whatsapp-widget__icon svg {
                    width: 22px;
                    height: 22px;
                    display: block;
                    fill: #fff;
                }
                .whatsapp-widget__icon img {
                    width: 24px;
                    height: 24px;
                    display: block;
                }
                .whatsapp-widget__label {
                    position: absolute;
                    width: 1px;
                    height: 1px;
                    padding: 0;
                    margin: -1px;
                    overflow: hidden;
                    clip: rect(0, 0, 0, 0);
                    white-space: nowrap;
                    border: 0;
                }
                @media (max-width: 640px) {
                    .whatsapp-widget {
                        right: 16px;
                        bottom: 16px;
                        width: 48px;
                        height: 48px;
                    }
                }
            `;
            document.head.appendChild(style);
        }

        const link = document.createElement('a');
        link.id = 'whatsapp-widget';
        link.className = 'whatsapp-widget';
        link.href = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
        link.target = '_blank';
        link.rel = 'noopener';
        link.setAttribute('aria-label', 'Chat with Mercuri on WhatsApp');
        link.innerHTML = `
            <span class="whatsapp-widget__icon" aria-hidden="true">
                <img alt="" src="assets/images/whatsapp.png"/>
            </span>
            <span class="whatsapp-widget__label">Chat on WhatsApp</span>
        `;

        document.body.appendChild(link);
    };

    ensureFavicon();
    initMetaPixel();
    setupMetaPixelConversions();
    ensureChatAnimationStyles();
    initChatTyping();
    initWhatsAppWidget();

    const applyMobileFullWidthButtons = (root = document) => {
        const candidates = root.querySelectorAll('a, button');
        candidates.forEach((el) => {
            const cls = typeof el.className === 'string' ? el.className : '';
            if (!/\bpx-(4|5|6|8|10|12)\b/.test(cls)) return;
            if (!/\bpy-\d/.test(cls)) return;
            if (/\brounded-full\b/.test(cls)) return;

            el.classList.add('w-full', 'sm:w-auto');
        });
    };

    const loadComponent = (elementId, path, onLoad) => {
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
                if (typeof onLoad === 'function') {
                    onLoad();
                }
            })
            .catch((error) => {
                console.error(error);
            });
    };

    const initMobileMenu = () => {
        const toggle = document.getElementById('mobile-menu-toggle');
        const drawer = document.getElementById('mobile-drawer');
        const overlay = document.getElementById('mobile-drawer-overlay');
        const closeBtn = document.getElementById('mobile-drawer-close');
        const icon = document.getElementById('mobile-menu-icon');

        if (!toggle || !drawer) return;

        const closeMenu = () => {
            drawer.classList.add('hidden');
            drawer.setAttribute('aria-hidden', 'true');
            toggle.setAttribute('aria-expanded', 'false');
            if (icon) icon.textContent = 'menu';
        };

        const openMenu = () => {
            drawer.classList.remove('hidden');
            drawer.setAttribute('aria-hidden', 'false');
            toggle.setAttribute('aria-expanded', 'true');
            if (icon) icon.textContent = 'close';
        };

        toggle.addEventListener('click', () => {
            if (drawer.classList.contains('hidden')) {
                openMenu();
            } else {
                closeMenu();
            }
        });

        if (overlay) overlay.addEventListener('click', closeMenu);
        if (closeBtn) closeBtn.addEventListener('click', closeMenu);

        drawer.querySelectorAll('a').forEach((link) => {
            link.addEventListener('click', closeMenu);
        });

        window.addEventListener('resize', () => {
            if (window.innerWidth >= 768) {
                closeMenu();
            }
        });
    };

    const setupGlobalMobileDrawer = () => {
        const toggleDrawer = (open) => {
            const drawer = document.getElementById('mobile-drawer');
            const toggle = document.getElementById('mobile-menu-toggle');
            const icon = document.getElementById('mobile-menu-icon');
            if (!drawer || !toggle) return;

            if (open) {
                drawer.classList.remove('hidden');
                drawer.setAttribute('aria-hidden', 'false');
                toggle.setAttribute('aria-expanded', 'true');
                if (icon) icon.textContent = 'close';
            } else {
                drawer.classList.add('hidden');
                drawer.setAttribute('aria-hidden', 'true');
                toggle.setAttribute('aria-expanded', 'false');
                if (icon) icon.textContent = 'menu';
            }
        };

        document.addEventListener('click', (event) => {
            const target = event.target;
            const toggle = target.closest && target.closest('#mobile-menu-toggle');
            const overlay = target.closest && target.closest('#mobile-drawer-overlay');
            const closeBtn = target.closest && target.closest('#mobile-drawer-close');
            const drawerLink = target.closest && target.closest('#mobile-drawer a');

            if (toggle) {
                const drawer = document.getElementById('mobile-drawer');
                if (!drawer) return;
                const isHidden = drawer.classList.contains('hidden');
                toggleDrawer(isHidden);
                return;
            }

            if (overlay || closeBtn || drawerLink) {
                toggleDrawer(false);
            }
        });

        window.addEventListener('resize', () => {
            if (window.innerWidth >= 768) {
                toggleDrawer(false);
            }
        });
    };

    setupGlobalMobileDrawer();
    applyMobileFullWidthButtons();
    loadComponent('header-placeholder', 'components/header.html', () => {
        initMobileMenu();
        applyMobileFullWidthButtons(document.getElementById('header-placeholder'));
    });
    loadComponent('footer-placeholder', 'components/footer.html', () => {
        applyMobileFullWidthButtons(document.getElementById('footer-placeholder'));
    });
    loadComponent('brands-placeholder', 'components/brands.html');
    loadComponent('reviews-placeholder', 'components/reviews.html', () => {
        applyMobileFullWidthButtons(document.getElementById('reviews-placeholder'));
    });
    loadComponent('marketing-placeholder', 'components/marketing.html', () => {
        applyMobileFullWidthButtons(document.getElementById('marketing-placeholder'));
    });
});
