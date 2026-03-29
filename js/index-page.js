/**
 * Index-only interactions (FAQ, contact form UI, reviews typing, video).
 * Loaded with defer to reduce parse/eval on initial main thread vs many inline blocks.
 */
(function () {
  "use strict";

  function onReady(fn) {
    if (document.readyState !== "loading") fn();
    else document.addEventListener("DOMContentLoaded", fn);
  }

  function scheduleIdle(cb, timeoutMs) {
    var timeout = timeoutMs != null ? timeoutMs : 2000;
    if (typeof window.requestIdleCallback === "function") {
      window.requestIdleCallback(cb, { timeout: timeout });
    } else {
      window.setTimeout(cb, 180);
    }
  }

  function initFaq() {
    document.querySelectorAll(".faq__item-header").forEach(function (header) {
      header.addEventListener("click", function () {
        var item = header.closest(".faq__item");
        if (item) item.classList.toggle("active");
      });
    });
  }

  function initCustomSelect() {
    var x = document.getElementsByClassName("custom-select");
    var i;
    var j;
    var l = x.length;
    var ll;
    var selElmnt;
    var a;
    var b;
    var c;

    for (i = 0; i < l; i++) {
      selElmnt = x[i].getElementsByTagName("select")[0];
      if (!selElmnt) continue;
      ll = selElmnt.length;

      a = document.createElement("DIV");
      a.setAttribute("class", "select-selected");
      a.innerHTML = selElmnt.options[selElmnt.selectedIndex].innerHTML;
      x[i].appendChild(a);

      b = document.createElement("DIV");
      b.setAttribute("class", "select-items select-hide");
      for (j = 1; j < ll; j++) {
        c = document.createElement("DIV");
        c.innerHTML = selElmnt.options[j].innerHTML;
        c.addEventListener("click", function (e) {
          var y;
          var k;
          var s;
          var h;
          var sl;
          var yl;
          s = this.parentNode.parentNode.getElementsByTagName("select")[0];
          sl = s.length;
          h = this.parentNode.previousSibling;
          for (var ii = 0; ii < sl; ii++) {
            if (s.options[ii].innerHTML === this.innerHTML) {
              s.selectedIndex = ii;
              h.innerHTML = this.innerHTML;
              y = this.parentNode.getElementsByClassName("same-as-selected");
              yl = y.length;
              for (k = 0; k < yl; k++) {
                y[k].removeAttribute("class");
              }
              this.setAttribute("class", "same-as-selected");
              break;
            }
          }
          h.click();
        });
        b.appendChild(c);
      }
      x[i].appendChild(b);
      a.addEventListener("click", function (e) {
        e.stopPropagation();
        closeAllSelect(this);
        this.nextSibling.classList.toggle("select-hide");
        this.classList.toggle("select-arrow-active");
      });
    }

    function closeAllSelect(elmnt) {
      var x;
      var y;
      var i;
      var xl;
      var yl;
      var arrNo = [];
      x = document.getElementsByClassName("select-items");
      y = document.getElementsByClassName("select-selected");
      xl = x.length;
      yl = y.length;
      for (i = 0; i < yl; i++) {
        if (elmnt === y[i]) {
          arrNo.push(i);
        } else {
          y[i].classList.remove("select-arrow-active");
        }
      }
      for (i = 0; i < xl; i++) {
        if (arrNo.indexOf(i)) {
          x[i].classList.add("select-hide");
        }
      }
    }

    document.addEventListener("click", closeAllSelect);

    document.querySelectorAll(".select-items div").forEach(function (div) {
      div.addEventListener("click", function () {
        var wrap = div.closest(".custom-select");
        var selected = wrap && wrap.querySelector(".select-selected");
        if (selected) selected.classList.add("active");
      });
    });
  }

  function initSubjectFields() {
    var subject = document.getElementById("subject");
    if (!subject) return;

    subject.addEventListener("change", function () {
      var additionalFields = document.querySelector(".additional-fields");
      if (!additionalFields) return;
      if (this.value === "get-started") {
        additionalFields.style.display = "block";
      } else {
        additionalFields.style.display = "none";
      }
    });

    document.querySelectorAll(".select-items div").forEach(function (item) {
      item.addEventListener("click", function () {
        var select = document.getElementById("subject");
        var additionalFields = document.querySelector(".additional-fields");
        if (!select || !additionalFields) return;
        if (select.value === "get-started") {
          additionalFields.style.display = "block";
        } else {
          additionalFields.style.display = "none";
        }
      });
    });
  }

  function initNumberInputs() {
    document.querySelectorAll(".custom-number-input").forEach(function (container) {
      var input = container.querySelector('input[type="number"]');
      var upBtn = container.querySelector(".arrow-up");
      var downBtn = container.querySelector(".arrow-down");
      var wrapper = container.closest(".input-wrapper");
      var tooltipWrapper = wrapper && wrapper.querySelector(".tooltip-wrapper");
      var tooltip = tooltipWrapper && tooltipWrapper.querySelector(".tooltip");

      if (!input || !upBtn || !downBtn) return;

      function showTooltip() {
        if (tooltip && !tooltip.classList.contains("visible")) {
          tooltip.classList.add("visible");
        }
      }

      upBtn.addEventListener("click", function (e) {
        e.preventDefault();
        input.stepUp();
        if (Number(input.value) < 0) input.value = 0;
        showTooltip();
      });

      downBtn.addEventListener("click", function (e) {
        e.preventDefault();
        input.stepDown();
        if (Number(input.value) < 0) input.value = 0;
        showTooltip();
      });
    });
  }

  function initTooltips() {
    var wrappers = document.querySelectorAll(".form-row--3 .input-wrapper");
    if (!wrappers.length) return;

    var manual = {};
    function key(w) {
      return "w_" + Array.prototype.indexOf.call(wrappers, w);
    }

    document.addEventListener(
      "focusin",
      function (e) {
        var t = e.target;
        if (!t.matches || !t.matches(".form-row--3 .input-wrapper input")) return;
        for (var w = 0; w < wrappers.length; w++) {
          var wrap = wrappers[w];
          if (wrap.contains(t)) continue;
          var tip = wrap.querySelector(".tooltip");
          if (tip) tip.classList.remove("visible");
        }
      },
      true
    );

    document.addEventListener("click", function (e) {
      for (var i = 0; i < wrappers.length; i++) {
        var wrapper = wrappers[i];
        if (wrapper.contains(e.target)) continue;
        var tt = wrapper.querySelector(".tooltip");
        if (tt) tt.classList.remove("visible");
        manual[key(wrapper)] = false;
      }
    });

    for (var j = 0; j < wrappers.length; j++) {
      (function (wrapper) {
        var input = wrapper.querySelector("input");
        var tooltipWrapper = wrapper.querySelector(".tooltip-wrapper");
        if (!tooltipWrapper || !input) return;
        var tooltip = tooltipWrapper.querySelector(".tooltip");
        var closeBtn = tooltip && tooltip.querySelector(".close-tooltip");
        if (!tooltip || !closeBtn) return;

        var k = key(wrapper);
        manual[k] = false;

        function showTooltip() {
          if (!manual[k]) {
            tooltip.classList.add("visible");
          }
        }

        function hideTooltip() {
          tooltip.classList.remove("visible");
          manual[k] = false;
        }

        input.addEventListener("focus", showTooltip);

        closeBtn.addEventListener("click", function () {
          tooltip.classList.remove("visible");
          manual[k] = true;
        });

        tooltipWrapper.addEventListener("mouseenter", function () {
          tooltip.classList.add("visible");
        });

        tooltipWrapper.addEventListener("mouseleave", function () {
          if (!input.matches(":focus")) {
            tooltip.classList.remove("visible");
          }
        });

        input.addEventListener("blur", function () {
          setTimeout(function () {
            if (!tooltipWrapper.matches(":hover")) {
              hideTooltip();
            }
          }, 100);
        });
      })(wrappers[j]);
    }
  }

  function initReviewTyping() {
    var texts = Array.prototype.slice.call(document.querySelectorAll(".review__text"));
    if (!texts.length) return;

    var currentIndex = 0;
    var typingSpeed = 40;
    var pauseAfterTyping = 1500;

    function typeText(element, text, callback) {
      var idx = 0;
      element.textContent = "";
      element.classList.add("active", "typing-cursor");
      var interval = window.setInterval(function () {
        element.textContent += text.charAt(idx);
        idx++;
        if (idx >= text.length) {
          window.clearInterval(interval);
          window.setTimeout(function () {
            element.classList.remove("active", "typing-cursor");
            element.textContent = "";
            callback();
          }, pauseAfterTyping);
        }
      }, typingSpeed);
    }

    function showNext() {
      var el = texts[currentIndex];
      var originalText = el.dataset.original;
      if (!originalText) {
        currentIndex = (currentIndex + 1) % texts.length;
        showNext();
        return;
      }
      typeText(el, originalText, function () {
        currentIndex = (currentIndex + 1) % texts.length;
        showNext();
      });
    }

    texts.forEach(function (el) {
      el.textContent = "";
      el.style.opacity = 1;
    });
    showNext();
  }

  function initVideoModal() {
    var playButton = document.querySelector(".play-button");
    var video = document.querySelector(".guide-video");
    if (!playButton || !video) return;

    var closeBtn = document.querySelector(".close");
    var modalContent = document.querySelector(".exit-modal__content");
    var videoCover = document.querySelector(".video-modal__video-cover");

    function stopVideo() {
      video.pause();
      video.currentTime = 0;
      video.removeAttribute("controls");
      playButton.classList.remove("hidden");
      if (videoCover) videoCover.classList.remove("hidden");
    }

    playButton.addEventListener("click", function (e) {
      e.stopPropagation();
      video.play();
      video.setAttribute("controls", "controls");
      playButton.classList.add("hidden");
      if (videoCover) videoCover.classList.add("hidden");
    });

    video.addEventListener("click", function (e) {
      e.stopPropagation();
      if (!video.paused) {
        stopVideo();
      }
    });

    if (closeBtn) {
      closeBtn.addEventListener("click", stopVideo);
    }

    document.addEventListener("click", function (e) {
      if (
        modalContent &&
        !modalContent.contains(e.target) &&
        !playButton.contains(e.target)
      ) {
        stopVideo();
      }
    });
  }

  onReady(function () {
    initFaq();
    initCustomSelect();
    initSubjectFields();
    initNumberInputs();
    initTooltips();
    initVideoModal();
    scheduleIdle(initReviewTyping, 2500);
  });
})();
