(function () {
  "use strict";

  function onReady(fn) {
    if (document.readyState !== "loading") fn();
    else document.addEventListener("DOMContentLoaded", fn);
  }

  function fadeOutElement(el, durationMs) {
    if (!el) return;
    var ms = durationMs != null ? durationMs : 300;
    var prev = el.style.transition;
    el.style.transition = "opacity " + ms + "ms ease";
    requestAnimationFrame(function () {
      el.style.opacity = "0";
    });
    setTimeout(function () {
      el.style.display = "none";
      el.style.opacity = "";
      el.style.transition = prev;
    }, ms);
  }

  function scrollToElementY(el, durationMs) {
    if (!el) return;
    var targetY = el.getBoundingClientRect().top + window.scrollY;
    var startY = window.scrollY;
    var distance = targetY - startY;
    var duration = durationMs != null ? durationMs : 1000;
    var t0 = performance.now();
    function step(now) {
      var t = Math.min((now - t0) / duration, 1);
      var ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      window.scrollTo(0, startY + distance * ease);
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function initMobileMenu() {
    document.querySelectorAll(".menu-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        btn.classList.toggle("active");
        document.body.classList.toggle("active");
        var menu = document.querySelector(".menu");
        if (menu) menu.classList.toggle("active");
        var header = document.querySelector(".header");
        if (header) header.classList.toggle("active");
      });
    });

    document.querySelectorAll(".menu a").forEach(function (link) {
      link.addEventListener("click", function () {
        document.querySelectorAll(".menu-btn").forEach(function (b) {
          b.classList.remove("active");
        });
        document.body.classList.remove("active");
        var menu = document.querySelector(".menu");
        if (menu) menu.classList.remove("active");
      });
    });
  }

  function initAnchorScroll() {
    var selectors = [
      "#menu",
      "#footer__menu",
      ".features__item",
      ".main-screen",
      ".pricing_plans",
      ".supported-languages",
      "#to-top",
    ];
    selectors.forEach(function (sel) {
      var root = document.querySelector(sel);
      if (!root) return;
      root.addEventListener("click", function (e) {
        var a = e.target.closest("a");
        if (!a || !root.contains(a)) return;
        if (a.classList.contains("privacy-link") || a.classList.contains("blog-link")) return;
        var href = a.getAttribute("href");
        if (!href || href.charAt(0) !== "#") return;
        var target = document.querySelector(href);
        if (!target) return;
        e.preventDefault();
        scrollToElementY(target, 1000);
      });
    });
  }

  function initStickyHeader() {
    var header = document.querySelector(".header");
    if (!header) return;
    var isSticky = false;
    var rafId = null;
    function applyStickyState() {
      rafId = null;
      var should = window.scrollY > 1;
      if (should === isSticky) return;
      isSticky = should;
      if (should) header.classList.add("sticky");
      else header.classList.remove("sticky");
    }
    function onScroll() {
      if (rafId != null) return;
      rafId = requestAnimationFrame(applyStickyState);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    applyStickyState();
  }

  function initCookiesBanner() {
    document.querySelectorAll(".cookies__button").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var banner = document.querySelector(".cookies-banner");
        fadeOutElement(banner, 300);
      });
    });
  }

  function initModalClose() {
    document.querySelectorAll(".close-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        document.querySelectorAll(".modal-window").forEach(function (mw) {
          fadeOutElement(mw, 300);
        });
      });
    });

    document.querySelectorAll(".modal-window").forEach(function (mw) {
      mw.addEventListener("click", function (e) {
        if (e.target === mw) fadeOutElement(mw, 300);
      });
    });
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function initExitModal() {
    document.querySelectorAll(".exit-modal__input").forEach(function (input) {
      input.addEventListener("input", function () {
        var emailValue = input.value.trim();
        var submitButton = document.querySelector(".exit-modal__button");
        if (!submitButton) return;
        if (emailValue.length > 0 && isValidEmail(emailValue)) {
          submitButton.classList.remove("disabled");
        } else {
          submitButton.classList.add("disabled");
        }
      });
    });

    document.querySelectorAll(".exit-modal__button").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        if (btn.classList.contains("disabled")) return;
        var exitWrap = document.querySelector(".exit-modal__wrapper");
        var confirmWrap = document.querySelector(".confirmation-modal__wrapper");
        if (exitWrap) exitWrap.style.display = "none";
        if (confirmWrap) confirmWrap.style.display = "";
      });
    });
  }

  function initArticlesSlider() {
    document.querySelectorAll(".articles-slider-wrapper").forEach(initArticlesSliderInstance);
  }

  function initArticlesSliderInstance(wrapper) {
    var BP_MOBILE = 768;
    var BP_TABLET = 1200;
    var SLIDE_SPEED_MS = 500;
    var SLIDE_EASING = "ease-in-out";
    var CENTER_SLIDE_FRACTION = 0.78;
    var SWIPE_COMMIT_MIN_PX = 35;
    var DRAG_AXIS_MIN_PX = 8;
    var RESIZE_DEBOUNCE_MS = 150;
    var CLICK_BLOCK_MS = 400;

    var container = wrapper.querySelector(".articles-slider");
    if (!container || container.dataset.vanillaArticlesSlider) return;

    var itemRefs = Array.prototype.slice.call(
      container.querySelectorAll(":scope > .articles-slider__item")
    );
    if (!itemRefs.length) return;
    container.dataset.vanillaArticlesSlider = "1";
    container.classList.add("slick-slider", "slick-initialized");

    var list = document.createElement("div");
    list.className = "slick-list";
    var track = document.createElement("div");
    track.className = "slick-track";
    list.appendChild(track);
    container.appendChild(list);
    list.style.touchAction = "pan-y";
    list.style.cursor = "grab";

    var prevBtn = wrapper.querySelector(".prev2");
    var nextBtn = wrapper.querySelector(".next2");
    var dotsWrap = null;
    var resizeTimer;
    var builtSt = -1;
    var leftPos = 0;
    var infiniteMode = false;
    var dragOffsetPx = 0;
    var dragActive = false;

    var swipeStartX = 0;
    var swipeStartY = 0;
    var swipeLastX = 0;
    var swipeLastY = 0;
    var swipePointerId = null;
    var touchSwipeActive = false;
    var blockSliderClick = false;

    var normalizeTeHandler = null;
    var normalizeFallbackId = null;
    var viewportWCache = null;

    function resetViewportWidthCache() {
      viewportWCache = null;
    }

    function viewportWidthOnce() {
      if (viewportWCache === null) viewportWCache = window.innerWidth;
      return viewportWCache;
    }

    function isMobileViewport() {
      return viewportWidthOnce() < BP_MOBILE;
    }

    function slidesToShow() {
      var w = viewportWidthOnce();
      if (w < BP_MOBILE) return 1;
      if (w < BP_TABLET) return 2;
      return 3;
    }

    function maxIndex() {
      return Math.max(0, itemRefs.length - slidesToShow());
    }

    function getTrackLayout() {
      var st = slidesToShow();
      var listWidth = list.clientWidth;
      if (!listWidth) return null;
      if (isMobileViewport()) {
        var slideWCm = listWidth * CENTER_SLIDE_FRACTION;
        return {
          slideW: slideWCm,
          centerShift: (listWidth - slideWCm) / 2,
          centerMode: true
        };
      }
      return {
        slideW: listWidth / st,
        centerShift: 0,
        centerMode: false
      };
    }

    function detachItemsFromDom() {
      itemRefs.forEach(function (node) {
        if (node && node.parentNode) node.parentNode.removeChild(node);
      });
    }

    function setImagesNoDrag() {
      Array.prototype.forEach.call(list.querySelectorAll("img"), function (img) {
        img.draggable = false;
      });
    }

    function buildTrack() {
      detachItemsFromDom();
      track.innerHTML = "";
      var st = slidesToShow();
      var n = itemRefs.length;
      var i;
      builtSt = st;
      infiniteMode = n > st && maxIndex() > 0;

      if (!infiniteMode) {
        itemRefs.forEach(function (item) {
          var slide = document.createElement("div");
          slide.className = "slick-slide";
          slide.appendChild(item);
          track.appendChild(slide);
        });
        leftPos = 0;
      } else {
        var cc = st;
        for (i = n - cc; i < n; i++) {
          var pre = document.createElement("div");
          pre.className = "slick-slide";
          pre.appendChild(itemRefs[i].cloneNode(true));
          track.appendChild(pre);
        }
        for (i = 0; i < n; i++) {
          var mid = document.createElement("div");
          mid.className = "slick-slide";
          mid.appendChild(itemRefs[i]);
          track.appendChild(mid);
        }
        for (i = 0; i < cc; i++) {
          var post = document.createElement("div");
          post.className = "slick-slide";
          post.appendChild(itemRefs[i].cloneNode(true));
          track.appendChild(post);
        }
        leftPos = cc;
      }
      setImagesNoDrag();
    }

    function pageIndex() {
      if (!infiniteMode) return leftPos;
      var st = slidesToShow();
      var n = itemRefs.length;
      var m = maxIndex();
      var lp = leftPos;
      while (lp >= st + n) lp -= n;
      if (lp === 0) lp = n;
      return Math.min(Math.max(lp - st, 0), m);
    }

    function clearNormalizeSchedule() {
      if (normalizeTeHandler) {
        track.removeEventListener("transitionend", normalizeTeHandler);
        normalizeTeHandler = null;
      }
      if (normalizeFallbackId) {
        clearTimeout(normalizeFallbackId);
        normalizeFallbackId = null;
      }
    }

    function normalizeAfterTransition() {
      if (!infiniteMode) return;
      var st = slidesToShow();
      var n = itemRefs.length;
      var changed = false;
      while (leftPos >= st + n) {
        leftPos -= n;
        changed = true;
      }
      if (leftPos === 0) {
        leftPos = n;
        changed = true;
      }
      if (!changed) return;
      track.style.transition = "none";
      render(false);
      void track.offsetHeight;
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          track.style.removeProperty("transition");
        });
      });
    }

    function scheduleNormalizeAfterTransition() {
      if (!infiniteMode) return;
      clearNormalizeSchedule();
      function runNormalize() {
        clearNormalizeSchedule();
        requestAnimationFrame(function () {
          requestAnimationFrame(normalizeAfterTransition);
        });
      }
      normalizeTeHandler = function onTrackTransitionEnd(e) {
        if (e.target !== track) return;
        var p = e.propertyName || "";
        if (p && p !== "transform" && p !== "-webkit-transform") return;
        runNormalize();
      };
      normalizeFallbackId = setTimeout(runNormalize, SLIDE_SPEED_MS + 100);
      track.addEventListener("transitionend", normalizeTeHandler);
    }

    function updateDragTransform() {
      resetViewportWidthCache();
      var layout = getTrackLayout();
      if (!layout) return;
      var tx = Math.round(-leftPos * layout.slideW + layout.centerShift + dragOffsetPx);
      track.style.transition = "none";
      track.style.transform = "translate3d(" + tx + "px,0,0)";
    }

    function render(animated) {
      resetViewportWidthCache();
      var st = slidesToShow();
      if (st !== builtSt) {
        var pi = Math.min(pageIndex(), maxIndex());
        buildTrack();
        var stNew = slidesToShow();
        leftPos = infiniteMode ? stNew + pi : Math.min(pi, maxIndex());
      }
      if (!infiniteMode) {
        leftPos = Math.max(0, Math.min(leftPos, maxIndex()));
      }

      var layout = getTrackLayout();
      if (!layout) return;
      var slideW = layout.slideW;
      var centerShift = layout.centerShift;
      var centerMode = layout.centerMode;
      container.classList.toggle("articles-slider--center-mode", centerMode);
      var slideEls = track.querySelectorAll(".slick-slide");
      Array.prototype.forEach.call(slideEls, function (s, i) {
        s.style.width = slideW + "px";
        s.classList.toggle("slick-center", centerMode && i === leftPos);
        s.classList.toggle("slick-current", centerMode && i === leftPos);
      });
      track.style.width = slideW * slideEls.length + "px";
      var tx = -leftPos * slideW + centerShift + dragOffsetPx;
      var useAnim = animated !== false;
      if (dragActive || !useAnim) tx = Math.round(tx);
      track.style.transition =
        dragActive || !useAnim ? "none" : "transform " + SLIDE_SPEED_MS + "ms " + SLIDE_EASING;
      track.style.transform = "translate3d(" + tx + "px,0,0)";

      var hideArrows = isMobileViewport();
      if (prevBtn) prevBtn.style.display = hideArrows ? "none" : "";
      if (nextBtn) nextBtn.style.display = hideArrows ? "none" : "";

      syncDots();
    }

    function syncDots() {
      if (!isMobileViewport()) {
        if (dotsWrap) {
          dotsWrap.remove();
          dotsWrap = null;
          container.classList.remove("slick-dotted");
        }
        return;
      }
      var cur = pageIndex();
      var pages = maxIndex() + 1;
      container.classList.add("slick-dotted");
      if (!dotsWrap || dotsWrap.children.length !== pages) {
        if (dotsWrap) dotsWrap.remove();
        dotsWrap = document.createElement("ul");
        dotsWrap.className = "slick-dots";
        for (var di = 0; di < pages; di++) {
          (function (dotPage) {
            var li = document.createElement("li");
            var btn = document.createElement("button");
            btn.type = "button";
            btn.textContent = String(dotPage + 1);
            btn.addEventListener("click", function () {
              var st2 = slidesToShow();
              leftPos = infiniteMode ? st2 + dotPage : dotPage;
              render(true);
              scheduleNormalizeAfterTransition();
            });
            li.appendChild(btn);
            dotsWrap.appendChild(li);
          })(di);
        }
        container.appendChild(dotsWrap);
      }
      Array.prototype.forEach.call(dotsWrap.querySelectorAll("li"), function (li, i) {
        li.classList.toggle("slick-active", i === cur);
      });
    }

    function stepNext() {
      var m = maxIndex();
      if (m <= 0) return;
      if (infiniteMode) {
        var n = itemRefs.length;
        if (leftPos === 0) leftPos = n + 1;
        else leftPos++;
      } else if (leftPos < m) {
        leftPos++;
      }
    }

    function stepPrev() {
      var m = maxIndex();
      if (m <= 0) return;
      if (infiniteMode) {
        var st = slidesToShow();
        var n = itemRefs.length;
        if (leftPos === st) leftPos = 0;
        else if (leftPos === 0) leftPos = n - 1;
        else leftPos--;
      } else if (leftPos > 0) {
        leftPos--;
      }
    }

    function goPrev() {
      stepPrev();
      render(true);
      scheduleNormalizeAfterTransition();
    }

    function goNext() {
      stepNext();
      render(true);
      scheduleNormalizeAfterTransition();
    }

    function applySwipeDelta() {
      var dx = swipeLastX - swipeStartX;
      var dy = swipeLastY - swipeStartY;
      dragActive = false;
      dragOffsetPx = 0;
      list.style.cursor = "grab";
      if (Math.abs(dx) < SWIPE_COMMIT_MIN_PX || Math.abs(dy) >= Math.abs(dx)) {
        render(false);
        return;
      }
      blockSliderClick = true;
      setTimeout(function () {
        blockSliderClick = false;
      }, CLICK_BLOCK_MS);
      if (dx < 0) stepNext();
      else stepPrev();
      render(true);
      scheduleNormalizeAfterTransition();
    }

    function removeDocPointerSwipeListeners() {
      document.removeEventListener("pointermove", docPointerMove);
      document.removeEventListener("pointerup", docPointerEnd);
      document.removeEventListener("pointercancel", docPointerEnd);
    }

    function docPointerMove(e) {
      if (e.pointerType === "touch") return;
      if (swipePointerId !== e.pointerId) return;
      swipeLastX = e.clientX;
      swipeLastY = e.clientY;
      var dx = swipeLastX - swipeStartX;
      var dy = swipeLastY - swipeStartY;
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > DRAG_AXIS_MIN_PX) {
        e.preventDefault();
        dragActive = true;
        dragOffsetPx = dx;
        updateDragTransform();
      }
    }

    function docPointerEnd(e) {
      if (e.pointerType === "touch") return;
      if (swipePointerId !== e.pointerId) return;
      removeDocPointerSwipeListeners();
      swipePointerId = null;
      list.style.cursor = "grab";
      if (e.type === "pointerup") {
        swipeLastX = e.clientX;
        swipeLastY = e.clientY;
      }
      applySwipeDelta();
    }

    function onListClickCapture(e) {
      if (blockSliderClick) {
        e.preventDefault();
        e.stopPropagation();
      }
    }

    function onTouchStart(e) {
      if (e.touches.length !== 1) return;
      touchSwipeActive = true;
      swipeStartX = e.touches[0].clientX;
      swipeStartY = e.touches[0].clientY;
      swipeLastX = swipeStartX;
      swipeLastY = swipeStartY;
      dragOffsetPx = 0;
    }

    function onTouchMove(e) {
      if (!touchSwipeActive || e.touches.length !== 1) return;
      swipeLastX = e.touches[0].clientX;
      swipeLastY = e.touches[0].clientY;
      var dx = swipeLastX - swipeStartX;
      var dy = swipeLastY - swipeStartY;
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > DRAG_AXIS_MIN_PX) {
        e.preventDefault();
        dragActive = true;
        dragOffsetPx = dx;
        updateDragTransform();
      }
    }

    function onTouchEnd(e) {
      if (!touchSwipeActive) return;
      touchSwipeActive = false;
      if (e.changedTouches.length !== 1) return;
      swipeLastX = e.changedTouches[0].clientX;
      swipeLastY = e.changedTouches[0].clientY;
      applySwipeDelta();
    }

    function onTouchCancel() {
      touchSwipeActive = false;
      dragActive = false;
      dragOffsetPx = 0;
      render(false);
    }

    function onPointerDownList(e) {
      if (e.pointerType === "touch") return;
      if (e.pointerType === "mouse" && e.button !== 0) return;
      if (swipePointerId !== null) {
        removeDocPointerSwipeListeners();
        swipePointerId = null;
        dragActive = false;
        dragOffsetPx = 0;
      }
      swipeStartX = e.clientX;
      swipeStartY = e.clientY;
      swipeLastX = e.clientX;
      swipeLastY = e.clientY;
      swipePointerId = e.pointerId;
      dragOffsetPx = 0;
      dragActive = false;
      list.style.cursor = "grabbing";
      document.addEventListener("pointermove", docPointerMove, { passive: false });
      document.addEventListener("pointerup", docPointerEnd);
      document.addEventListener("pointercancel", docPointerEnd);
    }

    function onResize() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        render(false);
      }, RESIZE_DEBOUNCE_MS);
    }

    if (prevBtn) prevBtn.addEventListener("click", goPrev);
    if (nextBtn) nextBtn.addEventListener("click", goNext);

    list.addEventListener("click", onListClickCapture, true);
    list.addEventListener("touchstart", onTouchStart, { passive: true });
    list.addEventListener("touchmove", onTouchMove, { passive: false });
    list.addEventListener("touchend", onTouchEnd, { passive: true });
    list.addEventListener("touchcancel", onTouchCancel, { passive: true });
    list.addEventListener("pointerdown", onPointerDownList, { passive: true });
    list.addEventListener("selectstart", function (e) {
      if (dragActive) e.preventDefault();
    });
    list.addEventListener("dragstart", function (e) {
      e.preventDefault();
    });
    window.addEventListener("resize", onResize, { passive: true });

    buildTrack();
    render(false);
  }



  function initFixedWrapperScroll() {
    var wrapper = document.getElementById("fixed-wrapper");
    if (!wrapper) return;
    var links = wrapper.querySelectorAll("a");
    var toTopElements = wrapper.querySelectorAll(".to-top");

    window.addEventListener(
      "scroll",
      function () {
        var scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
        var scrollTop = window.scrollY;
        var quarterHeight = scrollHeight * 0.08;
        var progress = Math.min(scrollTop / quarterHeight, 1);
        var rotation = 180 - progress * 180;

        wrapper.style.opacity = String(progress);
        wrapper.style.transform = "translateY(" + (20 - 20 * progress) + "px)";

        links.forEach(function (link) {
          link.style.transform = "rotate(" + rotation + "deg)";
        });
        toTopElements.forEach(function (toTop) {
          toTop.style.transform = "rotate(" + rotation + "deg)";
        });
      },
      { passive: true }
    );
  }

  onReady(function () {
    initMobileMenu();
    initAnchorScroll();
    initStickyHeader();
    initCookiesBanner();
    initModalClose();
    initExitModal();
    initArticlesSlider();
    initFixedWrapperScroll();
  });
})();
