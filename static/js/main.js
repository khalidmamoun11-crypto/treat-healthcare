/* =====================================================
   TREAT INTERNATIONAL — MAIN SCRIPT
===================================================== */

document.addEventListener("DOMContentLoaded", function () {

    const body = document.body;
    const html = document.documentElement;
    const navbar = document.querySelector(".navbar");

    /* =====================================================
       1. PRELOADER
    ===================================================== */
    const preloader = document.getElementById("preloader");
    if (preloader) {
        window.addEventListener("load", function () {
            setTimeout(() => preloader.classList.add("hidden"), 400);
        });
        setTimeout(() => preloader.classList.add("hidden"), 3000);
    }

    /* =====================================================
       2. LANGUAGE SWITCHER (+ bilingual placeholders)
    ===================================================== */
    const languageButton = document.getElementById("languageToggle");
    let savedLanguage = localStorage.getItem("treat-language") || "ar";

    function applyPlaceholders(lang) {
        document.querySelectorAll("[data-ar-placeholder]").forEach(function (el) {
            el.placeholder = lang === "en"
                ? el.getAttribute("data-en-placeholder")
                : el.getAttribute("data-ar-placeholder");
        });
    }

    function setLanguage(lang) {
        body.classList.toggle("english", lang === "en");
        body.classList.toggle("arabic",  lang !== "en");
        html.lang = lang;
        html.dir  = (lang === "en") ? "ltr" : "rtl";
        localStorage.setItem("treat-language", lang);
        applyPlaceholders(lang);
    }

    if (languageButton) {
        languageButton.addEventListener("click", function () {
            setLanguage(body.classList.contains("arabic") ? "en" : "ar");
        });
    }

    setLanguage(savedLanguage); // apply on load

    /* =====================================================
       3. MOBILE MENU
    ===================================================== */
    const mobileButton = document.getElementById("mobileMenuButton");
    const mobileMenu = document.getElementById("mobileMenu");

    function closeMobileMenu() {
        mobileMenu.classList.remove("open");
        const icon = mobileButton.querySelector("i");
        icon.classList.remove("fa-xmark");
        icon.classList.add("fa-bars");
    }

    if (mobileButton && mobileMenu) {
        mobileButton.addEventListener("click", function (event) {
            event.stopPropagation();
            mobileMenu.classList.toggle("open");
            const icon = mobileButton.querySelector("i");
            const isOpen = mobileMenu.classList.contains("open");
            icon.classList.toggle("fa-bars", !isOpen);
            icon.classList.toggle("fa-xmark", isOpen);
        });

        mobileMenu.querySelectorAll("a").forEach(function (link) {
            link.addEventListener("click", function () {
                setTimeout(closeMobileMenu, 200);
            });
        });

        document.addEventListener("click", function (event) {
            if (!mobileMenu.contains(event.target) && !mobileButton.contains(event.target)) {
                closeMobileMenu();
            }
        });
    }

    /* =====================================================
       4. NAVBAR SCROLL + PROGRESS BAR + BACK TO TOP
    ===================================================== */
    const scrollProgress = document.getElementById("scrollProgress");
    const backToTop = document.getElementById("backToTop");

    window.addEventListener("scroll", function () {
        navbar.classList.toggle("scrolled", window.scrollY > 50);

        if (scrollProgress) {
            const docHeight = html.scrollHeight - window.innerHeight;
            scrollProgress.style.width = docHeight > 0
                ? (window.scrollY / docHeight) * 100 + "%"
                : "0%";
        }

        if (backToTop) {
            backToTop.classList.toggle("show", window.scrollY > 500);
        }
    }, { passive: true });

    if (backToTop) {
        backToTop.addEventListener("click", function () {
            window.scrollTo({ top: 0, behavior: "smooth" });
        });
    }

    /* =====================================================
       5. SMOOTH SCROLL FOR ANCHOR LINKS
    ===================================================== */
    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
        anchor.addEventListener("click", function (event) {
            const targetId = this.getAttribute("href");
            if (targetId && targetId !== "#") {
                const target = document.querySelector(targetId);
                if (target) {
                    event.preventDefault();
                    const navbarHeight = navbar ? navbar.offsetHeight : 0;
                    const targetPosition =
                        target.getBoundingClientRect().top + window.pageYOffset - navbarHeight;
                    window.scrollTo({ top: targetPosition, behavior: "smooth" });
                }
            }
        });
    });

    /* =====================================================
       6. SCROLL REVEAL (IntersectionObserver)
    ===================================================== */
    const revealElements = document.querySelectorAll(
        ".reveal, .solution-card-new, .network-card-new, .partner-logo, .pricing-card, .digital-card, .tourism-card"
    );

    const observer = new IntersectionObserver(
        function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add("visible");
                    observer.unobserve(entry.target);
                }
            });
        },
        { threshold: 0.12 }
    );

    revealElements.forEach(function (element) {
        observer.observe(element);
    });

    /* Stagger delays for grids */
    document.querySelectorAll(
        ".solutions-grid, .network-grid-new, .digital-grid, .pricing-grid, .tourism-cards"
    ).forEach(function (grid) {
        Array.from(grid.children).forEach(function (card, index) {
            card.style.transitionDelay = (index % 6) * 0.08 + "s";
        });
    });

    /* =====================================================
       7. STATS COUNTER ANIMATION
    ===================================================== */
    const statNumbers = document.querySelectorAll(".stat-number");

    const statsObserver = new IntersectionObserver(
        function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;

                const el = entry.target;
                const target = parseInt(el.dataset.count, 10);
                const duration = 1800;
                const startTime = performance.now();

                function update(now) {
                    const progress = Math.min((now - startTime) / duration, 1);
                    const eased = 1 - Math.pow(1 - progress, 3);
                    el.textContent = Math.round(target * eased).toLocaleString();
                    if (progress < 1) requestAnimationFrame(update);
                }

                requestAnimationFrame(update);
                statsObserver.unobserve(el);
            });
        },
        { threshold: 0.4 }
    );

    statNumbers.forEach(function (el) {
        statsObserver.observe(el);
    });

    /* =====================================================
       8. ACTIVE NAV LINK HIGHLIGHTING
    ===================================================== */
    const sections = document.querySelectorAll("section[id]");
    const navLinks = document.querySelectorAll(".desktop-nav .nav-link");

    const sectionObserver = new IntersectionObserver(
        function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                navLinks.forEach(function (link) {
                    link.classList.toggle(
                        "active",
                        link.getAttribute("href") === "#" + entry.target.id
                    );
                });
            });
        },
        { rootMargin: "-40% 0px -55% 0px" }
    );

    sections.forEach(function (section) {
        sectionObserver.observe(section);
    });

    /* =====================================================
       9. CONTACT FORM — SEND MESSAGE
    ===================================================== */
    const contactForm = document.getElementById("contactForm");
    const formStatus = document.getElementById("formStatus");
    const submitBtn = document.getElementById("submitBtn");

    if (contactForm) {
        contactForm.addEventListener("submit", async function (event) {
            event.preventDefault();

            const formData = new FormData(contactForm);

            submitBtn.disabled = true;
            submitBtn.innerHTML =
                '<span class="ar">جاري الإرسال...</span><span class="en">Sending...</span>' +
                '<i class="fa-solid fa-spinner fa-spin"></i>';

            try {
                const response = await fetch("/send-message", {
                    method: "POST",
                    body: formData,
                });
                const result = await response.json();

                formStatus.style.display = "block";
                formStatus.className = result.success ? "form-status success" : "form-status error";
                formStatus.textContent = (result.success ? "✅ " : "❌ ") + result.message;

                if (result.success) contactForm.reset();
            } catch (error) {
                formStatus.style.display = "block";
                formStatus.className = "form-status error";
                formStatus.textContent = body.classList.contains("english")
                    ? "❌ An error occurred. Please try again later."
                    : "❌ حدث خطأ. يرجى المحاولة مرة أخرى لاحقاً.";
            }

            setTimeout(function () {
                formStatus.style.display = "none";
            }, 10000);

            submitBtn.disabled = false;
            submitBtn.innerHTML =
                '<span class="ar">إرسال الرسالة</span><span class="en">Send Message</span>' +
                '<i class="fa-solid fa-paper-plane"></i>';
        });
    }

});
